// Globe.js
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { SIDEBAR_WIDTH } from '../constants/layout';
import updateClusterVisualStates from '../utils/updateClusterVisualStates';
import useClusterExpansion from '../hooks/useClusterExpansion';
import useSidebarMapPadding from '../hooks/useSidebarMapPadding';
import 'mapbox-gl/dist/mapbox-gl.css';

const Globe = ({
  globeRef,
  notableHumans,
  setSelectedClusterHumans,
  sidebarOpen,
  setSidebarOpen,
  sidebarTrigger,
  setSidebarTrigger,
  lastMarkerCoordinates,
  setLastMarkerCoordinates,
  pendingClusterExpansion,
  setPendingClusterExpansion
}) => {
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

    globeRef.current = globe;

    globe.on('load', () => {
      globe.addSource('humans', {
        type: 'geojson',
        data: notableHumans,
        cluster: true,
        clusterMaxZoom: 20,
        clusterRadius: 50,
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
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });

      globe.on('moveend', () => setTimeout(() => updateClusterVisualStates(globe), 100));
      updateClusterVisualStates(globe);

      globe.on('click', 'clusters', (e) => {
        const cluster = globe.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        if (!cluster) return;

        const { cluster_id: clusterId } = cluster.properties;
        const coordinates = cluster.geometry.coordinates;

        if (!pendingClusterExpansion) setLastMarkerCoordinates(coordinates);

        setSidebarTrigger('marker');

        globe.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
          if (err) return;
          const sorted = leaves.map(l => l.properties).sort((a, b) => a.name.localeCompare(b.name));
          setSelectedClusterHumans(sorted);
        });

        const state = globe.getFeatureState({ source: 'humans', id: clusterId });
        const isFullyOverlapping = state?.fullyOverlapping ?? false;

        setPendingClusterExpansion({ clusterId, coordinates, isFullyOverlapping });

        if (!sidebarOpen) setSidebarOpen(true);
      });

      globe.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coordinates = feature.geometry.coordinates;
        setSidebarTrigger('marker');
        setSelectedClusterHumans([feature.properties]);
        setLastMarkerCoordinates(coordinates);

        if (sidebarOpen) {
          globe.easeTo({
            center: coordinates,
            padding: { left: SIDEBAR_WIDTH, right: 0, top: 0, bottom: 0 },
            duration: 600,
            easing: t => t,
            essential: true,
          });
        } else {
          setSidebarOpen(true);
        }
      });

      globe.on('mouseenter', 'clusters', () => globe.getCanvas().style.cursor = 'pointer');
      globe.on('mouseleave', 'clusters', () => globe.getCanvas().style.cursor = '');
      globe.on('mouseenter', 'unclustered-point', () => globe.getCanvas().style.cursor = 'pointer');
      globe.on('mouseleave', 'unclustered-point', () => globe.getCanvas().style.cursor = '');
    });

    const handleResize = () => globe.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      globe.remove();
      globeRef.current = null;
    };
  }, [notableHumans]);

  // === Cluster expansion hook ===
  useClusterExpansion({
    globeRef,
    sidebarOpen,
    sidebarTrigger,
    pendingClusterExpansion,
    setPendingClusterExpansion,
    setLastMarkerCoordinates
  });

  // apply flyTo/padding behavior when sidebar is opened/closed
  useSidebarMapPadding({
    globeRef,
    sidebarOpen,
    sidebarTrigger,
    lastMarkerCoordinates,
    pendingClusterExpansion,
    didFlyToCluster
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
