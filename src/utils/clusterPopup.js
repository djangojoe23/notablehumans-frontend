import mapboxgl from 'mapbox-gl';
import theme from '../theme';
import axios from "axios";
import {sortHumansComparator} from "../utils/sortHumans";

function getClusterRadius(totalCount) {
    if (totalCount === 1) {
        // “singleton” feature, drawn with radius 8
        return 8;
    }
    if (totalCount <= 100) {
        const t = (totalCount - 1) / 99;       // 99 = 100 - 1
        return 11 + t * 19;                   // 19 = (30 - 11)
    }
    if (totalCount <= 1000) {
        const t = (totalCount - 100) / 900;    // 900 = 1000 - 100
        return 30 + t * 10;                   // 10 = (40 - 30)
    }
    if (totalCount <= 10000) {
        const t = (totalCount - 1000) / 9000;  // 9000 = 10000 - 1000
        return 40 + t * 10;                   // 10 = (50 - 40)
    }
    return 50;
}

export function matchesFilter(properties, filteredHumansIdSet) {
  // Simply check if this human’s id is in the Set you passed down.
  // If filteredHumansIdSet is undefined, treat that as “no filter” => keep everything:
  if (!filteredHumansIdSet) return true;
  return filteredHumansIdSet.has(properties.id);
}

export function buildClusterPopup(event, clusterContextRef, popupRef, popupListDivRef, globeState, filterState, filterdHumansIdSet, leavesOverride=null){
    // Remove existing popup
    if (popupRef.current) {
        closePopup(popupRef, popupListDivRef, clusterContextRef)
    }

    const feature = event.features[0];
    const totalCount = feature.properties.point_count ?? 1;
    let singletonFeature = null;
    if (totalCount === 1) {
        singletonFeature = feature;
    }
    const [clusterLng, clusterLat] = feature.geometry.coordinates;
    const lngLat     = [clusterLng, clusterLat];
    const clusterId = feature.properties.cluster_id; //is undefined if singleton

    clusterContextRef.current = {
        clusterId,
        lngLat: [clusterLng, clusterLat],
        totalCount,
        singletonFeature
    };

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
        .cluster-popup-wrapper .mapboxgl-popup-content { padding: 0 !important; }
        .cluster-popup .list-container::-webkit-scrollbar { width: 6px; }
        .cluster-popup .list-container::-webkit-scrollbar-track { background: transparent; }
        .cluster-popup .list-container::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.3); border-radius: 3px; }
        .cluster-popup .list-container { scrollbar-width: thin; }
        .cluster-popup .human-row {
            padding: 8px 16px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
            font-family: ${theme.typography.fontFamily};
            font-size: ${theme.typography.body2.fontSize};
        }
        .cluster-popup .human-row:not(.selected):hover {
            background: #f5f5f5;
        }
        .cluster-popup .human-row.selected {
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
        fontSize: theme.typography.h3.fontSize,
        cursor: 'pointer',
        color: '#666',
        padding: '0',
        lineHeight: '1',
    });
    container.appendChild(closeBtn);

    // Header
    const header = document.createElement('div');
    header.textContent = `${totalCount} Notable Human${totalCount === 1 ? '' : 's'}`;
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
    popupListDivRef.current = document.createElement('div');
    popupListDivRef.current.classList.add('list-container');
    Object.assign(popupListDivRef.current.style, {
        flex: '1',
        overflowY: 'auto',
        padding: '8px 0',
        width: '100%',
    });
    container.appendChild(popupListDivRef.current);

    const radius = getClusterRadius(totalCount);
    const popupOffset = radius + 3;
    popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '320px',
        className: 'cluster-popup-wrapper',
        anchor: 'bottom',
        offset: popupOffset
    })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(globeState.globeRef.current);

    closeBtn.addEventListener('click', () => {
        closePopup(popupRef, popupListDivRef, clusterContextRef)
    });

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
            row.classList.add('human-row');
            row.dataset.humanId = l.properties.id;
            row.textContent = l.properties.n;

            popupListDivRef.current.appendChild(row);
        });
        currentPage++;
        if (currentPage * PAGE_SIZE >= sortedLeaves.length) {
            done = true;
            popupListDivRef.current.removeEventListener('scroll', onScroll);
        }
    }

    function onScroll() {
        if (done) return;
        const { scrollTop, scrollHeight, clientHeight } = popupListDivRef.current;
        if (scrollTop + clientHeight >= LOAD_THRESHOLD * scrollHeight) {
            renderChunk();
        }
    }
    popupListDivRef.current.addEventListener('scroll', onScroll);

    // pre-filtered array of “leaf” features/GeoJSON human individual from moveend in Globe.js
    const leavesLoader = leavesOverride
        ? Promise.resolve(leavesOverride)
        : totalCount === 1
            // singleton: just wrap the one feature in an array
            ? Promise.resolve([ feature ])
            // true cluster: ask Mapbox for all of its leaves
            : new Promise((resolve, reject) => {
                globeState.globeRef.current.getSource('humans').getClusterLeaves(
                  clusterId,
                  totalCount,
                  0,
                  (err, leaves) => (err ? reject(err) : resolve(leaves))
                );
            });

    leavesLoader.then((leaves) => {
        // 1. Filter out any features that no longer match the sidebar filters:
        const passingLeaves = leaves.filter(l => matchesFilter(l.properties, filterdHumansIdSet));

        // 2. If nothing passes, immediately close the popup:
        if (passingLeaves.length === 0) {
            closePopup(popupRef, popupListDivRef, clusterContextRef);
            return;
        }

        // 3. Otherwise, sort and page the “passingLeaves” instead of the original array:
        const cmp = sortHumansComparator(filterState.sortByRef.current, filterState.sortAscRef.current);
        sortedLeaves = passingLeaves.sort((a, b) => cmp(a.properties, b.properties));
        renderChunk();
    })
    .catch(console.error);
}

export function closePopup(popupRef, popupListDivRef, clusterContextRef, removeOnly=false) {
    if (popupListDivRef.current) {
        const oldList = popupListDivRef.current;
        const newList = oldList.cloneNode(false); // same tag/class, but no children/listeners
        oldList.parentNode.replaceChild(newList, oldList);
        popupListDivRef.current = newList;       // point the ref to the fresh node
    }
    if (popupRef.current) {
        popupRef.current.remove();
    }

    popupRef.current = null;
    popupListDivRef.current = null;
    if (!removeOnly){
         clusterContextRef.current = null;
    }
}