import mapboxgl from 'mapbox-gl';

const updateClusterVisualStates = (map) => {
  if (!map.getLayer('clusters')) return;

  const clusters = map.queryRenderedFeatures({ layers: ['clusters'] });
  if (!clusters.length) return;

  const bounds = map.getBounds();
  const sw = map.project(bounds.getSouthWest());
  const ne = map.project(bounds.getNorthEast());

  const pixelPadding = 250;
  const expandedBounds = new mapboxgl.LngLatBounds(
    map.unproject(new mapboxgl.Point(sw.x - pixelPadding, sw.y + pixelPadding)),
    map.unproject(new mapboxgl.Point(ne.x + pixelPadding, ne.y - pixelPadding))
  );

  const source = map.getSource('humans');
  const maxZoom = map.getMaxZoom();

  clusters.forEach((cluster) => {
    const { cluster_id: clusterId } = cluster.properties;
    const coords = cluster.geometry.coordinates;
    const clusterLngLat = new mapboxgl.LngLat(...coords);

    if (!expandedBounds.contains(clusterLngLat)) return;

    source.getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
      if (err) return;

      const fullyOverlapping = expansionZoom > maxZoom;

      map.setFeatureState(
        { source: 'humans', id: clusterId },
        { fullyOverlapping }
      );
    });
  });
};

export default updateClusterVisualStates;

