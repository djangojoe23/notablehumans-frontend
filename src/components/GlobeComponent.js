import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapContext } from './MapContext';

const GlobeComponent = ( {children} ) => {
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
  const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
  const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;

  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const isAnimatingRef = useRef(false);


  // Initialize map only once
  useEffect(() => {
    if (map) return;

    if (containerRef.current) {
      containerRef.current.replaceChildren();
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const mapInstance = new mapboxgl.Map({
      container: containerRef.current,
      style: `mapbox://styles/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}`,
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 14,
    });

    mapInstance.on('load', () => {
      // Step 1: Define and add the pulsing dot image
      const size = 200;
      const pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        onAdd: function () {
          const canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          this.context = canvas.getContext('2d', { willReadFrequently: true });
        },
        render: function () {
          const duration = 1000;
          const t = (performance.now() % duration) / duration;
          const radius = (size / 2) * 0.3;
          const outerRadius = (size / 2) * 0.7 * t + radius;
          const context = this.context;
          context.clearRect(0, 0, this.width, this.height);
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
          context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
          context.fill();
          context.beginPath();
          context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 100, 100, 1)';
          context.strokeStyle = 'white';
          context.lineWidth = 2 + 4 * (1 - t);
          context.fill();
          context.stroke();
          this.data = context.getImageData(0, 0, this.width, this.height).data;
          mapInstance.triggerRepaint();
          return true;
        }
      };

      // Add the pulsing dot image to the map style
      if (!mapInstance.hasImage('pulsing-dot')) {
        mapInstance.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
      }

      if (!mapInstance.getSource('selected-feature')) {
        mapInstance.addSource('selected-feature', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });

        mapInstance.addLayer({
          id: 'selected-feature-layer',
          type: 'symbol',
          source: 'selected-feature',
          layout: {
            'icon-image': 'pulsing-dot',
            'icon-allow-overlap': true
          }
        });
      }

     // Step 4: Global handlers to clear halo when user interacts (but not during animation)
      mapInstance.on('click', (e) => {
        // If the click is not on the selected feature layer and not during a programmatic animation
        if (!isAnimatingRef.current) {
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ['selected-feature-layer']
          });
          if (!features.length) {
            mapInstance.getSource('selected-feature').setData({
              type: 'FeatureCollection',
              features: []
            });
          }
        }
      });

      // Listen for moveend to reset our flag
      mapInstance.on('moveend', () => {
        isAnimatingRef.current = false;
      });

      // Global handler to clear halo on mousedown (user-initiated interaction)
      mapInstance.on('mousedown', (e) => {
        // If the movement is user-initiated, clear the halo.
        if (!isAnimatingRef.current) {
          mapInstance.getSource('selected-feature').setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      });

      setMap(mapInstance);
    });


    // Listen for window resize events
    const handleResize = () => {
      mapInstance && mapInstance.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [map, MAPBOX_TOKEN, MAPBOX_USERNAME, MAPBOX_STYLE_ID]);

  // Use ResizeObserver with a debounce to smoothly call map.resize()
  useEffect(() => {
    if (!containerRef.current || !map) return;

    let debounceTimeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        map.resize();
      }, 1); // or adjust the delay as needed
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(debounceTimeout);
      resizeObserver.disconnect();
    };
  }, [map]);

  return (
       <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container: must be empty for Mapbox GL */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Overlay for children */}
      {map && (
        <MapContext.Provider value={{map, isAnimatingRef}}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  );

};

export default GlobeComponent;