import { useState, useRef } from 'react';
import useSyncedStateWithRef from './useSyncedStateWithRef';

const useGlobeState = () => {
  const globeRef = useRef(null); // Mapbox instance
  const [notableHumans, setNotableHumans] = useState(null);
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTrigger, setSidebarTrigger] = useState(null);

  // ✅ Use synced state/ref pairs
  const [sidebarMode, setSidebarMode, sidebarModeRef] = useSyncedStateWithRef('all');
  const [lastMarkerCoordinates, setLastMarkerCoordinates, lastMarkerCoordinatesRef] = useSyncedStateWithRef(null);

  const [selectedClusterHumans, setSelectedClusterHumans] = useState([]);
  const [selectedListHuman, setSelectedListHuman] = useState(null);
  const [pendingClusterExpansion, setPendingClusterExpansion] = useState(null);
  const focusedZoomRef = useRef(null);

  const [expandedHumanId, setExpandedHumanId] = useState(null);

  const haloPersistRef = useRef(null); // last halo data
  const currentHaloFeatureRef = useRef(null); // current feature pulsing
  const pulseAnimationFrameRef = useRef(null); // for canceling animation
  const isAnimatingRef = useRef(false); // control loop

  const [sortBy, setSortBy, sortByRef] = useSyncedStateWithRef('n');
  const [sortAsc, setSortAsc, sortAscRef] = useSyncedStateWithRef(true);


  return {
    globeRef,
    notableHumans, setNotableHumans,
    error, setError,
    sidebarOpen, setSidebarOpen,
    sidebarTrigger, setSidebarTrigger,

    // Synced state+ref pairs
    sidebarMode, setSidebarMode, sidebarModeRef,
    lastMarkerCoordinates, setLastMarkerCoordinates, lastMarkerCoordinatesRef,

    selectedClusterHumans, setSelectedClusterHumans,
    selectedListHuman,setSelectedListHuman,
    pendingClusterExpansion, setPendingClusterExpansion,
    focusedZoomRef,
    expandedHumanId, setExpandedHumanId,
    haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef,

    sortBy, setSortBy, sortByRef,
    sortAsc, setSortAsc, sortAscRef
  };
};

export default useGlobeState;
