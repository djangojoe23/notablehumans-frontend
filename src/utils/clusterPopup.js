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
      display: none !important;
    }
  `;
  document.head.appendChild(globalStyle);
}

export function buildClusterPopup(globe, globeState, popupRef, clusterId, lngLat, totalCount, sortBy, sortAsc) {
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

  // Create popup with wrapper class to disable default padding/shadow
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: '320px',
    className: 'cluster-popup-wrapper'
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
      Object.assign(row.style, {
        padding: '8px 16px',
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        transition: 'background 0.2s',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.body2.fontSize,
      });
      row.textContent = l.properties.n;

      row.addEventListener('mouseenter', () => row.style.backgroundColor = '#f5f5f5');
      row.addEventListener('mouseleave', () => row.style.backgroundColor = '');

      row.addEventListener('click', async () => {
        const id = l.properties.id;
        const [lng, lat] = l.geometry.coordinates;
        globe.flyTo({ center: [lng, lat], zoom: globe.getZoom(), essential: true });
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/human/${id}/`);
          globeState.setDetailedHuman({ ...res.data, lat, lng });
          if (!globeState.sidebarOpenRef?.current && !globeState.sidebarOpen) {
            globeState.setSidebarOpen(true);
          }
        } catch {
          globeState.setDetailedHuman(null);
        }
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

  globe.getSource('humans').getClusterLeaves(clusterId, totalCount, 0, (err, leaves) => {
    if (err) return console.error(err);
    const cmp = sortHumansComparator(sortBy, sortAsc);
    sortedLeaves = leaves.sort((a, b) => cmp(a.properties, b.properties));
    renderChunk();
  });

  closeBtn.addEventListener('click', () => {
    listDiv.removeEventListener('scroll', onScroll);
    popup.remove();
    popupRef.current = null;
  });

  // Keep anchored
  const [origLng, origLat] = Array.isArray(lngLat) ? lngLat : [lngLat.lng, lngLat.lat];
  function updateOnMoveEnd() {
    const p = popupRef.current;
    if (!p) {
      globe.off('moveend', updateOnMoveEnd);
      return;
    }
    const point = globe.project({ lng: origLng, lat: origLat });
    const hits = globe.queryRenderedFeatures(point, { layers: ['clusters'] });
    const stillHere = hits.length > 0 && hits[0].properties.cluster_id === clusterId;
    if (!stillHere) {
      globe.off('moveend', updateOnMoveEnd);
      listDiv.removeEventListener('scroll', onScroll);
      p.remove();
      popupRef.current = null;
    } else {
      p.setLngLat([origLng, origLat]);
    }
  }

  globe.on('moveend', updateOnMoveEnd);
}