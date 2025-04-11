import React, { useEffect } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import throttle from 'lodash.throttle';
import updateClusterVisualStates from './utils/updateClusterVisualStates';
import './App.css';

function App() {
  const {
    globeRef,
    notableHumans, setNotableHumans,
    error, setError,
    sidebarOpen, setSidebarOpen,
    sidebarTrigger, setSidebarTrigger,
    sidebarMode, setSidebarMode,
    selectedClusterHumans, setSelectedClusterHumans,
    lastMarkerCoordinates, setLastMarkerCoordinates,
    pendingClusterExpansion, setPendingClusterExpansion,
    focusedZoomRef, lastMarkerCoordinatesRef,
    sidebarModeRef,
  } = useGlobeState();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/notable-humans-geojson/`)
      .then((res) => {
      console.log("📦 API response:", res.data);

          // optional: check programmatically
          if (Array.isArray(res.data)) {
            console.warn("⚠️ Received a plain array, not a GeoJSON FeatureCollection.");
          } else if (res.data.type === "FeatureCollection" && Array.isArray(res.data.features)) {
            console.log("✅ Proper GeoJSON FeatureCollection");
          } else {
            console.error("❌ Unexpected response format:", res.data);
          }

          setNotableHumans(res.data);
        })
      .catch((err) => {
        console.error("Error fetching GeoJSON", err);
        setError("Failed to load data");
      });
  }, []);

  if (error) return <div>{error}</div>;
  if (!notableHumans) return <div>Loading...</div>;

  const handleSelectPerson = (human) => {
    if (!human || !human.lat || !human.lng || !globeRef.current) return;

    const globe = globeRef.current;
    const targetLngLat = [parseFloat(human.lng), parseFloat(human.lat)];
    const maxZoom = 16;
    let animationStopped = false;

    // Throttled version of updateClusterVisualStates (every 150ms)
    const throttledUpdate = throttle(() => {
      updateClusterVisualStates(globe);
    }, 150);

    const stopAndSelect = (humansAtPoint) => {
      setSelectedClusterHumans(humansAtPoint);
      setLastMarkerCoordinates(targetLngLat);
      lastMarkerCoordinatesRef.current = targetLngLat;

      setSidebarMode('location');
      sidebarModeRef.current = 'location';

      setSidebarTrigger('marker');
      focusedZoomRef.current = globe.getZoom();

      globe.stop();
      animationStopped = true;
      globe.off('move', checkWhileFlying);
    };

    const checkWhileFlying = () => {
      throttledUpdate();

      const point = globe.project(targetLngLat);
      const features = globe.queryRenderedFeatures(point, {
        layers: ['clusters', 'unclustered-point']
      });

      // Check for unclustered point
      const unclustered = features.find(f =>
        f.layer.id === 'unclustered-point' &&
        f.properties.wikidata_id === human.wikidata_id
      );

      if (unclustered && !animationStopped) {
        stopAndSelect([human]);
        return;
      }

      // Check for fully overlapping cluster
      const cluster = features.find(f => f.layer.id === 'clusters');
      if (cluster && !animationStopped) {
        const clusterId = cluster.properties.cluster_id;
        const isFullyOverlapping = globe.getFeatureState({ source: 'humans', id: clusterId })?.fullyOverlapping;

        if (isFullyOverlapping) {
          globe.getSource('humans').getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
            if (err) return;
            const sorted = leaves.map(l => ({
              ...l.properties,
              lat: l.geometry.coordinates[1],
              lng: l.geometry.coordinates[0],
            })).sort((a, b) => a.name.localeCompare(b.name));
            stopAndSelect(sorted);
          });
        }
      }
    };

    // 👇 Start flying to the target at full zoom
    globe.flyTo({
      center: targetLngLat,
      zoom: maxZoom,
      speed: 0.8,
      curve: 1.5,
      easing: t => t,
    });

    // 👀 Begin checking mid-flight
    globe.on('move', checkWhileFlying);
    globe.once('moveend', () => {
      globe.off('move', checkWhileFlying);
    });
  };

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Globe
            globeRef={globeRef}
            notableHumans={notableHumans}
            setSelectedClusterHumans={setSelectedClusterHumans}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarTrigger={sidebarTrigger}
            setSidebarTrigger={setSidebarTrigger}
            lastMarkerCoordinates={lastMarkerCoordinates}
            setLastMarkerCoordinates={setLastMarkerCoordinates}
            pendingClusterExpansion={pendingClusterExpansion}
            setPendingClusterExpansion={setPendingClusterExpansion}
            sidebarMode={sidebarMode}
            setSidebarMode={setSidebarMode}
            focusedZoomRef={focusedZoomRef}
            lastMarkerCoordinatesRef={lastMarkerCoordinatesRef}
            sidebarModeRef={sidebarModeRef}
        />
        <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarTrigger={sidebarTrigger}
            setSidebarTrigger={setSidebarTrigger}
            humansAtMarker={selectedClusterHumans}
            lastMarkerCoordinates={lastMarkerCoordinates}
            pendingClusterExpansion={pendingClusterExpansion}
            setPendingClusterExpansion={setPendingClusterExpansion}
            sidebarMode={sidebarMode}
            onSelectPerson={handleSelectPerson}
        />
      </div>
    </div>
  );
}

export default App;
