import React, {useEffect, useRef} from 'react';
import { Box } from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import useSidebarGlobePadding from '../hooks/useSidebarGlobePadding';
import updateClusterVisualStates from "../utils/updateClusterVisualStates";
import { updateHaloForDetailedHuman} from '../utils/haloUtils';
import { buildClusterPopup } from '../utils/clusterPopup';

const Globe = (globeState) => {
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  const clusterWithPopupRef = useRef({ clusterId: null, lngLat: null, totalCount: 0 });


  useEffect(() => {
    if (!containerRef.current || !globeState.notableHumanData) return;

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

    globeState.globeRef.current = globe;

    globe.on('load', () => {
      globe.addSource('humans', {
        type: 'geojson',
        data: globeState.notableHumanData,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      globe.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'humans',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#f28cb1',
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'fullyOverlapping'], false],
            '#666',
            'transparent'
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'fullyOverlapping'], false],
            2,
            0
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
        paint: {
          'text-color': '#444',
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
          'circle-stroke-width': 2,
          'circle-stroke-color': '#666'
        },
      });

      globe.addLayer({
        id: 'singleton-count',
        type: 'symbol',
        source: 'humans',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': '1',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-ignore-placement': true,
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#444',
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
          'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
          'circle-stroke-width': 2
        }
      });

      globe.once('idle', () => {
        updateClusterVisualStates(globe);
      });

      globe.on('moveend', () => {
        setTimeout(() => updateClusterVisualStates(globe), 250);
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

        globeState.justClickedUnclusteredRef.current = true;

        globeState.setDetailedHuman(human);
        if (!globeState.sidebarOpenRef.current) {
          globeState.setSidebarOpen(true);
        }

      });

      globe.on('click', 'clusters', (e) => {
        const feature   = e.features[0];
        const clusterId = feature.properties.cluster_id;
        const [clusterLng, clusterLat] = feature.geometry.coordinates;
        const lngLat     = [clusterLng, clusterLat];
        const totalCount = feature.properties.point_count;

        clusterWithPopupRef.current = { clusterId, lngLat, totalCount };

        buildClusterPopup(
          globe,
          globeState,
          popupRef,
          clusterId,
          lngLat,
          totalCount
        );
      });
    });

    const handleResize = () => globe.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      globe.remove();
      globeState.globeRef.current = null;
    };
  }, [globeState.notableHumanData]);

  useSidebarGlobePadding({
    globeRef: globeState.globeRef,
    sidebarOpen: globeState.sidebarOpen,
  });

// When a human is selected in sidebar: fly, halo, and keep synced on zoom/pan
  useEffect(() => {
    const map = globeState.globeRef.current;
    const human = globeState.detailedHuman;
    if (!map) return;

    // helper to clear existing halo
    const clearHalo = () => {
      const src = map.getSource('halo');
      if (src) src.setData({ type: 'FeatureCollection', features: [] });
      if (globeState.haloAnimationFrameRef.current) {
        cancelAnimationFrame(globeState.haloAnimationFrameRef.current);
        globeState.isHaloActiveRef.current = false;
      }
    };

    // if panel closed, clear and exit
    if (!human) {
      clearHalo();
      return;
    }

    // fly to human at current zoom
    const zoom = map.getZoom();
    const lng = parseFloat(human.lng);
    const lat = parseFloat(human.lat);
    map.flyTo({ center: [lng, lat], zoom, essential: true });

    // after initial move, draw halo around correct cluster/point
    const afterMove = () => {
      void updateHaloForDetailedHuman(map, human, globeState);
      map.off('moveend', afterMove);
    };
    map.once('moveend', afterMove);

    // on subsequent zoom/pan, re-draw halo (no re-centering)
    const updateOnMoveEnd = () => {
      void updateHaloForDetailedHuman(map, human, globeState);
    };
    map.on('moveend', updateOnMoveEnd);

    // cleanup listener and clear halo on change/close
    return () => {
      map.off('moveend', updateOnMoveEnd);
      clearHalo();
    };
  }, [globeState.detailedHuman]);

  useEffect(() => {
    const { clusterId, lngLat, totalCount } = clusterWithPopupRef.current;
    if (!clusterId || !popupRef.current) return;

    buildClusterPopup(
      globeState.globeRef.current,
      globeState,
      popupRef,
      clusterId,
      lngLat,
      totalCount
    );
  }, [globeState.sortBy, globeState.sortAsc]);

  return (
    <Box position="relative" width="100%" height="100%">
      <Box
        ref={containerRef}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
      />
    </Box>
  );

};

export default Globe;