import mapboxgl from 'mapbox-gl';
import { sortHumansComparator } from './sortHumans';

/**
 * buildClusterPopup - utility to show a sorted, paginated cluster popup
 *
 * @param {mapboxgl.Map}            globe       - Mapbox GL map instance
 * @param {object}                  globeState  - shared state (must include setDetailedHuman, sidebarOpen)
 * @param {import('react').MutableRefObject} popupRef - ref holding the current popup
 * @param {number}                  clusterId   - cluster_id from the cluster feature
 * @param {mapboxgl.LngLatLike}     lngLat      - coordinates to anchor the popup
 * @param {number}                  totalCount  - total number of points in this cluster
 */
export function buildClusterPopup(
    globe,
    globeState,
    popupRef,
    clusterId,
    lngLat,
    totalCount)
{
  // tear down existing popup
  if (popupRef.current) {
    popupRef.current.remove();
    popupRef.current = null;
  }

  // container
  const container = document.createElement('div');
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: '100%',
    maxHeight: '360px',
    boxSizing: 'border-box',
  });

  // close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '8px',
    right: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    cursor: 'pointer',
  });
  container.appendChild(closeBtn);

  // header showing total
  const header = document.createElement('div');
  header.textContent = `${totalCount} Notable Humans`;
  Object.assign(header.style, {
    padding: '8px 32px 8px 8px',
    fontWeight: 'bold',
    borderBottom: '1px solid #ddd',
    textAlign: 'left',
  });
  container.appendChild(header);

  // scrollable list
  const listDiv = document.createElement('div');
  Object.assign(listDiv.style, {
    flex: '1',
    overflowY: 'auto',
    padding: '8px',
    boxSizing: 'border-box',
    width: '100%',
  });
  container.appendChild(listDiv);

  // create popup
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '280px' })
    .setLngLat(lngLat)
    .setDOMContent(container)
    .addTo(globe);
  popupRef.current = popup;

  // pagination state
  const PAGE_SIZE = 50;
  const LOAD_THRESHOLD = 0.75;
  let sortedLeaves = [];
  let currentPage = 0;
  let done = false;

  // render one chunk of sorted leaves
  function renderChunk() {
    const start = currentPage * PAGE_SIZE;
    const chunk = sortedLeaves.slice(start, start + PAGE_SIZE);
    chunk.forEach(l => {
      const row = document.createElement('div');
      Object.assign(row.style, {
        padding: '4px 0', borderBottom: '1px solid #eee', cursor: 'pointer'
      });
      row.textContent = l.properties.n;

      row.addEventListener('mouseenter', () => row.style.backgroundColor = '#f0f0f0');
      row.addEventListener('mouseleave', () => row.style.backgroundColor = '');

      row.addEventListener('click', () => {
        const human = {
          ...l.properties,
          lat: l.geometry.coordinates[1],
          lng: l.geometry.coordinates[0]
        };
        globe.flyTo({ center: [human.lng, human.lat], zoom: globe.getZoom(), essential: true });
        globeState.setDetailedHuman(human);
        if (!globeState.sidebarOpenRef?.current && !globeState.sidebarOpen) {
          globeState.setSidebarOpen(true);
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

  // scroll loader
  function onScroll() {
    if (done) return;
    const { scrollTop, scrollHeight, clientHeight } = listDiv;
    if (scrollTop + clientHeight >= LOAD_THRESHOLD * scrollHeight) {
      renderChunk();
    }
  }
  listDiv.addEventListener('scroll', onScroll);

  // initial fetch: get all leaves, sort globally, then render first chunk
  globe.getSource('humans').getClusterLeaves(clusterId, totalCount, 0, (err, leaves) => {
    if (err) return console.error(err);
    const cmp = sortHumansComparator(globeState.sortByRef.current, globeState.sortAscRef.current);
    sortedLeaves = leaves.sort((a, b) => cmp(a.properties, b.properties));
    renderChunk();
  });


  // close popup on button click
  closeBtn.addEventListener('click', () => {
    listDiv.removeEventListener('scroll', onScroll);
    popup.remove();
    popupRef.current = null;
  });

  // keep popup anchored & auto-close if cluster vanishes or splits
  const [origLng, origLat] = Array.isArray(lngLat)
    ? lngLat
    : [lngLat.lng, lngLat.lat];

  function updateOnMoveEnd() {
    const p = popupRef.current;
    if (!p) {
      globe.off('moveend', updateOnMoveEnd);
      return;
    }

    // 1) Check that the same clusterId is still rendered at that location
    const point = globe.project({ lng: origLng, lat: origLat });
    const hits  = globe.queryRenderedFeatures(point, { layers: ['clusters'] });
    const stillHere = hits.length > 0 && hits[0].properties.cluster_id === clusterId;
    if (!stillHere) {
      globe.off('moveend', updateOnMoveEnd);
      listDiv.removeEventListener('scroll', onScroll);
      p.remove();
      popupRef.current = null;
      return;
    }

    // 2) Re‑anchor the popup
    p.setLngLat([origLng, origLat]);
  }

  globe.on('moveend', updateOnMoveEnd);
}
