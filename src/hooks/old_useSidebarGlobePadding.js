import { useEffect } from 'react';
import { SIDEBAR_WIDTH } from '../constants/layout';

const useSidebarGlobePadding = ({
  globeRef,
  sidebarOpen,
  sidebarTrigger,
  lastMarkerCoordinates,
  pendingClusterExpansion,
  didFlyToCluster
}) => {
  const map = globeRef.current;
  const padding = { left: SIDEBAR_WIDTH, top: 0, right: 0, bottom: 0 };

  // === Fly to non-cluster marker ===
  useEffect(() => {
    if (
      !map ||
      !sidebarOpen ||
      !lastMarkerCoordinates ||
      pendingClusterExpansion ||
      didFlyToCluster.current
    ) return;

    map.flyTo({
      center: lastMarkerCoordinates,
      padding,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    });
  }, [map, sidebarOpen, lastMarkerCoordinates, pendingClusterExpansion, sidebarTrigger]);

  // === Remove padding when sidebar closes via button ===
  useEffect(() => {
    if (!map) return;

    if (!sidebarOpen && sidebarTrigger === 'button') {
      map.easeTo({
        center: map.getCenter(),
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
        duration: 1000,
      });
    }
  }, [map, sidebarOpen, sidebarTrigger]);

  // === Apply padding when sidebar opens manually ===
  useEffect(() => {
    if (
      !map ||
      !sidebarOpen ||
      sidebarTrigger !== 'button' ||
      lastMarkerCoordinates ||
      pendingClusterExpansion
    ) return;

    map.easeTo({
      center: map.getCenter(),
      padding,
      duration: 600,
      easing: t => t,
      essential: true,
    });
  }, [map, sidebarOpen, sidebarTrigger, lastMarkerCoordinates, pendingClusterExpansion]);
};

export default useSidebarGlobePadding;
