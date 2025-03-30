// MarkerComponent.js
import React, { useContext, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapContext } from './MapContext';

/**
 * Converts JSON data to a GeoJSON FeatureCollection.
 * Adds a fixed markerRadius property for unclustered points.
 */
const convertToGeoJSON = (data) => ({
  type: 'FeatureCollection',
  features: data.map((person) => {
    const lng = person.birth_place?.longitude;
    const lat = person.birth_place?.latitude;
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: { ...person, markerRadius: 10 },
    };
  }),
});

/**
 * Computes the offset for centering the map.
 * Returns an offset if the sidebar is closed, otherwise [0,0].
 */
const getOffset = (sidebarOpen) => {
  const sidebarWidth = 400; // Adjust as needed.
  return sidebarOpen ? [0, 0] : [sidebarWidth / -2, 0];
};

/**
 * Starts a pulse animation on the current halo feature.
 * The animation updates the feature's `pulseOffset` property over time.
 */
const startPulseAnimation = (map, currentHaloFeatureRef, pulseAnimationFrameRef) => {
  // Cancel any existing animation
  if (pulseAnimationFrameRef.current) {
    cancelAnimationFrame(pulseAnimationFrameRef.current);
  }
  const duration = 2000; // Pulse period in ms.
  const maxPulse = 10;   // Maximum additional radius.
  const startTime = performance.now();
  const animate = (now) => {
    const t = ((now - startTime) % duration) / duration; // value between 0 and 1.
    const pulseOffset = maxPulse * Math.abs(Math.sin(t * Math.PI * 2));
    if (currentHaloFeatureRef.current) {
      currentHaloFeatureRef.current.properties.pulseOffset = pulseOffset;
      // Update the halo-feature source with the modified feature.
      map.getSource('halo-feature').setData(currentHaloFeatureRef.current);
    }
    pulseAnimationFrameRef.current = requestAnimationFrame(animate);
  };
  pulseAnimationFrameRef.current = requestAnimationFrame(animate);
};

/**
 * Updates the halo feature for the clicked marker/cluster.
 * Sets its base radius and starts the pulse animation.
 */
const updateHaloForFeature = (map, feature, baseRadius, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef) => {
  const haloFeature = {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      baseRadius: baseRadius,
      pulseOffset: 0,
    },
  };
  currentHaloFeatureRef.current = haloFeature;
  map.getSource('halo-feature').setData({
    type: 'FeatureCollection',
    features: [haloFeature],
  });
  // Mark the halo as persistent.
  haloPersistRef.current = true;
  startPulseAnimation(map, currentHaloFeatureRef, pulseAnimationFrameRef);
};

const MarkerComponent = ({ data, sidebarOpen, openSidebar }) => {
  const { map, isAnimatingRef, pulseAnimationFrameRef, haloPersistRef } = useContext(MapContext);
  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);
  const currentHaloFeatureRef = useRef(null);

  useEffect(() => {
    if (!map || !data) return;
    const sourceId = 'humans';

    // If the humans source doesn't exist, add it and its layers.
    if (!map.getSource(sourceId)) {
      const geojsonData = convertToGeoJSON(data);
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Add cluster circles.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'fullyOverlapping'], false],
            '#f28cb1',
            '#11b4da',
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

      // Add cluster count labels.
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

      // Add unclustered points.
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#f28cb1',
          'circle-radius': 10,
        },
      });

      // Add a symbol layer for the "1" label on unclustered points.
      map.addLayer({
        id: 'unclustered-count',
        type: 'symbol',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '1',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 0],
        },
      });

      // Define a helper to compute the sidebar offset.
      const offset = getOffset(sidebarOpenRef.current);

      // Cluster click handler.
      map.on('click', 'clusters', (e) => {
        e.originalEvent.stopPropagation();
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const cluster = features[0];
        const state = map.getFeatureState({ source: 'humans', id: cluster.id });
        if (state && state.fullyOverlapping === true) {
          // Compute base radius for clusters based on point count.
          const pointCount = cluster.properties.point_count;
          let baseRadius = 15;
          if (pointCount >= 10 && pointCount < 30) {
            baseRadius = 20;
          } else if (pointCount >= 30) {
            baseRadius = 25;
          }
          updateHaloForFeature(
            map,
            cluster,
            baseRadius,
            haloPersistRef,
            currentHaloFeatureRef,
            pulseAnimationFrameRef
          );
          isAnimatingRef.current = true;
          openSidebar(cluster.properties);
          map.easeTo({
            center: cluster.geometry.coordinates,
            duration: 500,
            offset: offset,
          });
        } else {
          // If clusters aren't fully overlapping, expand the cluster.
          const clusterId = cluster.properties.cluster_id;
          map.getSource('humans').getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
            if (err) return;
            map.easeTo({
              center: cluster.geometry.coordinates,
              zoom: expansionZoom,
              duration: 1000,
            });
          });
        }
      });

      // Unclustered point click handler.
      map.on('click', 'unclustered-point', (e) => {
        e.originalEvent.stopPropagation();
        const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        if (!features.length) return;
        const feature = features[0];
        updateHaloForFeature(
          map,
          feature,
          feature.properties.markerRadius || 10,
          haloPersistRef,
          currentHaloFeatureRef,
          pulseAnimationFrameRef
        );
        const coordinates = feature.geometry.coordinates.slice();
        const currentZoom = map.getZoom();
        isAnimatingRef.current = true;
        openSidebar(feature.properties);
        map.easeTo({
          center: coordinates,
          zoom: currentZoom,
          duration: 500,
          offset: getOffset(sidebarOpenRef.current),
        });
      });

      // Set cursor styles.
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });
    } else {
      // If the source already exists, update its data.
      map.getSource(sourceId).setData(convertToGeoJSON(data));
    }
  }, [map, data, openSidebar]);

  // Update cluster overlap states (unchanged).
  useEffect(() => {
    if (!map) return;
    const updateOverlapStates = () => {
      const clusters = map.queryRenderedFeatures({ layers: ['clusters'] });
      if (!clusters.length) return;
      const clampLat = (lat) => Math.max(-90, Math.min(90, lat));
      const bounds = map.getBounds();
      const margin = 0.1;
      const extendedBounds = new mapboxgl.LngLatBounds(
        new mapboxgl.LngLat(bounds.getSouthWest().lng - margin, clampLat(bounds.getSouthWest().lat - margin)),
        new mapboxgl.LngLat(bounds.getNorthEast().lng + margin, clampLat(bounds.getNorthEast().lat + margin))
      );
      clusters.forEach((cluster) => {
        const clusterId = cluster.properties.cluster_id;
        const clusterCoordinates = cluster.geometry.coordinates;
        if (!extendedBounds.contains(new mapboxgl.LngLat(clusterCoordinates[0], clusterCoordinates[1]))) {
          return;
        }
        const pointCount = cluster.properties.point_count;
        map.getSource('humans').getClusterLeaves(clusterId, pointCount, 0, (err, leaves) => {
          if (err) return;
          const tolerance = 1e-3;
          const allOverlap = leaves.every((leaf) => {
            const [leafLng, leafLat] = leaf.geometry.coordinates;
            return (
              Math.abs(leafLng - clusterCoordinates[0]) < tolerance &&
              Math.abs(leafLat - clusterCoordinates[1]) < tolerance
            );
          });
          map.setFeatureState({ source: 'humans', id: cluster.id }, { fullyOverlapping: allOverlap });
        });
      });
    };

    // Debounce helper.
    const debounce = (func, delay) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          func(...args);
        }, delay);
      };
    };

    const debouncedUpdate = debounce(updateOverlapStates, 300);
    map.on('moveend', debouncedUpdate);
    debouncedUpdate();
    return () => {
      map.off('moveend', debouncedUpdate);
    };
  }, [map]);

  return null;
};

export default MarkerComponent;
