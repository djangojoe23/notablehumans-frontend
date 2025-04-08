import React, { useRef, useState, useEffect } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import './App.css';

function App() {
  const mapRef = useRef(null);
  const [notableHumans, setNotableHumans] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/notable-humans-geojson/")
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
        <Globe mapRef={mapRef} notableHumans={notableHumans} />
        <Sidebar
          mapRef={mapRef}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      </div>
    </div>
  );
}

export default App;
