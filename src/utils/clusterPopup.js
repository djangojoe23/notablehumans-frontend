import mapboxgl from 'mapbox-gl';
import { sortHumansComparator } from './sortHumans';
import axios from 'axios';


export function buildClusterPopup(globe, globeState, popupRef, clusterId, lngLat, totalCount, sortBy, sortAsc) {
  if (popupRef.current) {
    popupRef.current.remove();
    popupRef.current = null;
  }

  // --- Create container
  const container = document.createElement('div');
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
    maxHeight: '360px',
    boxSizing: 'border-box',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: '0.875rem',
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  });

  // --- Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666',
  });
  container.appendChild(closeBtn);

  // --- Header
  const header = document.createElement('div');
  header.textContent = `${totalCount} Notable Humans`;
  Object.assign(header.style, {
    padding: '12px 16px 12px 16px',
    fontWeight: '600',
    borderBottom: '1px solid #ddd',
    textAlign: 'left',
    backgroundColor: '#fafafa',
  });
  container.appendChild(header);

  // --- Scrollable list
  const listDiv = document.createElement('div');
  Object.assign(listDiv.style, {
    flex: '1',
    overflowY: 'auto',
    padding: '8px 0px',
    width: '100%',
  });
  container.appendChild(listDiv);

  // --- Create popup
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '320px' })
    .setLngLat(lngLat)
    .setDOMContent(container)
    .addTo(globe);
  popupRef.current = popup;

  // --- Pagination State
  const PAGE_SIZE = 50;
  const LOAD_THRESHOLD = 0.75;
  let sortedLeaves = [];
  let currentPage = 0;
  let done = false;

  // --- Render chunk of humans
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
      });
      row.textContent = l.properties.n;

      row.addEventListener('mouseenter', () => row.style.backgroundColor = '#f5f5f5');
      row.addEventListener('mouseleave', () => row.style.backgroundColor = '');

      row.addEventListener('click', async () => {
        const id = l.properties.id;
        const lat = l.geometry.coordinates[1];
        const lng = l.geometry.coordinates[0];

        globe.flyTo({ center: [lng, lat], zoom: globe.getZoom(), essential: true });

        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/human/${id}/`);

          globeState.setDetailedHuman({
            ...res.data,
            lat,
            lng,
          });

          if (!globeState.sidebarOpenRef?.current && !globeState.sidebarOpen) {
            globeState.setSidebarOpen(true);
          }
        } catch (err) {
          console.error("Failed to fetch detailed human", err);
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

  // --- Scroll loader
  function onScroll() {
    if (done) return;
    const { scrollTop, scrollHeight, clientHeight } = listDiv;
    if (scrollTop + clientHeight >= LOAD_THRESHOLD * scrollHeight) {
      renderChunk();
    }
  }
  listDiv.addEventListener('scroll', onScroll);

  // --- Initial fetch
  globe.getSource('humans').getClusterLeaves(clusterId, totalCount, 0, (err, leaves) => {
    if (err) return console.error(err);
    const cmp = sortHumansComparator(sortBy, sortAsc);
    sortedLeaves = leaves.sort((a, b) => cmp(a.properties, b.properties));
    renderChunk();

  });

  // --- Close button
  closeBtn.addEventListener('click', () => {
    listDiv.removeEventListener('scroll', onScroll);
    popup.remove();
    popupRef.current = null;
  });

  // --- Keep popup anchored on cluster
  const [origLng, origLat] = Array.isArray(lngLat)
    ? lngLat
    : [lngLat.lng, lngLat.lat];

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
