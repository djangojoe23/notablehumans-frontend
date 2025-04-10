import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SIDEBAR_WIDTH } from '../constants/layout';


const Globe = ({
                 mapRef,
                 notableHumans,
                 setSelectedClusterHumans,
                 sidebarOpen,
                 setSidebarOpen,
                 sidebarTrigger,
                 setSidebarTrigger,
                 lastMarkerCoordinates,
                 setLastMarkerCoordinates,
                 pendingClusterExpansion,
                 setPendingClusterExpansion
              }) => {
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
  const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
  const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: `mapbox://styles/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}`,
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 16,
      projection: 'globe',
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('humans', {
        type: 'geojson',
        data: notableHumans,
        cluster: true,
        clusterMaxZoom: 20,
        clusterRadius: 50,
        promoteId: 'cluster_id',
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'humans',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'fullyOverlapping'], false],
            '#f28cb1',
            '#11b4da',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15, 10,
            20, 30,
            25,
          ],
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'humans',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
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
          'circle-stroke-color': '#fff',
        },
      });

      const updateClusterVisualStates = () => {
        const map = mapRef.current;
        if (!map) return;

        if (!map.getLayer('clusters')) return; // ✅ prevent crash on early call

        const clusters = map.queryRenderedFeatures({ layers: ['clusters'] });
        if (!clusters.length) return;

        const pixelPadding = 150;
        const bounds = map.getBounds();
        const sw = map.project(bounds.getSouthWest());
        const ne = map.project(bounds.getNorthEast());

        const expandedBounds = new mapboxgl.LngLatBounds(
          map.unproject(new mapboxgl.Point(sw.x - pixelPadding, sw.y + pixelPadding)),
          map.unproject(new mapboxgl.Point(ne.x + pixelPadding, ne.y - pixelPadding))
        );

        clusters.forEach((cluster) => {
          const clusterId = cluster.properties.cluster_id;
          const clusterCoordinates = cluster.geometry.coordinates;

          if (!expandedBounds.contains(new mapboxgl.LngLat(...clusterCoordinates))) return;

          const pointCount = cluster.properties.point_count;

          map.getSource('humans').getClusterLeaves(clusterId, pointCount, 0, (err, leaves) => {
            if (err) return;

            const clusterPoint = map.project(new mapboxgl.LngLat(...clusterCoordinates));

            const zoom = map.getZoom();
            const pixelTolerance =
              zoom < 3 ? 4 :
              zoom < 5 ? 6 :
              8;

            const geoTolerance = 0.01; // degrees of lat/lng (about 1km-ish)

            const allOverlap = leaves.every((leaf) => {
              const [leafLng, leafLat] = leaf.geometry.coordinates;
              const dLng = Math.abs(leafLng - clusterCoordinates[0]);
              const dLat = Math.abs(leafLat - clusterCoordinates[1]);

              if (dLng > geoTolerance || dLat > geoTolerance) return false;

              const leafPoint = map.project(new mapboxgl.LngLat(leafLng, leafLat));
              const dx = leafPoint.x - clusterPoint.x;
              const dy = leafPoint.y - clusterPoint.y;
              return Math.sqrt(dx * dx + dy * dy) < pixelTolerance;
            });

            map.setFeatureState(
              { source: 'humans', id: clusterId },
              { fullyOverlapping: allOverlap }
            );
          });
        });
      };

      map.on('moveend', () => {
        setTimeout(updateClusterVisualStates, 100);
      });

      updateClusterVisualStates(); // Run immediately on load

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (!features.length) return;

        const cluster = features[0];
        const clusterId = cluster.properties.cluster_id;
        const coordinates = cluster.geometry.coordinates;

        setLastMarkerCoordinates(coordinates);
        setSidebarTrigger('marker');

        // Fetch all cluster leaves
        map.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
          if (err) return;

          const sorted = leaves
            .map((leaf) => leaf.properties)
            .sort((a, b) => a.name.localeCompare(b.name));

          setSelectedClusterHumans(sorted);
        });

        const state = map.getFeatureState({ source: 'humans', id: clusterId });
        const isFullyOverlapping = state?.fullyOverlapping;
        if (sidebarOpen) {
          // If sidebar is already open, zoom immediately

          if (isFullyOverlapping) {
            map.flyTo({
              center: coordinates,
              speed: 0.8,
              curve: 1.4,
              essential: true,
            });
          } else {
            map.getSource('humans').getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.flyTo({
                center: coordinates,
                zoom,
                speed: 0.8,
                curve: 1.4,
                essential: true,
              });
            });
          }
        } else {
          // Defer zoom until sidebar opens
          setSidebarOpen(true);
          setPendingClusterExpansion({ clusterId, coordinates, isFullyOverlapping });
        }
      });

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const human = feature.properties;

        setSelectedClusterHumans([human]);
        setSidebarTrigger('marker');
        setSidebarOpen(true);
        const coordinates = feature.geometry.coordinates;
        setLastMarkerCoordinates(coordinates);

        map.flyTo({
          center: coordinates,
          speed: 1.2,
          curve: 1.4,
          essential: true,
        });

      });


      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    // Resize handling
    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [mapRef, notableHumans, setSelectedClusterHumans, setSidebarOpen, MAPBOX_TOKEN, MAPBOX_USERNAME, MAPBOX_STYLE_ID]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sidebarOpen || !pendingClusterExpansion) return;

    const { clusterId, coordinates, isFullyOverlapping } = pendingClusterExpansion;

    setTimeout(() => {
      if (isFullyOverlapping) {
        // Just center the map without zooming
        map.flyTo({
          center: coordinates,
          padding: {
            left: SIDEBAR_WIDTH,
            right: 0,
            top: 0,
            bottom: 0,
          },
          speed: 0.8,
          curve: 1.4,
          essential: true,
        });

        setPendingClusterExpansion(null);
      } else {
        // Expand the cluster normally
        map.getSource('humans').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          map.flyTo({
            center: coordinates,
            zoom,
            padding: {
              left: SIDEBAR_WIDTH,
              right: 0,
              top: 0,
              bottom: 0,
            },
            speed: 0.8,
            curve: 1.4,
            essential: true,
          });

          setPendingClusterExpansion(null);
        });
      }
    }, 300);
  }, [sidebarOpen, pendingClusterExpansion]);



  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!sidebarOpen && sidebarTrigger === 'button') {
      // Sidebar just closed — reset padding with current center
      map.easeTo({
        center: map.getCenter(),
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        duration: 1000,
      });
    }
  }, [sidebarOpen, sidebarTrigger, mapRef]);

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
