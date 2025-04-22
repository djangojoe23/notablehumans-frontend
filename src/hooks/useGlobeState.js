import { useState, useRef } from 'react';
import useSyncedStateWithRef from './useSyncedStateWithRef';


const useGlobeState = () => {
  const globeRef = useRef(null);

  const [notableHumanData, setNotableHumanData] = useState(null);
  const [dataLoadError, setDataLoadError] = useState(null);

  const [sidebarOpen, setSidebarOpen, sidebarOpenRef] = useSyncedStateWithRef(false);

  const [detailedHuman, setDetailedHuman] = useState(null);

  const isHaloActiveRef = useRef(false);
  const haloAnimationFrameRef = useRef(null);
  const haloPersistRef = useRef(null);
  const currentHaloFeatureRef = useRef(null);

  const justClickedUnclusteredRef = useRef(null);

  const [sortBy,  setSortBy,  sortByRef]  = useSyncedStateWithRef('n');
  const [sortAsc, setSortAsc, sortAscRef] = useSyncedStateWithRef(true);



  return {
    globeRef,

    notableHumanData, setNotableHumanData,
    dataLoadError, setDataLoadError,

    sidebarOpen, setSidebarOpen, sidebarOpenRef,

    detailedHuman, setDetailedHuman,

    isHaloActiveRef, haloAnimationFrameRef, haloPersistRef, currentHaloFeatureRef,

    justClickedUnclusteredRef,

    sortBy, setSortBy, sortByRef,
    sortAsc, setSortAsc, sortAscRef,

  };
};

export default useGlobeState;
