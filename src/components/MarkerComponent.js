// MarkerComponent.js
import React, { useContext, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapContext } from './MapContext';

const MarkerComponent = ({ data }) => {
  const map = useContext(MapContext);

  // Helper function to convert your JSON data to GeoJSON
  const convertToGeoJSON = (data) => ({
    type: 'FeatureCollection',
    features: data.map((person) => {
      // Use birth_place coordinates; adjust as needed if you prefer death_place or another field.
      const lng = person.birth_place?.longitude;
      const lat = person.birth_place?.latitude;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: { ...person },
      };
    }),
  });

  useEffect(() => {
    if (!map || !data) return;

    const sourceId = 'humans';

    // If the source doesn't exist, add it along with clustering layers
    if (!map.getSource(sourceId)) {
      const geojsonData = convertToGeoJSON(data);

      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14, // Zoom level to cluster points on
        clusterRadius: 50,  // Radius of each cluster in pixels
      });

      // Add cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'fullyOverlapping'], false],
            '#11b4da', // color for clusters that are fully overlapping (same as singleton)
            '#f28cb1'  // default cluster color for declusterable clusters
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            10,
            20,
            30,
            25,
          ],
        },
      });

      // Add cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      // Add unclustered points
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });

      if (map.getLayer('clusters')) {
        // Listen for clicks on the clusters layer
        map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;

        const cluster = features[0];
        const state = map.getFeatureState({ source: 'humans', id: cluster.id });

        if (state && state.fullyOverlapping === true) {
          // For fully overlapping clusters, simply center without changing zoom.
          map.easeTo({
            center: cluster.geometry.coordinates,
            duration: 500
          });
        } else {
          // Otherwise, zoom to the cluster expansion level.
          const clusterId = cluster.properties.cluster_id;
          map.getSource('humans').getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
            if (err) return;
            map.easeTo({
              center: cluster.geometry.coordinates,
              zoom: expansionZoom,
              duration: 500
            });
          });
        }
      });

        // Change the cursor style when hovering over clusters
        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });
      }

      // Listen for clicks on unclustered points
      map.on('click', 'unclustered-point', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point'],
        });
        if (!features.length) return;
        const feature = features[0];
        const coordinates = feature.geometry.coordinates.slice(); // Copy to avoid mutation

        const currentZoom = map.getZoom();

        // Animate the map to center on the clicked point and zoom in
        map.easeTo({
          center: coordinates,
          zoom: currentZoom, // set to your desired zoom level
          duration: 500, // adjust duration as needed
        });
      });

      // Change the cursor style when hovering over unclustered points
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });

    } else {
      // If the source already exists, update its data
      map.getSource(sourceId).setData(convertToGeoJSON(data));
    }
  }, [map, data]);

  useEffect(() => {
    if (!map) return;

    const updateOverlapStates = () => {
      // Query only clusters that are rendered
      const clusters = map.queryRenderedFeatures({ layers: ['clusters'] });
      if (!clusters.length) return;

      const clampLat = (lat) => Math.max(-90, Math.min(90, lat));

      const bounds = map.getBounds();
      const margin = 0.1; // margin in degrees
      const extendedBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(bounds.getSouthWest().lng - margin, clampLat(bounds.getSouthWest().lat - margin)),
        new mapboxgl.LngLat(bounds.getNorthEast().lng + margin, clampLat(bounds.getNorthEast().lat + margin))
      );

      clusters.forEach((cluster) => {
        const clusterId = cluster.properties.cluster_id;
        const clusterCoordinates = cluster.geometry.coordinates;
        // Only process clusters that are inside (or nearly inside) the extended bounds.
        if (
          !extendedBounds.contains(new mapboxgl.LngLat(clusterCoordinates[0], clusterCoordinates[1]))
        ) {
          return;
        }
        const pointCount = cluster.properties.point_count;
        // Get all leaves for this cluster
        map.getSource('humans').getClusterLeaves(
          clusterId,
          pointCount,
          0,
          (err, leaves) => {
            if (err) return;
            const tolerance = 1e-3;
            const allOverlap = leaves.every((leaf) => {
              const [leafLng, leafLat] = leaf.geometry.coordinates;
              return (
                Math.abs(leafLng - clusterCoordinates[0]) < tolerance &&
                Math.abs(leafLat - clusterCoordinates[1]) < tolerance
              );
            });
            // Update feature state for styling
            map.setFeatureState(
              { source: 'humans', id: cluster.id },
              { fullyOverlapping: allOverlap }
            );
          }
        );
      });
    };

    // Simple debounce helper function
    const debounce = (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    // Create a debounced version of the update function with a 200ms delay.
    const debouncedUpdate = debounce(updateOverlapStates, 300);

    map.on('moveend', debouncedUpdate);

    // Call it initially as well
    debouncedUpdate();

    return () => {
      map.off('moveend', debouncedUpdate);
    };
}, [map]);

  return null; // This component does not render any DOM elements
};

export default MarkerComponent;
