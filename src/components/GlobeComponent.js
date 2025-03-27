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
        <MapContext.Provider value={map}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  );

};

export default GlobeComponent;