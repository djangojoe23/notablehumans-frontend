import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { SIDEBAR_WIDTH } from '../constants/layout';
import updateClusterVisualStates from '../utils/updateClusterVisualStates';
import { isMarkerStillFocused } from '../utils/mapValidation';
import { updateHaloForFeature } from '../utils/haloUtils';
import { sortHumansComparator } from '../utils/sortHumans';
import useClusterExpansion from '../hooks/useClusterExpansion';
import useSidebarMapPadding from '../hooks/useSidebarGlobePadding';
import 'mapbox-gl/dist/mapbox-gl.css';

const Globe = (props) => {
  const containerRef = useRef(null);
  const didFlyToCluster = useRef(false);

  // === Restore map initialization ===
  useEffect(() => {
    if (!containerRef.current) return;

    const globe = new mapboxgl.Map({
      container: containerRef.current,
      style: `mapbox://styles/${process.env.REACT_APP_MAPBOX_USER}/${process.env.REACT_APP_MAPBOX_STYLE_ID}`,
      accessToken: process.env.REACT_APP_MAPBOX_API_TOKEN,
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 16,
      projection: 'globe',
    });

    props.globeRef.current = globe;

    globe.on('load', () => {
      globe.addSource('humans', {
        type: 'geojson',
        data: props.notableHumans,
        cluster: true,
        clusterMaxZoom: 20,
        clusterRadius: 75,
      });

      globe.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'humans',
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
            15, 10,
            20, 30,
            25,
          ],
        },
      });

      globe.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'humans',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      globe.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'humans',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#f28cb1',
          'circle-radius': 10,
          'circle-stroke-width': 0,
        },
      });

      globe.addLayer({
        id: 'singleton-count',
        type: 'symbol',
        source: 'humans',
        filter: ['!', ['has', 'point_count']], // unclustered only
        layout: {
          'text-field': '1', // always show "1"
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-ignore-placement': true,
          'text-allow-overlap': true,
        },
      });

      globe.addSource('halo', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      globe.addLayer({
        id: 'halo-layer',
        type: 'circle',
        source: 'halo',
        paint: {
          'circle-radius': ['+', ['get', 'baseRadius'], ['get', 'pulseOffset']],
          'circle-color': '#f28cb1',
          'circle-opacity': 0.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',     // 👈 white border
          'circle-stroke-width': 2              // 👈 adjust thickness as needed
        }
      }, 'clusters'); // ← render *before* this, so it goes underneath both marker types

      globe.on('moveend', () => {
        setTimeout(() => updateClusterVisualStates(globe), 250);

        const currentMode = props.sidebarModeRef.current;
        const lastCoords = props.lastMarkerCoordinatesRef.current;

        if (currentMode !== 'location' || !lastCoords) return;

        const stillFocused = isMarkerStillFocused({
          globe,
          targetLngLat: lastCoords,
          focusedZoom: props.focusedZoomRef.current ?? globe.getZoom()
        });

        if (!stillFocused) {
          const all = props.notableHumans?.features?.map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })) ?? [];

          const sorted = all.sort((a, b) => a.n.localeCompare(b.n));
          props.setSelectedClusterHumans(sorted);
          props.setLastMarkerCoordinates(null);
          props.setPendingClusterExpansion(null);
          props.setSidebarMode('all');
          props.lastMarkerCoordinatesRef.current = null;
          props.focusedZoomRef.current = null;
          props.setSelectedListHuman(null);
          props.setExpandedHumanId(null);
          cancelAnimationFrame(props.pulseAnimationFrameRef.current);
          props.isAnimatingRef.current = false;
          globe.getSource('halo').setData({ type: 'FeatureCollection', features: [] });
        }
      });

      updateClusterVisualStates(globe);

      globe.on('click', 'clusters', (e) => {
        const cluster = globe.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        if (!cluster) return;

        const { cluster_id: clusterId } = cluster.properties;
        const coordinates = cluster.geometry.coordinates;

        if (!props.pendingClusterExpansion) props.setLastMarkerCoordinates(coordinates);
        props.setSidebarTrigger('marker');

        // Get the feature state
        const state = globe.getFeatureState({ source: 'humans', id: clusterId });
        const isFullyOverlapping = state?.fullyOverlapping ?? false;

        // Always update expansion logic
        props.setPendingClusterExpansion({ clusterId, coordinates, isFullyOverlapping });

        // === ✨ Sidebar content behavior ===
        if (isFullyOverlapping) {
          props.setSidebarMode('location');
          props.setLastMarkerCoordinates(coordinates);
          props.focusedZoomRef.current = globe.getZoom();

          globe.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
            if (err) return;
            const sorted = leaves.map(leaf => ({
              ...leaf.properties,
              lat: leaf.geometry.coordinates[1],
              lng: leaf.geometry.coordinates[0],
            })).sort((a, b) => a.n.localeCompare(b.n));
            props.setSelectedClusterHumans(sorted);

            function computeMarkerRadius(pointCount) {
              if (pointCount >= 30) return 25;
              if (pointCount >= 10) return 20;
              return 15;
            }
            const haloRadius = computeMarkerRadius(cluster.properties.point_count);
            const clusterFeatureWithId = {
              ...cluster,
              id: cluster.properties.cluster_id, // assign Mapbox-compatible feature ID
            };
            updateHaloForFeature(
              globe,
              clusterFeatureWithId,
              haloRadius,
              props.haloPersistRef,
              props.currentHaloFeatureRef,
              props.pulseAnimationFrameRef,
              props.isAnimatingRef
            );
          });
        } else {
          // Not fully overlapping — show everyone from the full dataset
          props.setSidebarMode('all');
          props.setSelectedListHuman(null);
          props.setExpandedHumanId(null);
          props.focusedZoomRef.current = null;

          const all = props.notableHumans?.features?.map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })) ?? [];

          const sorted = all.sort((a, b) => a.n.localeCompare(b.n));
          props.setSelectedClusterHumans(sorted);

          // 🔥 Full halo cleanup
          if (props.isAnimatingRef.current) {
            cancelAnimationFrame(props.pulseAnimationFrameRef.current);
            props.isAnimatingRef.current = false;
          }

          globe.getSource('halo').setData({
            type: 'FeatureCollection',
            features: [],
          });

          props.currentHaloFeatureRef.current = null;
        }

        if (!props.sidebarOpen) props.setSidebarOpen(true);
      });

      globe.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coordinates = feature.geometry.coordinates;
        const human = {
          ...feature.properties,
          lat: coordinates[1],
          lng: coordinates[0],
        };
        props.setSelectedClusterHumans([human]);
        props.setSidebarTrigger('marker');
        props.setLastMarkerCoordinates(coordinates);
        props.setSidebarMode('location');
        props.focusedZoomRef.current = globe.getZoom();

        props.setSelectedListHuman(human);
        props.setExpandedHumanId(human.id);

        const featureWithId = {
          ...feature,
          id: feature.id ?? feature.properties.id, // fallback to a unique identifier you control
        };
        updateHaloForFeature(
          globe,
          featureWithId,
          feature.properties.markerRadius || 10,
          props.haloPersistRef,
          props.currentHaloFeatureRef,
          props.pulseAnimationFrameRef,
          props.isAnimatingRef
        );

        if (props.sidebarOpen) {
          globe.easeTo({
            center: coordinates,
            padding: { left: SIDEBAR_WIDTH, right: 0, top: 0, bottom: 0 },
            duration: 600,
            easing: t => t,
            essential: true,
          });
        } else {
          props.setSidebarOpen(true);
        }
      });

    // create the popup once
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    // now bind cluster hover here:
    globe.on('mouseenter', 'clusters', (e) => {
      globe.getCanvas().style.cursor = 'pointer';
      const cluster = e.features?.[0];
      if (!cluster) return;

      const coords = cluster.geometry.coordinates.slice();
      const count = cluster.properties.point_count;
      const cmp = sortHumansComparator(
        props.sortByRef.current,
        props.sortAscRef.current
      );

      globe.getSource('humans').getClusterLeaves(cluster.properties.cluster_id, Infinity, 0, (err, allLeaves) => {
        if (err) return;

        // clone + sort by the *current* refs
        const sorted = [...allLeaves].sort((a, b) => cmp(a.properties, b.properties));
        const topTen = sorted.slice(0, 10);


        const listItems = topTen.map((l, i) => {
          const ell = (i === sorted.length - 1 && count > 10) ? '…' : '';
          return `<li>${l.properties.n}${ell}</li>`;
        }).join('');

        const footer = count > 10
          ? `<div style="font-style:italic;color:#666">
               ${globe.getFeatureState({ source:'humans', id:cluster.properties.cluster_id }).fullyOverlapping
                 ? 'Click for full list.'
                 : 'Click to expand.'}
             </div>`
          : '';

        popup
          .setLngLat(coords)
          .setHTML(`
            <div style="max-width:200px">
              <strong>${count} people</strong>
              <ul style="margin:4px 0;padding-left:16px">
                ${listItems}
              </ul>
              ${footer}
            </div>
          `)
          .addTo(globe);
      });
    });

    globe.on('mouseleave', 'clusters', () => {
      globe.getCanvas().style.cursor = '';
      popup.remove();
    });


      // === Unclustered point hover ===
      globe.on('mouseenter', 'unclustered-point', (e) => {
        globe.getCanvas().style.cursor = 'pointer';
        const feature = e.features?.[0];
        if (!feature) return;

        const coordinates = feature.geometry.coordinates.slice();
        const name = feature.properties.n;

        popup
          .setLngLat(coordinates)
          .setHTML(`
            <div style="max-width: 200px;">
              <strong>1 person</strong>
              <ul style="margin: 4px 0; padding-left: 16px;">
                <li>${name}</li>
              </ul>
            </div>
          `)
          .addTo(globe);
      });

      globe.on('mouseleave', 'unclustered-point', () => {
        globe.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    const handleResize = () => globe.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      globe.remove();
      props.globeRef.current = null;
    };
  }, [props.notableHumans]);

  // === Cluster expansion hook ===
  useClusterExpansion({
    globeRef: props.globeRef,
    sidebarOpen: props.sidebarOpen,
    sidebarTrigger: props.sidebarTrigger,
    pendingClusterExpansion: props.pendingClusterExpansion,
    setPendingClusterExpansion: props.setPendingClusterExpansion,
    setLastMarkerCoordinates: props.setLastMarkerCoordinates
  });

  // apply flyTo/padding behavior when sidebar is opened/closed
  useSidebarMapPadding({
    globeRef: props.globeRef,
    sidebarOpen: props.sidebarOpen,
    sidebarTrigger: props.sidebarTrigger,
    lastMarkerCoordinates: props.lastMarkerCoordinates,
    pendingClusterExpansion: props.pendingClusterExpansion,
    didFlyToCluster: didFlyToCluster
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  );
};

export default Globe;