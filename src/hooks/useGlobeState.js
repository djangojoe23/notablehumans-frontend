import { useState, useRef } from 'react';

const useGlobeState = () => {
  const globeRef = useRef(null); // Reference to the Mapbox instance

  const [notableHumans, setNotableHumans] = useState(null); // GeoJSON data
  const [error, setError] = useState(null); // Error fetching data

  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar visibility
  const [sidebarTrigger, setSidebarTrigger] = useState(null); // What triggered the sidebar
  const [sidebarMode, setSidebarMode] = useState('all'); // 'all' | 'location'
  const sidebarModeRef = useRef(null);

  const [selectedClusterHumans, setSelectedClusterHumans] = useState([]); // Data shown in sidebar
  const [lastMarkerCoordinates, setLastMarkerCoordinates] = useState(null); // Last marker/cluster clicked
  const lastMarkerCoordinatesRef = useRef(null);

  const [pendingClusterExpansion, setPendingClusterExpansion] = useState(null);
  // { clusterId, coordinates, isFullyOverlapping }

  const focusedZoomRef = useRef(null);



  return {
    globeRef,
    notableHumans, setNotableHumans,
    error, setError,
    sidebarOpen, setSidebarOpen,
    sidebarTrigger, setSidebarTrigger,
    sidebarMode, setSidebarMode,
    selectedClusterHumans, setSelectedClusterHumans,
    lastMarkerCoordinates, setLastMarkerCoordinates,
    pendingClusterExpansion, setPendingClusterExpansion,
    focusedZoomRef, lastMarkerCoordinatesRef, sidebarModeRef,
  };
};

export default useGlobeState;
