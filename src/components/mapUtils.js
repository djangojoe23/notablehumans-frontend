// maputils.js

/**
 * Computes the offset for centering the map.
 * If the sidebar is closed, returns an offset to account for the sidebar width.
 */
export const getOffset = (sidebarOpen) => {
  const sidebarWidth = 400; // Adjust as needed.
  return sidebarOpen ? [0, 0] : [sidebarWidth / -2, 0];
};

/**
 * Starts a pulse animation on the halo feature.
 * This function updates the halo's `pulseOffset` property over time.
 */
export const startPulseAnimation = (map, currentHaloFeatureRef, pulseAnimationFrameRef) => {
  if (pulseAnimationFrameRef.current) {
    cancelAnimationFrame(pulseAnimationFrameRef.current);
  }
  const duration = 2000; // Duration for one pulse cycle (ms)
  const maxPulse = 10;   // Maximum additional radius for the pulse
  const startTime = performance.now();

  const animate = (now) => {
    const t = ((now - startTime) % duration) / duration; // value between 0 and 1
    const pulseOffset = maxPulse * Math.abs(Math.sin(t * Math.PI * 2));
    if (currentHaloFeatureRef.current) {
      currentHaloFeatureRef.current.properties.pulseOffset = pulseOffset;
      // Update the source data for the halo feature
      map.getSource('halo-feature').setData(currentHaloFeatureRef.current);
    }
    pulseAnimationFrameRef.current = requestAnimationFrame(animate);
  };

  pulseAnimationFrameRef.current = requestAnimationFrame(animate);
};

/**
 * Updates the halo feature for a given marker or cluster feature.
 * Sets its base radius, applies the pulse animation, and marks it as persistent.
 */
export const updateHaloForFeature = (map, feature, baseRadius, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef) => {
  const haloFeature = {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      baseRadius: baseRadius,
      pulseOffset: 0,
    },
  };
  currentHaloFeatureRef.current = haloFeature;
  map.getSource('halo-feature').setData({
    type: 'FeatureCollection',
    features: [haloFeature],
  });
  haloPersistRef.current = true;
  startPulseAnimation(map, currentHaloFeatureRef, pulseAnimationFrameRef);
};