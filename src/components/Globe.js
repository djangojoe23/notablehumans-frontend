import React, {useEffect, useRef} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useSidebarGlobePadding from '../hooks/useSidebarGlobePadding';
import updateClusterVisualStates from "../utils/updateClusterVisualStates";
import { updateHaloForDetailedHuman, activateHaloForUnclustered} from '../utils/haloUtils';

const Globe = (globeState) => {
  const containerRef = useRef(null);
  const popupRef = useRef(null);


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
        if (!globeState.sidebarOpen) {
          globeState.setSidebarOpen(true);
        }

      });

      globe.on('click', 'clusters', (e) => {
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
        const feature   = e.features[0];
        const clusterId = feature.properties.cluster_id;
        const src       = globe.getSource('humans');
        const lngLat    = e.lngLat;

        // state
        let offset    = 0;
        const PAGE_SIZE = 50;
        let loading   = false;
        let done      = false;
        const LOAD_THRESHOLD = 0.75; // 75%

        // container
        const container = document.createElement('div');
        container.style.display        = 'flex';
        container.style.flexDirection  = 'column';
        container.style.position       = 'relative';
        container.style.width          = '100%';
        container.style.maxHeight      = '360px';
        container.style.boxSizing      = 'border-box';

        // close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent          = '×';
        closeBtn.style.position       = 'absolute';
        closeBtn.style.top            = '8px';
        closeBtn.style.right          = '8px';
        closeBtn.style.border         = 'none';
        closeBtn.style.background     = 'transparent';
        closeBtn.style.fontSize       = '16px';
        closeBtn.style.cursor         = 'pointer';
        container.appendChild(closeBtn);

        // Header showing total count
        const total = feature.properties.point_count;
        const header = document.createElement('div');
        header.textContent            = `${total} Notable Humans`;
        header.style.padding = '8px 32px 8px 8px';
        header.style.fontWeight       = 'bold';
        header.style.textAlign        = 'left';
        header.style.borderBottom     = '1px solid #ddd';
        container.appendChild(header);

        // scrollable list
        const listDiv = document.createElement('div');
        listDiv.style.flex            = '1';
        listDiv.style.overflowY       = 'auto';
        listDiv.style.padding         = '8px 8px 8px';    // top padding leaves room for closeBtn
        listDiv.style.boxSizing       = 'border-box';
        listDiv.style.width           = '100%';
        container.appendChild(listDiv);

        // popup
        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '280px' })
          .setLngLat(lngLat)
          .setDOMContent(container)
          .addTo(globe);
        popupRef.current = popup;

        function onScroll() {
          if (done || loading) return;
          const { scrollTop, scrollHeight, clientHeight } = listDiv;
          if (scrollTop + clientHeight >= LOAD_THRESHOLD * scrollHeight) {
            loadMore();
          }
        }

        listDiv.addEventListener('scroll', onScroll);

        // helper to load next batch
        function loadMore() {
          if (loading || done) return;
          loading = true;
          src.getClusterLeaves(clusterId, PAGE_SIZE, offset, (err, leaves) => {
            loading = false;
            if (err) return console.error(err);

            // inside loadMore(), instead of just setting textContent:
            leaves.forEach(l => {
              // 1) create the row div
              const row = document.createElement('div');
              row.style.padding      = '4px 0';
              row.style.borderBottom = '1px solid #eee';
              row.style.cursor       = 'pointer';       // show it’s clickable
              row.textContent        = l.properties.n;

              // 2) hover effect
              row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = '#f0f0f0';
              });
              row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
              });

              // 2) wire up click to mirror handleRowClick from Sidebar
              row.addEventListener('click', () => {
                // build the same human object you use elsewhere
                const human = {
                  ...l.properties,
                  lat: l.geometry.coordinates[1],
                  lng: l.geometry.coordinates[0],
                };

                // 2a) fly the globe
                const map = globeState.globeRef.current;
                if (map) {
                  map.flyTo({
                    center: [human.lng, human.lat],
                    zoom: map.getZoom(),
                    essential: true,
                  });
                }

                // 2b) open the sidebar & set detailedHuman
                globeState.setDetailedHuman(human);
                if (!globeState.sidebarOpen) {
                  globeState.setSidebarOpen(true);
                }
              });

              // 3) append into your list
              listDiv.appendChild(row);
            });

            // advance offset & check completion
            offset += leaves.length;
            if (leaves.length < PAGE_SIZE) {
              done = true;
            }
          });
        }

        // initial load
        loadMore();

        // ← NEW MOVEEND LOGIC
        // remember where we started, and close or refresh on zoom/pan
        const [origLng, origLat] = feature.geometry.coordinates;
        // NEW: watch map moves
        function onMapMoveEnd() {
          // if popup was already closed, stop listening
          if (!popupRef.current) {
            globe.off('moveend', onMapMoveEnd);
            return;
          }

          // project the cluster centroid back to screen pixels
          const pt = globe.project({ lng: origLng, lat: origLat });

          // query exactly that pixel in the clusters layer
          const hits = globe.queryRenderedFeatures(pt, { layers: ['clusters'] });
          const stillHere = hits.length
            && hits[0].properties.cluster_id === clusterId;

          if (!stillHere) {
            // cluster vanished or split → close everything
            listDiv.removeEventListener('scroll', onScroll);
            globe.off('moveend', onMapMoveEnd);
            popupRef.current.remove();
            popupRef.current = null;
          }
        }
        globe.on('moveend', onMapMoveEnd);

        // reposition on every moveend so it stays glued
        function updatePopupAnchor() {
          const popup = popupRef.current;
          if (!popup) {
            globe.off('moveend', updatePopupAnchor);
            return;
          }

          // 1) snap it back to the cluster’s real coord
          popup.setLngLat([origLng, origLat]);

          // 2) auto-close if the cluster is no longer in view
          const bounds = globe.getBounds();
          if (!bounds.contains([origLng, origLat])) {
            popup.remove();
            popupRef.current = null;
            globe.off('moveend', updatePopupAnchor);
          }
        }
        globe.on('moveend', updatePopupAnchor);

        // close button
        closeBtn.addEventListener('click', () => {
          listDiv.removeEventListener('scroll', onScroll);
          globe.off('moveend', onMapMoveEnd);
          popup.remove();
          popupRef.current = null;
        });
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