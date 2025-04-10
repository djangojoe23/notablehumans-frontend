import React, { useRef, useState, useEffect } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import './App.css';

function App() {
  const {
    globeRef,
    notableHumans, setNotableHumans,
    error, setError,
    sidebarOpen, setSidebarOpen,
    sidebarTrigger, setSidebarTrigger,
    selectedClusterHumans, setSelectedClusterHumans,
    lastMarkerCoordinates, setLastMarkerCoordinates,
    pendingClusterExpansion, setPendingClusterExpansion
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
        />
      </div>
    </div>
  );
}

export default App;
