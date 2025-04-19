import React, { useEffect } from 'react';
import axios from "axios";
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import './App.css';

function App() {
    const globeState = useGlobeState();

    useEffect(() => {
        axios
        .get(`${process.env.REACT_APP_API_URL}/notable-humans-geojson/`)
        .then((res) => {
            globeState.setNotableHumanData(res.data);
        })
        .catch((err) => {
            console.error("Error fetching GeoJSON", err);
            globeState.setDataLoadError("Failed to load data");
        });
    }, []);

  if (globeState.dataLoadError) return <div>{globeState.dataLoadError}</div>;
  if (!globeState.notableHumanData) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Globe {...globeState} />
        <Sidebar
            {...globeState}
        />
      </div>
    </div>
  );
}

export default App;
