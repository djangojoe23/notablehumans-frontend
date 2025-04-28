// haloUtils.js
// Manages pulsing halo animations independently from Mapbox's rendering optimizations.

let globalPulseAnimationFrame = null;
let pulseOffset = 0;
let pulseDirection = 1;
let lastPulseTimestamp = null;

/**
 * Starts a global pulse loop to drive both halo size and sidebar animations.
 */
function startGlobalPulseLoop() {
  if (globalPulseAnimationFrame) return; // Already running

  const animate = (timestamp) => {
    if (!lastPulseTimestamp) lastPulseTimestamp = timestamp;
    const elapsed = timestamp - lastPulseTimestamp;
    lastPulseTimestamp = timestamp;

    pulseOffset += pulseDirection * (elapsed / 1000);

    if (pulseOffset > 1) {
      pulseOffset = 1;
      pulseDirection = -1;
    } else if (pulseOffset < 0) {
      pulseOffset = 0;
      pulseDirection = 1;
    }

    // Update CSS variable for sidebar/detail panel pulsing
    document.documentElement.style.setProperty('--pulse-ratio', pulseOffset);

    globalPulseAnimationFrame = requestAnimationFrame(animate);
  };

  globalPulseAnimationFrame = requestAnimationFrame(animate);
}

/**
 * Stops the global pulse loop (optional cleanup if needed).
 */
function stopGlobalPulseLoop() {
  if (globalPulseAnimationFrame) {
    cancelAnimationFrame(globalPulseAnimationFrame);
    globalPulseAnimationFrame = null;
    lastPulseTimestamp = null;
  }
}

/**
 * Draws and animates a pulsing halo around a GeoJSON point feature on the map.
 * @param {mapboxgl.Map} map
 * @param {GeoJSON.Feature<Point>} feature
 * @param {object} globeState
 */
export function updateHaloForFeature(map, feature, globeState) {
  const { haloAnimationFrameRef, isHaloActiveRef, currentHaloFeatureRef } = globeState;

  // Cancel any previous halo-specific animation
  if (haloAnimationFrameRef.current) {
    cancelAnimationFrame(haloAnimationFrameRef.current);
  }

  isHaloActiveRef.current = true;

  const { baseRadius = 15 } = feature.properties || {};

  const haloFeature = {
    type: 'Feature',
    id: feature.id,
    geometry: feature.geometry,
    properties: { baseRadius, pulseOffset: 0 }
  };

  map.getSource('halo').setData({
    type: 'FeatureCollection',
    features: [haloFeature]
  });

  currentHaloFeatureRef.current = haloFeature;

  // Keep syncing halo feature with global pulse loop
  function syncHalo() {
    if (!isHaloActiveRef.current) return;

    const currentPulseRatio = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pulse-ratio')) || 0;
    haloFeature.properties.pulseOffset = baseRadius * currentPulseRatio;

    map.getSource('halo').setData({
      type: 'FeatureCollection',
      features: [haloFeature]
    });

    haloAnimationFrameRef.current = requestAnimationFrame(syncHalo);
  }

  haloAnimationFrameRef.current = requestAnimationFrame(syncHalo);

  // Make sure the global pulse loop is running
  startGlobalPulseLoop();
}

/**
 * Uses Mapbox's clustering to find which cluster contains a given human,
 * then halos that cluster marker (or the raw point if unclustered).
 * @param {mapboxgl.Map} map
 * @param {{id: string, lng: string|number, lat: string|number}} human
 * @param {object} globeState
 * @returns {Promise<string|null>} Cluster ID or null
 */
export async function updateHaloForDetailedHuman(map, human, globeState) {
  if (!map || !human) return null;

  const lng = parseFloat(human.lng);
  const lat = parseFloat(human.lat);

  // Cancel any previous halo animation
  if (globeState.haloAnimationFrameRef.current) {
    cancelAnimationFrame(globeState.haloAnimationFrameRef.current);
    globeState.isHaloActiveRef.current = false;
  }

  // Search nearby clusters
  const pixel = map.project([lng, lat]);
  const buffer = 50;
  const bbox = [
    [pixel.x - buffer, pixel.y - buffer],
    [pixel.x + buffer, pixel.y + buffer]
  ];
  const clusters = map.queryRenderedFeatures(bbox, { layers: ['clusters'] });

  for (const cluster of clusters) {
    const clusterId = cluster.properties.cluster_id;
    const leaves = await new Promise((resolve, reject) => {
      map.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    if (leaves.find(leaf => leaf.properties.id === human.id)) {
      const count = cluster.properties.point_count;
      const baseRadius = count >= 30 ? 25 : count >= 10 ? 20 : 15;

      const featureForHalo = {
        type: 'Feature',
        id: clusterId,
        geometry: { type: 'Point', coordinates: cluster.geometry.coordinates },
        properties: { baseRadius }
      };

      updateHaloForFeature(map, featureForHalo, globeState);
      return clusterId;
    }
  }

  // Fallback to unclustered
  const fallbackFeature = {
    type: 'Feature',
    id: human.id,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { baseRadius: 10 }
  };
  updateHaloForFeature(map, fallbackFeature, globeState);
  return null;
}

/**
 * Shortcut for haloing an unclustered click event immediately.
 */
export function activateHaloForUnclustered(map, feature, globeState) {
  const id = feature.id ?? feature.properties?.id;
  const coords = feature.geometry.coordinates;
  const singleFeature = {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: coords },
    properties: { baseRadius: 10 }
  };
  updateHaloForFeature(map, singleFeature, globeState);
}
