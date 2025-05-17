import React, { useEffect, useMemo, useState } from 'react';
import axios from "axios";
import { Box, Typography, CircularProgress } from '@mui/material';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Globe from './components/Globe';
import useGlobeState from './hooks/useGlobeState';
import { useFilterState } from './hooks/useFilterState';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { sortHumansComparator } from './utils/sortHumans';


// Helper to construct dates correctly even for ancient years
const makeFilterDate = (year, month, day) => {
  const d = new Date(0);               // epoch
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};


function App() {
    const globeState = useGlobeState();

    const [articleMetadata, setArticleMetadata] = useState(null);

    useEffect(() => {
        axios
        .get(`${process.env.REACT_APP_API_URL}/names-coords-dates/`)
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
    dateFilterType, setDateFilterType,
    filterYear, setFilterYear,
    filterYearRange, setFilterYearRange,
    filterMonth,  setFilterMonth,
    filterDay,    setFilterDay,
    filterAgeType,  setFilterAgeType,
    filterAge,      setFilterAge
  } = useFilterState();

    // ✅ Fetch article metadata only when needed
    useEffect(() => {
        if (
          ["cd", "al", "rv", "te"].includes(sortBy) &&
          !articleMetadata
        ) {
          axios
            .get(`${process.env.REACT_APP_API_URL}/article-metadata/`)
            .then((res) => setArticleMetadata(res.data))
            .catch((err) => console.error("Failed to load article metadata", err));
        }
    }, [sortBy, articleMetadata]);

    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300); // wait 300ms after typing
    const debouncedFilterYearRange = useDebouncedValue(filterYearRange, 300); // 300ms delay
    const debouncedFilterYear  = useDebouncedValue(filterYear, 300);
    const debouncedFilterAge  = useDebouncedValue(filterAge, 300);

    // filter + sort humans
    const notableHumans = useMemo(() => {
        if (!globeState.notableHumanData?.features) return [];

        let humans = globeState.notableHumanData.features.map(f => ({
          ...f.properties,
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }));

        // ✅ Merge metadata before filtering/sorting
        if (articleMetadata) {
          humans = humans.map(h => ({
            ...h,
            ...(articleMetadata[h.id] || {})
          }));
        }

        // 1) search-by-name
        if (debouncedSearchQuery.trim()) {
          const q = debouncedSearchQuery.toLowerCase();
          humans = humans.filter(h => h.n?.toLowerCase().includes(q));
        }

        // 2) date filtering (born/died/alive)
        humans = humans.filter(h => {
          // parse birth
          let by = h.by;
          let bm = null;
          let bd = null;
          if (h.bd) [by, bm, bd] = h.bd.split('-').map(n => parseInt(n, 10));

          // parse death
          let dy = h.dy;
          let dm = null;
          let dd = null;
          if (h.dd) [dy, dm, dd] = h.dd.split('-').map(n => parseInt(n, 10));

          const y0 = debouncedFilterYear;
          const r  = debouncedFilterYearRange;
          const m0 = filterMonth;
          const d0 = filterDay;

          // compute year-range endpoints
          const startYear = r != null ? Math.min(y0, y0 + r) : y0;
          const endYear   = r != null ? Math.max(y0, y0 + r) : y0;

          // helper for full date + range + year-only + exact
          const inRange = (year, month, day) => {
            if (year == null) return false;
            if (r != null && m0 != null && d0 != null) {
              if (month == null || day == null) return false;
              const start = makeFilterDate(startYear, m0 - 1, d0);
              const end   = makeFilterDate(endYear,   m0 - 1, d0);
              const rec   = makeFilterDate(year,     month - 1, day);
              return rec >= start && rec <= end;
            }
            if (r != null) {
              return year >= startYear && year <= endYear;
            }
            if (year !== y0) return false;
            if (m0  != null && month !== m0) return false;
            if (d0  != null && day   !== d0) return false;
            return true;
          };

          if (dateFilterType === 'born') {
            if (y0 == null) {
              if (m0 != null && bm !== m0) return false;
              if (d0 != null && bd !== d0) return false;
              return true;
            }
            return inRange(by, bm, bd);
          }

          if (dateFilterType === 'died') {
            if (dy == null) return false;
            if (y0 == null) {
              if (m0 != null && dm !== m0) return false;
              if (d0 != null && dd !== d0) return false;
              return true;
            }
            return inRange(dy, dm, dd);
          }

          if (dateFilterType === 'alive') {
            // require at least a year
            if (y0 == null) return false;

            // individual's life-span boundaries
            const bornDate = makeFilterDate(by, bm || 1, bd || 1);
            let deathBoundary;
            if (dy != null) {
              const dmVal = dm || 12;
              const ddVal = dd || 31;
              deathBoundary = makeFilterDate(dy, dmVal, ddVal);
            } else {
              const today   = new Date();
              const capDate = makeFilterDate(by + 150, bm || 1, bd || 1);
              deathBoundary = capDate < today ? capDate : today;
            }

            // If user provided a range, compute full target window
            if (r != null) {
              let startTarget, endTarget;
              // full-date range
              if (m0 != null && d0 != null) {
                startTarget = makeFilterDate(startYear, m0, d0);
                endTarget   = makeFilterDate(endYear,   m0, d0);
              }
              // month-only range
              else if (m0 != null) {
                startTarget = makeFilterDate(startYear, m0, 1);
                const days = new Date(endYear, m0, 0).getDate();
                endTarget   = makeFilterDate(endYear,   m0, days);
              }
              // year-only range
              else {
                startTarget = makeFilterDate(startYear, 1, 1);
                endTarget   = makeFilterDate(endYear,   12, 31);
              }
              return bornDate <= endTarget && deathBoundary >= startTarget;
            }

            // no range → original exact/month/year logic
            // Year + Month + Day → exact-day match
            if (m0 != null && d0 != null) {
              const targetDay = makeFilterDate(y0, m0, d0);
              return bornDate <= targetDay && deathBoundary >= targetDay;
            }
            // Year + Month → within-month match
            if (m0 != null) {
              const startOfMonth = makeFilterDate(y0, m0, 1);
              const daysInMonth  = new Date(y0, m0, 0).getDate();
              const endOfMonth   = makeFilterDate(y0, m0, daysInMonth);
              return bornDate <= endOfMonth && deathBoundary >= startOfMonth;
            }
            // Year only → within-year match
            const startOfYear = makeFilterDate(y0, 1, 1);
            const endOfYear   = makeFilterDate(y0, 12, 31);
            return bornDate <= endOfYear && deathBoundary >= startOfYear;
          }

          return true;
        });

        // 2) lived‑to‑be filter
        humans = humans.filter(h => {
          if (debouncedFilterAge == null) return true;        // no age filter → keep all
          // parse birth
          const [by, bm = 1, bd = 1] = h.bd
            ? h.bd.split('-').map(n => +n)
            : [null, null, null];
          if (by == null) return false;

          let age;
          if (h.dd) {
            // died → age at death
            const [dy, dm = 1, dd] = h.dd.split('-').map(n => +n);
            age = dy - by;
            if (dm < bm || (dm === bm && dd < bd)) age--;
          } else {
            // still alive → age up to today
            const today = new Date();
            age = today.getUTCFullYear() - by -
              ((today.getUTCMonth()+1) < bm ||
               ((today.getUTCMonth()+1) === bm && today.getUTCDate() < bd)
                ? 1
                : 0);
            // exact → exclude still‑living
            if (filterAgeType === 'exact') return false;
          }

          return filterAgeType === 'min'
            ? age >= debouncedFilterAge
            : age === debouncedFilterAge;
        });

        // 3) Sort
        humans.sort(sortHumansComparator(sortBy, sortAsc));
        return humans;
    }, [
    globeState.notableHumanData,
    debouncedSearchQuery,
    sortBy, sortAsc,
    dateFilterType, filterMonth, filterDay, debouncedFilterYear, debouncedFilterYearRange,
    filterAgeType, debouncedFilterAge,
    ]);

    // ← Build a `filters` object with every single value & setter
    const filters = useMemo(() => ({
        searchQuery,    setSearchQuery,
        sortBy,         setSortBy,
        sortAsc,        setSortAsc,
        dateFilterType, setDateFilterType,
        filterYear, setFilterYear,
        filterYearRange, setFilterYearRange,
        filterMonth,  setFilterMonth,
        filterDay,    setFilterDay,
        filterAgeType,  setFilterAgeType,
        filterAge,      setFilterAge,
    }), [
        searchQuery, sortBy, sortAsc,
        dateFilterType, filterMonth, filterDay, filterYear, filterYearRange,
        filterAgeType, filterAge,
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
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100vh"
              flexDirection="column"
            >
              <CircularProgress />
              <Typography mt={2}>Loading data...</Typography>
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
