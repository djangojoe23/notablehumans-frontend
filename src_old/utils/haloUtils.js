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
 * Shortcut for haloing an unclustered click event immediately.
 */
export async function activateHaloForUnclustered(map, feature, globeState) {
  const id = feature.id ?? feature.properties?.id;
  const coords = feature.geometry.coordinates;
  const singleFeature = {
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: coords },
    properties: { baseRadius: 10 }
  };
  return updateHaloForFeature(map, singleFeature, globeState);
}


export async function updateHaloForDetailedHuman(map, human, globeState, clusterContext = null) {
  if (!map || !human) return null;
  const lng = parseFloat(human.lng);
  const lat = parseFloat(human.lat);

  // 1️⃣ Cancel prior halo
  if (globeState.haloAnimationFrameRef.current) {
    cancelAnimationFrame(globeState.haloAnimationFrameRef.current);
    globeState.isHaloActiveRef.current = false;
  }

  // 2️⃣ if we were handed clusterContext, skip the lookup
  if (clusterContext && clusterContext.id) {
    const feature = {
      type: 'Feature',
      id: clusterContext.id,
      geometry: {
        type: 'Point',
        coordinates: clusterContext.coords
      },
      properties: { baseRadius: clusterContext.baseRadius }
    };
    return updateHaloForFeature(map, feature, globeState);
  }

  // 2️⃣ Project to pixel, build a search‐box
  const pixel = map.project([lng, lat]);
  const unclusteredBuffer = 100; // in pixels – just enough to capture the exact icon
  const bboxUnclustered = [
    [pixel.x - unclusteredBuffer, pixel.y - unclusteredBuffer],
    [pixel.x + unclusteredBuffer, pixel.y + unclusteredBuffer]
  ];

  // 3b. Second try: “clusters” lookup with a larger buffer
  const clusterBuffer = 100; // in pixels – same or similar to what you had before
  const bboxClusters = [
    [pixel.x - clusterBuffer, pixel.y - clusterBuffer],
    [pixel.x + clusterBuffer, pixel.y + clusterBuffer]
  ];

    // ─── 4️⃣ CHECK “unclustered-point” LAYER ───────────────────────────────────────────────
  // If this human is currently rendered as a single point (not in a cluster),
  // it will appear in the “unclustered-point” layer. We look for properties.id === human.id.
  const unclusteredFeatures = map.queryRenderedFeatures(bboxUnclustered, {
    layers: ['unclustered-point']
  });

  // Try to find a matching feature whose “properties.id” matches human.id
  const matchUnclustered = unclusteredFeatures.find(
    (f) => `${f.properties.id}` === `${human.id}`
  );

  if (matchUnclustered) {
    // Build a GeoJSON Feature that matches this unclustered-point exactly:
    const featureForHalo = {
      type: 'Feature',
      id: human.id,
      geometry: matchUnclustered.geometry,
      // You can pick any baseRadius you like for a singleton.
      // For example, here we use 10 px so it’s smaller than a cluster halo.
      properties: { baseRadius: 10 }
    };
    return updateHaloForFeature(map, featureForHalo, globeState);
  }

  // ─── 5️⃣ CHECK “clusters” LAYER ───────────────────────────────────────────────────────
  // If we did not find an unclustered singleton, maybe this human is still inside a nearby cluster.
  // We reuse your existing “getClusterLeaves” logic to see if the human belongs in any visible cluster:
  const clusterFeatures = map.queryRenderedFeatures(bboxClusters, {
    layers: ['clusters']
  });

  for (const cluster of clusterFeatures) {
    const clusterId = cluster.properties.cluster_id;
    // Request all leaves (with a finite limit). If the user has, say, 200 points in this cluster,
    // set `limit = cluster.properties.point_count` so we gather them all. (Caution: large clusters
    // could be slower. Adjust a maximum limit if needed.)
    const limit = cluster.properties.point_count;

    try {
      const leaves = await new Promise((resolve, reject) =>
        map
          .getSource('humans')
          .getClusterLeaves(clusterId, limit, 0, (err, arr) =>
            err ? reject(err) : resolve(arr)
          )
      );

      // If any leaf’s properties.id matches our detailedHuman.id, we know this cluster contains our human.
      const foundLeaf = leaves.find(
        (leaf) => `${leaf.properties.id}` === `${human.id}`
      );

      if (foundLeaf) {
        // Decide baseRadius by cluster size (you can tune these breakpoints as you like)
        const count = cluster.properties.point_count;
        const baseRadius =
          count >= 30 ? 25 : count >= 10 ? 20 : 15;

        const featureForHalo = {
          type: 'Feature',
          id: clusterId,
          geometry: {
            type: 'Point',
            coordinates: cluster.geometry.coordinates
          },
          properties: { baseRadius }
        };
        return updateHaloForFeature(map, featureForHalo, globeState);
      }
    } catch (err) {
      console.warn(
        `Error while fetching leaves for cluster ${clusterId}:`,
        err
      );
      // Just continue to next cluster if one fails
    }
  }

  // 5️⃣ Nothing matched → fallback
  console.warn(`⚠️ human ${human.id} not in any nearby cluster, falling back`);
  const fallbackFeature = {
    type: 'Feature',
    id: human.id,
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: { baseRadius: 10 }
  };
  updateHaloForFeature(map, fallbackFeature, globeState);
  return null;
}

