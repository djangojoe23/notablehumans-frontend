import React, { useContext, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapContext } from './MapContext';
import { getOffset, startPulseAnimation, updateHaloForFeature } from './mapUtils';

// Throttle helper: runs func at most once every delay ms.
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

const clearHalo = (map, haloPersistRef, pulseAnimationFrameRef) => {
  if (pulseAnimationFrameRef.current) {
    cancelAnimationFrame(pulseAnimationFrameRef.current);
    pulseAnimationFrameRef.current = null;
  }
  if (map.getSource('halo-feature')) {
    map.getSource('halo-feature').setData({
      type: 'FeatureCollection',
      features: []
    });
  }
  haloPersistRef.current = false;
};

const MarkerComponent = ({ data, sidebarOpen, openSidebar, setSelectedListHuman }) => {
  const mapContext = useContext(MapContext) || {};
  const sidebarOpenRef = useRef(sidebarOpen);
  const currentHaloFeatureRef = useRef(null);

  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  // if (!mapContext) return null; // Prevent execution until the map is ready.
  const { map, isAnimatingRef, pulseAnimationFrameRef, haloPersistRef } = mapContext;

  useEffect(() => {
    if (!map || !data) return;
    const sourceId = 'humans';

    // If the humans source doesn't exist, add it and its layers.
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: data,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      // Add cluster circles.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        // filter: ['has', 'point_count'],
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
        // filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      // // Add unclustered points.
      // map.addLayer({
      //   id: 'unclustered-point',
      //   type: 'circle',
      //   source: sourceId,
      //   filter: ['!', ['has', 'point_count']],
      //   paint: {
      //     'circle-color': '#f28cb1',
      //     'circle-radius': 10,
      //   },
      // });
      //
      // // Add a symbol layer for the "1" label on unclustered points.
      // map.addLayer({
      //   id: 'unclustered-count',
      //   type: 'symbol',
      //   source: sourceId,
      //   filter: ['!', ['has', 'point_count']],
      //   layout: {
      //     'text-field': '1',
      //     'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      //     'text-size': 12,
      //     'text-offset': [0, 0],
      //   },
      // });

      // Define a helper to compute the sidebar offset.
      const offset = [0,0];//getOffset(sidebarOpenRef.current);

      // Cluster click handler.
      map.on('click', 'clusters', (e) => {
        e.originalEvent.stopPropagation();

        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const cluster = features[0];

        // If a halo is active, check if it's on the same cluster.
        if (haloPersistRef.current) {
          // For clusters, we assume currentHaloFeatureRef.current is a cluster if it has point_count.
          if (currentHaloFeatureRef.current &&
              currentHaloFeatureRef.current.properties.point_count &&
              currentHaloFeatureRef.current.id === cluster.id) {
            console.log("Halo already active for this cluster; ignoring click.");
            return;
          } else {
            console.log("Different cluster clicked; clearing old halo.");
            clearHalo(map, haloPersistRef, pulseAnimationFrameRef);
            currentHaloFeatureRef.current = null;
          }
        }


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
          // Retrieve all leaves (individual features) in the cluster.
          map.getSource('humans').getClusterLeaves(
            cluster.properties.cluster_id,
            pointCount, // retrieve all leaves
            0,          // starting offset
            (err, leaves) => {
              if (err) return;
              // Update the halo for the cluster.
              updateHaloForFeature(
                map,
                cluster,
                baseRadius,
                haloPersistRef,
                currentHaloFeatureRef,
                pulseAnimationFrameRef
              );
              isAnimatingRef.current = true;
              // Pass the array of leaves (each a human feature) to openSidebar.
              openSidebar(leaves);
              currentHaloFeatureRef.current = cluster;
              haloPersistRef.current = true;
              map.easeTo({
                center: cluster.geometry.coordinates,
                duration: 500,
                offset: offset,
              });
            }
          );
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

        // Check if a halo is active.
        if (haloPersistRef.current) {
          // Determine if the active halo is from a cluster or unclustered marker.
          const activeIsCluster = currentHaloFeatureRef.current && currentHaloFeatureRef.current.properties.point_count;

          if (!activeIsCluster) {
            // Active halo is unclustered.
            if (currentHaloFeatureRef.current &&
                currentHaloFeatureRef.current.properties.wikidata_id === feature.properties.wikidata_id) {
              console.log("Halo already active for this marker; ignoring click.");
              return;
            } else {
              console.log("Different unclustered marker clicked; clearing old halo.");
              clearHalo(map, haloPersistRef, pulseAnimationFrameRef);
              currentHaloFeatureRef.current = null;
            }
          } else {
            // Active halo is from a cluster—always clear it before processing an unclustered click.
            console.log("Active halo is a cluster; clearing halo for new unclustered marker click.");
            clearHalo(map, haloPersistRef, pulseAnimationFrameRef);
            currentHaloFeatureRef.current = null;
          }
        }

        // Proceed with activating the new halo.
        openSidebar([feature]);
        if (typeof setSelectedListHuman === 'function') {
          setSelectedListHuman(feature);
        }

        updateHaloForFeature(
          map,
          feature,
          feature.properties.markerRadius || 10,
          haloPersistRef,
          currentHaloFeatureRef,
          pulseAnimationFrameRef
        );
        currentHaloFeatureRef.current = feature;
        haloPersistRef.current = true;

        const coordinates = feature.geometry.coordinates.slice();
        const currentZoom = map.getZoom();
        isAnimatingRef.current = true;
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
      map.getSource(sourceId).setData(data);
    }
  }, [map, data, openSidebar]);

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

    // Throttle updateOverlapStates to run at most every 150ms.
    const throttledUpdate = throttle(updateOverlapStates, 150);

    // Listen to the "move" event instead of "moveend".
    map.on('move', throttledUpdate);

    // Optionally, run an immediate update.
    throttledUpdate();

    return () => {
      map.off('move', throttledUpdate);
    };
  }, [map]);

  return null;
};

export default MarkerComponent;
