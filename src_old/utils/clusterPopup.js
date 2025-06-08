import mapboxgl from 'mapbox-gl';
import theme from '../theme';
import { sortHumansComparator } from './sortHumans';
import axios from 'axios';

// Inject global styles once to override Mapbox popup defaults
if (typeof document !== 'undefined' && !document.getElementById('cluster-popup-global-styles')) {
  const globalStyle = document.createElement('style');
  globalStyle.id = 'cluster-popup-global-styles';
  globalStyle.textContent = `
    .cluster-popup-wrapper .mapboxgl-popup-content {
      padding: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    .cluster-popup-wrapper .mapboxgl-popup-tip {
      /* you can customize arrow color if needed */
      border-color: ${theme.palette.background.paper} transparent transparent transparent;
    }
  `;
  document.head.appendChild(globalStyle);
}

export function buildClusterPopup(globe,
                                  globeState,
                                  popupRef,
                                  clusterId,
                                  lngLat,
                                  totalCount,
                                  sortBy,
                                  sortAsc,
                                  unclusteredFeature=null,
                                  listDivRef=null) {
  // Remove existing popup
  if (popupRef.current) {
    popupRef.current.remove();
    popupRef.current = null;
  }

  // Create container
  const container = document.createElement('div');
  container.classList.add('cluster-popup');
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
    maxHeight: '360px',
    boxSizing: 'border-box',
    // Use theme typography for font
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: '4px',
    overflow: 'hidden',
  });

  // Inject scrollbar styles for this popup
  const style = document.createElement('style');
  style.textContent = `
    .cluster-popup .list-container::-webkit-scrollbar { width: 6px; }
    .cluster-popup .list-container::-webkit-scrollbar-track { background: transparent; }
    .cluster-popup .list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.3); border-radius: 3px; }
    .cluster-popup .list-container { scrollbar-width: thin; }
    .cluster-popup .cluster-row {
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
      font-family: ${theme.typography.fontFamily};
      font-size: ${theme.typography.body2.fontSize};
    }
    .cluster-popup .cluster-row:not(.selected):hover {
      background: #f5f5f5;
    }
    .cluster-popup .cluster-row.selected {
      background: ${theme.palette.action.selected};
      font-weight: 600;
    }
  `;
  container.appendChild(style);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: '10',
    border: 'none',
    background: 'transparent',
    fontSize: theme.typography.h6.fontSize,
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    lineHeight: '1',
  });
  container.appendChild(closeBtn);

  // Header
  const header = document.createElement('div');
  header.textContent = `${totalCount} Notable Humans`;
  Object.assign(header.style, {
    padding: '12px 16px',
    paddingRight: '40px', // space for close button
    fontWeight: theme.typography.subtitle2.fontWeight,
    fontFamily: theme.typography.fontFamily,
    fontSize: '1em',
    borderBottom: '1px solid #ddd',
    textAlign: 'left',
    backgroundColor: '#fafafa',
  });
  container.appendChild(header);

  // List container
  const listDiv = document.createElement('div');
  listDiv.classList.add('list-container');
  Object.assign(listDiv.style, {
    flex: '1',
    overflowY: 'auto',
    padding: '8px 0',
    width: '100%',
  });
  container.appendChild(listDiv);
  if (listDivRef) {
    listDivRef.current = listDiv;
  }

  // Calculate radius-based offset
  const baseRadius =
    totalCount === 1 ? 10 :
    totalCount >= 30 ? 25 :
    totalCount >= 10 ? 20 : 15;
  const popupOffset = baseRadius + 3;

  // Create popup with wrapper class to disable default padding/shadow
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: '320px',
    className: 'cluster-popup-wrapper',
    anchor: 'bottom',
    offset: popupOffset
  })
    .setLngLat(lngLat)
    .setDOMContent(container)
    .addTo(globe);
  popupRef.current = popup;

  // Pagination
  const PAGE_SIZE = 50;
  const LOAD_THRESHOLD = 0.75;
  let sortedLeaves = [];
  let currentPage = 0;
  let done = false;

  function renderChunk() {
    const start = currentPage * PAGE_SIZE;
    const chunk = sortedLeaves.slice(start, start + PAGE_SIZE);
    chunk.forEach(l => {
      const row = document.createElement('div');
      row.classList.add('cluster-row');
      row.dataset.humanId = l.properties.id;
      row.textContent = l.properties.n;

      // ★ Highlight the detailed human ★
      if (globeState.detailedHuman && globeState.detailedHuman.id === l.properties.id
      ) {
        row.classList.add('selected');
        setTimeout(() => row.scrollIntoView({ block: 'center' }), 0);
      }

      row.addEventListener('click', async () => {
        const humanId = l.properties.id;
        const [humanLng, humanLat] = l.geometry.coordinates;

        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/human/${humanId}/`);
          // --- CLUSTER CONTEXT you already have in closure: ---
          const count = totalCount;      // passed into buildClusterPopup
          const baseRadius =
            count >= 30 ? 25 :
            count >= 10 ? 20 : 15;
          const clusterContext = {
            id: clusterId,
            coords: lngLat,
            baseRadius,
          };
          globeState.setDetailedHuman({
              ...res.data,
              id: humanId,
              lng: humanLng,
              lat: humanLat,
              clusterContext,
          });
          if (!globeState.sidebarOpenRef?.current && !globeState.sidebarOpen) {
            globeState.setSidebarOpen(true);
          }
        }
        catch (err){
          console.error(err);
          globeState.setDetailedHuman(null);
        }
        updateClusterPopupHighlight(listDiv, l.properties.id);
      });
      listDiv.appendChild(row);
    });
    currentPage++;
    if (currentPage * PAGE_SIZE >= sortedLeaves.length) {
      done = true;
      listDiv.removeEventListener('scroll', onScroll);
    }
  }

  function onScroll() {
    if (done) return;
    const { scrollTop, scrollHeight, clientHeight } = listDiv;
    if (scrollTop + clientHeight >= LOAD_THRESHOLD * scrollHeight) {
      renderChunk();
    }
  }
  listDiv.addEventListener('scroll', onScroll);

  const leavesLoader = unclusteredFeature
    ? Promise.resolve([ unclusteredFeature ])
    : new Promise((resolve, reject) => {
        globe.getSource('humans').getClusterLeaves(
          clusterId,
          totalCount,
          0,
          (err, leaves) => err ? reject(err) : resolve(leaves)
        );
      });

  leavesLoader
    .then((leaves) => {
      const cmp = sortHumansComparator(sortBy, sortAsc);
      sortedLeaves = leaves.sort((a, b) => cmp(a.properties, b.properties));
      renderChunk();
    })
    .catch(console.error);

  closeBtn.addEventListener('click', () => {
    listDiv.removeEventListener('scroll', onScroll);
    popup.remove();
    popupRef.current = null;
  });

  // Keep anchored / auto-close logic for both clustered and unclustered points
  {
      // Store original coordinates
      const [origLng, origLat] = Array.isArray(lngLat)
        ? lngLat
        : [lngLat.lng, lngLat.lat];

      function updateOnMoveEnd() {
        const popupInstance = popupRef.current;
        if (!popupInstance) {
          // Popup already gone — detach listener and return
          globe.off('moveend', updateOnMoveEnd);
          return;
        }

        // Project the original coords to screen space
        const screenPt = globe.project({ lng: origLng, lat: origLat });

        // Decide which layer to query: 'clusters' if clusterId exists, else 'unclustered-point'
        const layerName = unclusteredFeature ? 'unclustered-point' : 'clusters';
        const hits = globe.queryRenderedFeatures(screenPt, {
          layers: [layerName]
        });

        let stillVisible = false;

        if (unclusteredFeature) {
          // For unclusteredFeature, check that feature with matching id is still in view
          if (hits.length > 0) {
            for (const f of hits) {
              if (f.properties.id === unclusteredFeature.properties.id) {
                stillVisible = true;
                break;
              }
            }
          }
        } else {
          // For clustered points, check that the same clusterId is still rendered
          stillVisible =
            hits.length > 0 &&
            hits[0].properties.cluster_id === clusterId;
        }

        if (!stillVisible) {
          // Dissolved or zoomed out: remove popup + scroll listener + map listener
          if (listDiv && onScroll) {
            listDiv.removeEventListener('scroll', onScroll);
          }
          popupInstance.remove();
          popupRef.current = null;
          globe.off('moveend', updateOnMoveEnd);
        }
        // No need to re-call setLngLat—Mapbox automatically repositions popups on camera change
      }

      // Attach the listener so it fires after each pan/zoom
      globe.on('moveend', updateOnMoveEnd);
    }
  }

// helper to re-highlight when detailedHuman changes
export function updateClusterPopupHighlight(listDiv, selectedId) {
  listDiv.querySelectorAll('.cluster-row').forEach(row => {
    if (selectedId != null && row.dataset.humanId === String(selectedId)) {
      row.classList.add('selected');
      row.scrollIntoView({ block: 'center' });
    } else {
      row.classList.remove('selected');
    }
  });
}
