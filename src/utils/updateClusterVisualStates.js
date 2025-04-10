// utils/updateClusterVisualStates.js
import mapboxgl from 'mapbox-gl';

const updateClusterVisualStates = (map) => {
  if (!map.getLayer('clusters')) return;

  const clusters = map.queryRenderedFeatures({ layers: ['clusters'] });
  if (!clusters.length) return;

  const bounds = map.getBounds();
  const sw = map.project(bounds.getSouthWest());
  const ne = map.project(bounds.getNorthEast());

  const pixelPadding = 150;
  const expandedBounds = new mapboxgl.LngLatBounds(
    map.unproject(new mapboxgl.Point(sw.x - pixelPadding, sw.y + pixelPadding)),
    map.unproject(new mapboxgl.Point(ne.x + pixelPadding, ne.y - pixelPadding))
  );

  clusters.forEach((cluster) => {
    const { cluster_id: clusterId, point_count: count } = cluster.properties;
    const coords = cluster.geometry.coordinates;
    if (!expandedBounds.contains(new mapboxgl.LngLat(...coords))) return;

    map.getSource('humans').getClusterLeaves(clusterId, count, 0, (err, leaves) => {
      if (err) return;

      const zoom = map.getZoom();
      const pixelTolerance = zoom < 3 ? 4 : zoom < 5 ? 6 : 8;
      const geoTolerance = 0.01;
      const clusterPoint = map.project(new mapboxgl.LngLat(...coords));

      const allOverlap = leaves.every(({ geometry: { coordinates } }) => {
        const [lng, lat] = coordinates;
        if (Math.abs(lng - coords[0]) > geoTolerance || Math.abs(lat - coords[1]) > geoTolerance) return false;

        const point = map.project(new mapboxgl.LngLat(lng, lat));
        const dx = point.x - clusterPoint.x;
        const dy = point.y - clusterPoint.y;
        return Math.sqrt(dx * dx + dy * dy) < pixelTolerance;
      });

      map.setFeatureState({ source: 'humans', id: clusterId }, { fullyOverlapping: allOverlap });
    });
  });
};

export default updateClusterVisualStates;
