import { useState, useRef } from 'react';

const useGlobeState = () => {
  const globeRef = useRef(null); // Reference to the Mapbox instance

  const [notableHumans, setNotableHumans] = useState(null); // GeoJSON data
  const [error, setError] = useState(null); // Error fetching data

  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar visibility
  const [sidebarTrigger, setSidebarTrigger] = useState(null); // What triggered the sidebar

  const [selectedClusterHumans, setSelectedClusterHumans] = useState([]); // Data shown in sidebar
  const [lastMarkerCoordinates, setLastMarkerCoordinates] = useState(null); // Last marker/cluster clicked

  const [pendingClusterExpansion, setPendingClusterExpansion] = useState(null);
  // { clusterId, coordinates, isFullyOverlapping }

  return {
    globeRef,
    notableHumans, setNotableHumans,
    error, setError,
    sidebarOpen, setSidebarOpen,
    sidebarTrigger, setSidebarTrigger,
    selectedClusterHumans, setSelectedClusterHumans,
    lastMarkerCoordinates, setLastMarkerCoordinates,
    pendingClusterExpansion, setPendingClusterExpansion,
  };
};

export default useGlobeState;
