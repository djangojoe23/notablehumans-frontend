import React, { useEffect, useMemo } from 'react';
import axios from "axios";
import { Box, Typography } from '@mui/material';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import { useFilterState } from './hooks/useFilterState';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { sortHumansComparator } from './utils/sortHumans';


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

    const {
        searchQuery, setSearchQuery,
        sortBy, setSortBy,
        sortAsc, setSortAsc,
    } = useFilterState();

    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300); // wait 300ms after typing

    const notableHumans = useMemo(() => {
      if (!globeState.notableHumanData?.features) return [];

      let humans = globeState.notableHumanData.features.map(f => ({
        ...f.properties,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      }));


      if (debouncedSearchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        humans = humans.filter(person =>
          person.n?.toLowerCase().includes(lowerQuery)
        );
      }

      const cmp = sortHumansComparator(sortBy, sortAsc);
      humans.sort((a, b) => cmp(a, b));


      return humans;
    }, [globeState.notableHumanData, debouncedSearchQuery, sortBy, sortAsc]);

    const filters = {
      searchQuery, setSearchQuery,
      sortBy, setSortBy,
      sortAsc, setSortAsc,
    };

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
        <Globe {...globeState} filters={filters} notableHumans={notableHumans} />
        <Sidebar
            {...globeState}
            filters={filters}
            notableHumans={notableHumans}
        />
      </Box>
    </Box>
  );
}

export default App;
