// haloUtils.js
// Uses Mapbox's built-in clustering + getClusterLeaves to halo the correct marker for a human

/**
 * Draw and animate a pulsing halo around a GeoJSON point feature on the map.
 * @param {mapboxgl.Map} map
 * @param {GeoJSON.Feature<Point>} feature
 * @param {object} globeState
 */
export function updateHaloForFeature(map, feature, globeState) {
  const {
    haloAnimationFrameRef,
    isHaloActiveRef,
    currentHaloFeatureRef
  } = globeState;

  // cancel previous animation
  if (haloAnimationFrameRef.current) {
    cancelAnimationFrame(haloAnimationFrameRef.current);
  }
  isHaloActiveRef.current = false;

  // initial halo geometry and properties
  const { baseRadius = 15 } = feature.properties || {};
  const haloFeature = {
    type: 'Feature',
    id: feature.id,
    geometry: feature.geometry,
    properties: { baseRadius, pulseOffset: 0 }
  };

  // set the GeoJSON data on the 'halo' source
  map.getSource('halo').setData({
    type: 'FeatureCollection',
    features: [haloFeature]
  });
  currentHaloFeatureRef.current = haloFeature;

  // animate pulsing
  let direction = 1;
  function animate() {
    let { pulseOffset } = haloFeature.properties;
    pulseOffset += direction * 0.2;
    if (pulseOffset > baseRadius || pulseOffset < 0) direction *= -1;
    haloFeature.properties.pulseOffset = pulseOffset;

    map.getSource('halo').setData({
      type: 'FeatureCollection',
      features: [haloFeature]
    });

    // **SYNC** the sidebar pulse
    const ratio = pulseOffset / baseRadius;
    document.documentElement.style.setProperty(
      '--pulse-ratio',
      ratio
    );

    haloAnimationFrameRef.current = requestAnimationFrame(animate);
  }

  isHaloActiveRef.current = true;
  animate();
}

/**
 * Use Mapbox's clustering to find which cluster contains a given human,
 * then halo that cluster marker (or the raw point if unclustered).
 * @param {mapboxgl.Map} map
 * @param {{id: string, lng: string|number, lat: string|number}} human
 * @param {object} globeState
 * @returns {Promise<string|null>} cluster_id or null for individual
 */
export async function updateHaloForDetailedHuman(map, human, globeState) {
  if (!map || !human) return null;

  const lng = parseFloat(human.lng);
  const lat = parseFloat(human.lat);

  // clear any existing halo animation
  if (globeState.haloAnimationFrameRef.current) {
    cancelAnimationFrame(globeState.haloAnimationFrameRef.current);
    globeState.isHaloActiveRef.current = false;
  }

  // buffer in pixels around the projected point to find nearby clusters
  const pixel = map.project([lng, lat]);
  const buffer = 50;
  const bbox = [
    [pixel.x - buffer, pixel.y - buffer],
    [pixel.x + buffer, pixel.y + buffer]
  ];

  // query rendered cluster circles in view around this human
  const clusters = map.queryRenderedFeatures(bbox, { layers: ['clusters'] });

  // check each cluster to see if it contains our human
  for (const cluster of clusters) {
    const clusterId = cluster.properties.cluster_id;
    const leaves = await new Promise((resolve, reject) => {
      map.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    if (leaves.find(leaf => leaf.properties.id === human.id)) {
      // decide baseRadius by cluster size
      const count = cluster.properties.point_count;
      const baseRadius = count >= 30 ? 25 : count >= 10 ? 20 : 15;

      // halo exactly at the cluster's center coordinate
      const featureForHalo = {
        type: 'Feature',
        id: clusterId,
        geometry: { type: 'Point', coordinates: cluster.geometry.coordinates },
        properties: { baseRadius: baseRadius }
      };

      updateHaloForFeature(map, featureForHalo, globeState);
      return clusterId;
    }
  }

  // fallback: unclustered point
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
