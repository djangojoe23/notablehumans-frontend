import { useState, useRef, useMemo } from 'react';
import useSyncedStateWithRef from './useSyncedStateWithRef';

export const useGlobeState = () => {
    // 1) Create refs and individual state

    /** @type {React.MutableRefObject<mapboxgl.Map | null>} */
    const globeRef = useRef(null);

    // this is the data on notable humans that is loaded on initial page load
    // it only includes names, birth/death dates, and birth/death coordinates
    const [geojsonData, setGeojsonData] = useState(null);
    const [geojsonLoadError, setGeojsonLoadError] = useState(null);
    const [sidebarOpen, setSidebarOpen, sidebarOpenRef] = useSyncedStateWithRef(false);

    // 2) Memoize the returned object so `globeState` only changes if one of these
    //    values changes. Note: setter functions and refs are stable, so we only
    //    list the actual state values as dependencies.
    return useMemo(() => ({
        globeRef,

        geojsonData,        setGeojsonData,
        geojsonLoadError,   setGeojsonLoadError,

        sidebarOpen,        setSidebarOpen,        sidebarOpenRef,
    }),
        [
            geojsonData,
            geojsonLoadError,
            sidebarOpen,
        ]
    );

};

export default useGlobeState;