import React, { useEffect } from 'react';
import axios from "axios";
import { Box, Typography } from '@mui/material';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
// import './styles/App.css';
// import './styles/layout.css';

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

  // if (globeState.dataLoadError) return <div>{globeState.dataLoadError}</div>;
  // if (!globeState.notableHumanData) return <div>Loading...</div>;

    if (globeState.dataLoadError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error" fontWeight="bold">
          {globeState.dataLoadError}
        </Typography>
      </Box>
    );
  }

  if (!globeState.notableHumanData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh" overflow="hidden">
      <Header />
      <Box position="relative" flex={1} overflow="hidden">
        <Globe {...globeState} />
        <Sidebar {...globeState} />
      </Box>
    </Box>
  );
}

export default App;
