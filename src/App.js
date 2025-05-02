import React, { useEffect, useMemo, useState } from 'react';
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
        searchQuery,    setSearchQuery,
        sortBy,         setSortBy,
        sortAsc,        setSortAsc,
        birthYearRange, setBirthYearRange,
        minBirthMonth,  setMinBirthMonth,
        minBirthDay,    setMinBirthDay,
        maxBirthMonth,  setMaxBirthMonth,
        maxBirthDay,    setMaxBirthDay,
      } = useFilterState();

    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300); // wait 300ms after typing
    const debouncedBirthYearRange = useDebouncedValue(birthYearRange, 300); // 300ms delay

    const notableHumans = useMemo(() => {
        if (!globeState.notableHumanData?.features) return [];

        // map GeoJSON → flat array
        let humans = globeState.notableHumanData.features.map(f => ({
          ...f.properties,
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }));

        // 1) Search‐by‐name
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          humans = humans.filter(h =>
            h.n?.toLowerCase().includes(q)
          );
        }

        // 2) Date‐of‐birth filtering: year, then month/day
        const [minY, maxY] = debouncedBirthYearRange;
        humans = humans.filter(h => {
          // parse a full birth‐date if available, or fallback to year only
          let year = h.by;
          let month = null;
          let day = null;

          if (h.bd) {
            [ year, month, day ] = h.bd
              .split('-')
              .map(num => parseInt(num, 10));
          }

          // Year check
          if (minY != null && year < minY) return false;
          if (maxY != null && year > maxY) return false;

          // Month check
          if (minBirthMonth != null) {
            // if no month available, exclude
            if (month == null) return false;
            if (month < minBirthMonth) return false;
            // if same month, check day
            if (month === minBirthMonth && minBirthDay != null && day < minBirthDay) {
              return false;
            }
          }
          if (maxBirthMonth != null) {
            if (month == null) return false;
            if (month > maxBirthMonth) return false;
            if (month === maxBirthMonth && maxBirthDay != null && day > maxBirthDay) {
              return false;
            }
          }

          return true;
        });

        // 3) Sort
        humans.sort(sortHumansComparator(sortBy, sortAsc));
        return humans;
      }, [
        globeState.notableHumanData,
        debouncedSearchQuery,
        debouncedBirthYearRange,
        sortBy, sortAsc,
        minBirthMonth, minBirthDay,
        maxBirthMonth, maxBirthDay
      ]);

    // ← Build a `filters` object with every single value & setter
    const filters = useMemo(() => ({
        searchQuery,    setSearchQuery,
        sortBy,         setSortBy,
        sortAsc,        setSortAsc,
        birthYearRange, setBirthYearRange,
        minBirthMonth,  setMinBirthMonth,
        minBirthDay,    setMinBirthDay,
        maxBirthMonth,  setMaxBirthMonth,
        maxBirthDay,    setMaxBirthDay,
    }), [
        searchQuery, sortBy, sortAsc, birthYearRange,
        minBirthMonth, minBirthDay, maxBirthMonth, maxBirthDay
    ]);

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
