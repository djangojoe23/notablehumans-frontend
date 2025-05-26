import React, {useEffect, useRef} from 'react';
import {Box, Typography} from '@mui/material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from '@mui/material/styles';

import { SIDEBAR_WIDTH } from '../constants/layout';
import useSidebarGlobePadding from '../hooks/useSidebarGlobePadding';
import updateClusterVisualStates from "../utils/updateClusterVisualStates";
import { updateHaloForDetailedHuman, activateHaloForUnclustered} from '../utils/haloUtils';
import { buildClusterPopup } from '../utils/clusterPopup';

const buildFilteredGeoJSON = (notableHumans) => ({
  type: 'FeatureCollection',
  features: notableHumans.map(person => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [person.lng, person.lat],
    },
    properties: {
      ...person,
    },
  })),
});

const Globe = ({ notableHumans = [], filters, filterClauses, ...globeState }) => {
  const theme = useTheme();
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
          'circle-color': theme.palette.primary.main,
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
          'text-font': ['Ubuntu Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-offset': [-0.05, 0.15],
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
          'circle-color': theme.palette.primary.main,
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
          'text-font': ['Ubuntu Medium', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-anchor': 'center',
          'text-offset': [0, 0.15],
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
          'circle-color': theme.palette.primary.main,
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
        // Activate halo immediately for better click responsiveness
        activateHaloForUnclustered(globe, feature, globeState);
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
          totalCount,
          filters.sortBy,
          filters.sortAsc
        );
      });

      globe.on('click', (e) => {
        const features = globe.queryRenderedFeatures(e.point, {
          layers: ['clusters', 'unclustered-point'],
        });

        if (features.length === 0 && popupRef.current) {
          // Clicked on empty map, not on cluster or unclustered point
          popupRef.current.remove();
          popupRef.current = null;
          clusterWithPopupRef.current = { clusterId: null, lngLat: null, totalCount: 0 };
        }
      });

      globe.on('mouseenter', 'clusters', () => {
        globe.getCanvas().style.cursor = 'pointer';
      });

      globe.on('mouseleave', 'clusters', () => {
        globe.getCanvas().style.cursor = '';
      });

      globe.on('mouseenter', 'unclustered-point', () => {
        globe.getCanvas().style.cursor = 'pointer';
      });

      globe.on('mouseleave', 'unclustered-point', () => {
        globe.getCanvas().style.cursor = '';
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

  useEffect(() => {
    const globe = globeState.globeRef.current;
    if (!globe) return;

    const source = globe.getSource('humans');
    if (!source) return;

    const filteredGeoJSON = buildFilteredGeoJSON(notableHumans);
    source.setData(filteredGeoJSON);
  }, [notableHumans]);

  useEffect(() => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
      clusterWithPopupRef.current = { clusterId: null, lngLat: null, totalCount: 0 };
    }
  }, [notableHumans]);

  useEffect(() => {
    const human = globeState.detailedHuman;
    if (!human) return;

    const stillExists = notableHumans.some(h => h.id === human.id);

    if (!stillExists) {
      globeState.setDetailedHuman(null);

      // Also clean up halo manually if needed (already happens inside useEffect cleanup, but extra safe)
      const globe = globeState.globeRef.current;
      if (globe) {
        const haloSource = globe.getSource('halo');
        if (haloSource) {
          haloSource.setData({ type: 'FeatureCollection', features: [] });
        }
      }
    }
  }, [notableHumans]);


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
        sx={{
          position: 'absolute',
          top: 10,
          left: globeState.sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
          right: 0,
          transition: 'left 300ms ease-in-out',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255,255,255,0.85)',
            borderTop: `1px solid ${theme.palette.divider}`,
            padding: 1,
            borderRadius: 1,
            boxShadow: 1,
            fontSize: '13px',
            fontFamily: 'Roboto, sans-serif',
            pointerEvents: 'none',
            maxWidth: '85%',
            whiteSpace: 'normal',
            textAlign: 'center',
          }}
        >
           {/* First clause on its own line */}
            <Typography variant="h6" component="div" sx={{lineHeight: 1}}>
              {filterClauses[0]}
            </Typography>

            {/* Remaining clauses joined with “and”, only if any */}
            {filterClauses.length > 1 && (
              <Typography variant="body2" component="div" sx={{ mt: 0.5, fontSize: '1.1em' }}>
                {filterClauses.slice(1).map((clause, idx) => {
                  // split into “[prefix]includes” and the values string
                  const [prefix, valuesStr] = clause.split(/includes\s+/);
                  // if it’s not an “includes” clause, render it as-is
                  if (valuesStr == null) {
                    return (
                      <React.Fragment key={idx}>
                        {clause}
                        {idx < filterClauses.length - 2 && ' and '}
                      </React.Fragment>
                    );
                  }

                  // now split valuesStr on " and " or " or ", keeping the separators
                  const parts = valuesStr.split(/(\s(?:and|or)\s)/);

                  return (
                    <React.Fragment key={idx}>
                      {prefix}includes{' '}
                      {parts.map((part, i) => {
                        // if this part *is* “ and ” or “ or ”, render plain
                        if (/^( and | or )$/.test(part)) {
                          return <span key={i}>{part}</span>;
                        }
                        // otherwise it’s a value—italicize
                        return <em key={i}>{part}</em>;
                      })}
                      {idx < filterClauses.length - 2 && ' and '}
                    </React.Fragment>
                  );
                })}
              </Typography>
            )}
        </Box>
      </Box>

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