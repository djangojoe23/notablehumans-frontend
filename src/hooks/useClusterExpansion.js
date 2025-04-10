// hooks/useClusterExpansion.js
import { useEffect, useRef } from 'react';
import { SIDEBAR_WIDTH } from '../constants/layout';

const useClusterExpansion = ({
  globeRef,
  sidebarOpen,
  sidebarTrigger,
  pendingClusterExpansion,
  setPendingClusterExpansion,
  setLastMarkerCoordinates
}) => {
  const didFlyToCluster = useRef(false);

  useEffect(() => {
    const map = globeRef.current;
    if (!map || !sidebarOpen || !pendingClusterExpansion || sidebarTrigger !== 'marker') return;

    const { clusterId, coordinates, isFullyOverlapping } = pendingClusterExpansion;

    // Step 1: center the map with sidebar padding
    map.easeTo({
      center: coordinates,
      padding: { left: SIDEBAR_WIDTH, right: 0, top: 0, bottom: 0 },
      duration: 600,
      easing: t => t,
      essential: true,
    });

    didFlyToCluster.current = true;

    // Step 2: on moveend, zoom to expansion level (unless fully overlapping)
    const handleMoveEnd = () => {
      if (isFullyOverlapping) {
        setPendingClusterExpansion(null);
        didFlyToCluster.current = false;
        return;
      }

      map.getSource('humans').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        const currentZoom = map.getZoom();
        const threshold = 0.01;
        const targetZoom = Math.abs(currentZoom - zoom) < threshold ? zoom + 0.6 : zoom;

        map.flyTo({
          center: coordinates,
          zoom: targetZoom,
          padding: { left: SIDEBAR_WIDTH, right: 0, top: 0, bottom: 0 },
          speed: 0.8,
          curve: 1.4,
          essential: true,
        });

        setPendingClusterExpansion(null);
        setLastMarkerCoordinates(null);
        didFlyToCluster.current = false;
      });
    };

    map.once('moveend', handleMoveEnd);
    return () => map.off('moveend', handleMoveEnd);
  }, [globeRef, sidebarOpen, sidebarTrigger, pendingClusterExpansion]);
};

export default useClusterExpansion;
