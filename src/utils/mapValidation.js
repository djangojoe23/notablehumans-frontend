import mapboxgl from 'mapbox-gl';

export function isMarkerStillFocused({
  globe,
  targetLngLat,
  focusedZoom,
  tolerance = 30,
  zoomThreshold = 0.1
}) {
  if (!globe || !targetLngLat) return false;

  const currentZoom = globe.getZoom();
  const center = globe.getCenter();

  const screenCenter = globe.project(center);
  const screenTarget = globe.project(new mapboxgl.LngLat(...targetLngLat));

  const dx = screenCenter.x - screenTarget.x;
  const dy = screenCenter.y - screenTarget.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  const hasMovedAway = pixelDistance > tolerance;
  const isZoomedOut = Math.abs(currentZoom - (focusedZoom ?? currentZoom)) > zoomThreshold;

  return !hasMovedAway && !isZoomedOut;
}
