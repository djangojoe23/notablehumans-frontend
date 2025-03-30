import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapContext } from './MapContext';

const GlobeComponent = ({ children }) => {
  // Environment tokens and style settings
  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_API_TOKEN;
  const MAPBOX_USERNAME = process.env.REACT_APP_MAPBOX_USER;
  const MAPBOX_STYLE_ID = process.env.REACT_APP_MAPBOX_STYLE_ID;

  // References and state
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const isAnimatingRef = useRef(false);             // Tracks programmatic animations
  const pulseAnimationFrameRef = useRef(null);        // Holds the current pulse animation frame
  const haloPersistRef = useRef(false);               // Indicates if a halo is active/persistent

  // Helper: Sets up the halo source and circle layer for the pulsing effect.
  const setupHaloLayer = (mapInstance) => {
    if (!mapInstance.getSource('halo-feature')) {
      mapInstance.addSource('halo-feature', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapInstance.addLayer({
        id: 'halo-layer',
        type: 'circle',
        source: 'halo-feature',
        paint: {
          // The circle radius is the sum of baseRadius and pulseOffset properties.
          'circle-radius': ['+', ['get', 'baseRadius'], ['get', 'pulseOffset']],
          'circle-color': 'rgba(255,100,100,0.3)',  // Semi-transparent red fill
          'circle-stroke-color': 'white',
          'circle-stroke-width': 2,
          'circle-opacity': 0.7
        }
      });
    }
  };

  // Helper: Clears the halo and cancels any running pulse animation.
  const clearHaloAndAnimation = (mapInstance) => {
    if (pulseAnimationFrameRef.current) {
      cancelAnimationFrame(pulseAnimationFrameRef.current);
      pulseAnimationFrameRef.current = null;
    }
    if (mapInstance.getSource('halo-feature')) {
      mapInstance.getSource('halo-feature').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
    haloPersistRef.current = false;
  };

  // Helper: Sets up global event handlers to clear the halo on user interaction.
  const setupGlobalHaloClearHandlers = (mapInstance) => {
    // Clear halo when zooming starts
    mapInstance.on('zoomstart', () => {
      clearHaloAndAnimation(mapInstance);
    });

    // Clear halo on click or mousedown if a halo is active.
    mapInstance.on('click', (e) => {
      if (haloPersistRef.current) {
        clearHaloAndAnimation(mapInstance);
      }
    });
    mapInstance.on('mousedown', (e) => {
      if (haloPersistRef.current) {
        clearHaloAndAnimation(mapInstance);
      }
    });
  };

  // Initialize map only once
  useEffect(() => {
    if (map) return;

    // Clean out container if needed.
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

    // When the map loads, set up the halo and global event handlers.
    mapInstance.on('load', () => {
      setupHaloLayer(mapInstance);
      setupGlobalHaloClearHandlers(mapInstance);
      setMap(mapInstance);
    });

    // Listen for window resize events.
    const handleResize = () => {
      if (mapInstance) {
        mapInstance.resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map, MAPBOX_TOKEN, MAPBOX_USERNAME, MAPBOX_STYLE_ID]);

  // Use ResizeObserver to trigger smooth map resize on container changes.
  useEffect(() => {
    if (!containerRef.current || !map) return;
    let debounceTimeout;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        map.resize();
      }, 1);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      clearTimeout(debounceTimeout);
      resizeObserver.disconnect();
    };
  }, [map]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map container must be empty for Mapbox GL */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {map && (
        <MapContext.Provider value={{ map, isAnimatingRef, pulseAnimationFrameRef, haloPersistRef }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  );
};

export default GlobeComponent;
