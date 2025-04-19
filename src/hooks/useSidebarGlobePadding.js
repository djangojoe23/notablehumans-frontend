import { useEffect } from 'react';
import { SIDEBAR_WIDTH } from '../constants/layout';

const useSidebarGlobePadding = ({ globeRef, sidebarOpen }) => {
  const globe = globeRef.current;
  const padding = { left: SIDEBAR_WIDTH, top: 0, right: 0, bottom: 0 };

  // === Remove padding when sidebar closes via button ===
  useEffect(() => {
    if (!globe) return;

    if (!sidebarOpen) {
      globe.easeTo({
        center: globe.getCenter(),
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
        duration: 500,
      });
    }
  }, [globe, sidebarOpen]);

  useEffect(() => {
    if (!globe || !sidebarOpen) return;

    globe.easeTo({
      center: globe.getCenter(),
      padding,
      duration: 300,
      easing: t => t,
      essential: true,
    });
  }, [globe, sidebarOpen]);
};

export default useSidebarGlobePadding;
