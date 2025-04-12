import React, { useEffect } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import throttle from 'lodash.throttle';
import updateClusterVisualStates from './utils/updateClusterVisualStates';
import { isMarkerStillFocused } from './utils/mapValidation'; // adjust path as needed
import './App.css';

function App() {
  const {
      globeRef,
      notableHumans, setNotableHumans,
      error, setError,
      sidebarOpen, setSidebarOpen,
      sidebarTrigger, setSidebarTrigger,
      sidebarMode, setSidebarMode,
      selectedListHuman, setSelectedListHuman,
      selectedClusterHumans, setSelectedClusterHumans,
      lastMarkerCoordinates, setLastMarkerCoordinates,
      pendingClusterExpansion, setPendingClusterExpansion,
      focusedZoomRef, lastMarkerCoordinatesRef,
      sidebarModeRef,
      expandedHumanId, setExpandedHumanId,
      haloPersistRef, currentHaloFeatureRef, pulseAnimationFrameRef, isAnimatingRef
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

    // 💡 Exit early if already focused and in "location" mode
   const alreadyFocused =
    sidebarModeRef.current === 'location' &&
    selectedClusterHumans.some(h => h.wikidata_id === human.wikidata_id) &&
    isMarkerStillFocused({
      globe,
      targetLngLat,
      focusedZoom: focusedZoomRef.current,
      tolerance: 30,
      zoomThreshold: 0.1,
    });

    if (alreadyFocused) {
      setSelectedListHuman(human);         // highlight immediately
      setExpandedHumanId(human.wikidata_id); // expand info
      return;
    }

    setSelectedListHuman(human); // fallback case: update normally

    let animationStopped = false;

    const throttledUpdate = throttle(() => {
      updateClusterVisualStates(globe);
    }, 150);

    const stopAndSelect = (humansAtPoint) => {
      setSelectedClusterHumans(humansAtPoint);

      const matched = humansAtPoint.find(h => h.wikidata_id === human.wikidata_id);
      setSelectedListHuman(matched ?? null);

      setLastMarkerCoordinates(targetLngLat);
      setSidebarMode('location');
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
        layers: ['clusters', 'unclustered-point'],
      });

      const unclustered = features.find(f =>
        f.layer.id === 'unclustered-point' &&
        f.properties.wikidata_id === human.wikidata_id
      );

      if (unclustered && !animationStopped) {
        stopAndSelect([human]);
        return;
      }

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

    globe.flyTo({
      center: targetLngLat,
      zoom: maxZoom,
      speed: 0.8,
      curve: 1.5,
      easing: t => t,
    });

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
            setSelectedListHuman={setSelectedListHuman}
            setSelectedClusterHumans={setSelectedClusterHumans}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarTrigger={sidebarTrigger}
            setSidebarTrigger={setSidebarTrigger}
            lastMarkerCoordinates={lastMarkerCoordinates}
            setLastMarkerCoordinates={setLastMarkerCoordinates}
            pendingClusterExpansion={pendingClusterExpansion}
            setPendingClusterExpansion={setPendingClusterExpansion}
            setSidebarMode={setSidebarMode}
            focusedZoomRef={focusedZoomRef}
            lastMarkerCoordinatesRef={lastMarkerCoordinatesRef}
            sidebarModeRef={sidebarModeRef}
            setExpandedHumanId={setExpandedHumanId}
            haloPersistRef={haloPersistRef}
            currentHaloFeatureRef={currentHaloFeatureRef}
            pulseAnimationFrameRef={pulseAnimationFrameRef}
            isAnimatingRef={isAnimatingRef}
        />
        <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            setSidebarTrigger={setSidebarTrigger}
            humansAtMarker={selectedClusterHumans}
            sidebarMode={sidebarMode}
            onSelectPerson={handleSelectPerson}
            selectedListHuman={selectedListHuman}
            setSelectedListHuman={setSelectedListHuman}
            expandedHumanId={expandedHumanId}
            setExpandedHumanId={setExpandedHumanId}
        />
      </div>
    </div>
  );
}

export default App;
