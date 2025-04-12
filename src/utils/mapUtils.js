export function updateHaloForFeature(map, feature, baseRadius, haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef) {
  cancelAnimationFrame(pulseAnimationFrameRef.current);
  isAnimatingRef.current = false;

  let pulseOffset = 0;
  let direction = 1;

  const center = feature.geometry?.coordinates ?? feature._geometry?.coordinates;
  const haloFeature = {
    type: 'Feature',
    id: feature.id,
    geometry: { type: 'Point', coordinates: center },
    properties: { baseRadius, pulseOffset: 0 }
  };

  map.getSource('halo').setData({
    type: 'FeatureCollection',
    features: [haloFeature]
  });

  currentHaloFeatureRef.current = haloFeature;

  const animate = () => {
    pulseOffset += direction * 0.4;
    if (pulseOffset >= 6 || pulseOffset <= 0) direction *= -1;

    haloFeature.properties.pulseOffset = pulseOffset;

    map.getSource('halo').setData({
      type: 'FeatureCollection',
      features: [haloFeature]
    });

    pulseAnimationFrameRef.current = requestAnimationFrame(animate);
  };

  isAnimatingRef.current = true;
  animate();
}
