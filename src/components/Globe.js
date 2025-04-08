import React, {useEffect, useRef} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


const Globe = ( {mapRef, notableHumans} ) => {
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
  const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
  const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: `mapbox://styles/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}`,
        center: [0, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 16,
        projection: "globe",
      });

      mapRef.current=map;

      map.on("load", () => {
        console.log("🗺️ Map loaded successfully");

        map.addSource('humans', {
            type: 'geojson',
            data: notableHumans,
            cluster: true,
            clusterMaxZoom: 14, // max zoom to cluster points
            clusterRadius: 50   // radius of each cluster in pixels
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'humans',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15, 10,
              20, 30,
              25
            ],
            'circle-opacity': 0.7
          }
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'humans',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });

        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'humans',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#f28cb1',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        });

        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });
          const clusterId = features[0].properties.cluster_id;
          map.getSource('humans').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
              duration: 500
            });
          });
        });

        map.on('mouseenter', 'clusters', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
          map.getCanvas().style.cursor = '';
        });

      });

      map.on("error", (e) => {
        console.error("Mapbox internal error:", e.error);
      });

      // Add resize handler
      const handleResize = () => {
        map.resize();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        map.remove();
        mapRef.curent = null;
      };

    } catch (err) {
      console.error("💥 Error creating Mapbox map:", err);
    }
  }, [MAPBOX_TOKEN, MAPBOX_USERNAME, MAPBOX_STYLE_ID]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </div>
  );

};

export default Globe;
