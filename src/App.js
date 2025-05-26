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
import { getFilterClauses, generateFilterSummary } from './utils/filterSummary';
import { parseYMD } from './utils/format';


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
    const [attributeMatchIds, setAttributeMatchIds] = useState([]);

    const {
        nameMatchType, setNameMatchType,
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
        attributeFilters, setAttributeFilters
    } = useFilterState();


    // 1) Load the GeoJSON of all humans
    useEffect(() => {
        axios
        .get(`${process.env.REACT_APP_API_URL}/names-coords-dates/`)
        .then((res) => {
            globeState.setNotableHumanData(res.data);
        })
        .catch((err) => {
            globeState.setDataLoadError("Failed to load data");
        });
    }, []);

    // 2) Load article metadata when needed
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

    // 3) Whenever attributeFilters changes, hit the server for matching IDs
    useEffect(() => {
        // only call when there's at least one fully-configured filter
        const active = attributeFilters.filter(f => f.attribute && f.values.length);
        if (active.length > 0) {
          axios.post(
            `${process.env.REACT_APP_API_URL}/filter-by-attributes/`,
            { filters: active }
          )
          .then(res => {
            setAttributeMatchIds(Array.isArray(res.data.ids) ? res.data.ids : []);
          })
          .catch(err => {
            console.error("Attribute filter failed", err);
            setAttributeMatchIds([]); // treat as no matches
          });
        } else {
          // no attribute filters → clear
          setAttributeMatchIds([]); // no filter -> allow everyone
        }
    }, [attributeFilters]);

    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300); // wait 300ms after typing
    const debouncedFilterYearRange = useDebouncedValue(filterYearRange, 300); // 300ms delay
    const debouncedFilterYear  = useDebouncedValue(filterYear, 300);
    const debouncedFilterAge  = useDebouncedValue(filterAge, 300);

    // 1) memoize the Set of IDs
    const idSet = useMemo(() => {
        return attributeMatchIds.length > 0
          ? new Set(attributeMatchIds)
          : null;
    }, [attributeMatchIds]);


  // 4) FILTER (no sort)
  const filteredHumans = useMemo(() => {
    if (!globeState.notableHumanData?.features) return [];

    let humans = globeState.notableHumanData.features.map(f => ({
      ...f.properties,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      ...(articleMetadata?.[f.properties.id] || {})
    }));

    // attribute filter
    if (idSet) humans = humans.filter(h => idSet.has(h.id));

    // name filter
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      humans = humans.filter(h => {
        const name = h.n?.toLowerCase() || '';
        return nameMatchType === 'startswith'
          ? name.startsWith(q)
          : name.includes(q);
      });
    }

    // date filtering (born/died/alive)
    humans = humans.filter(h => {
      // parse birth
      const { year: by, month: bm, day: bd } = parseYMD(h.bd);

      // parse death
      const { year: dy, month: dm, day: dd } = parseYMD(h.dd);

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

    //lived‑to‑be filter
    humans = humans.filter(h => {
      if (debouncedFilterAge == null) return true;        // no age filter → keep all

      // --- parse birth with optional leading “-” ---
      const { year: by, month: bm, day: bd } = parseYMD(h.bd);
      if (by == null) return false;

      // --- parse death with optional leading “-” ---
      const { year: dy, month: dm, day: dd } = parseYMD(h.dd);

      // compute age
      let age;
      if (dy != null) {
        // died → age at death
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
        if (filterAgeType === 'exact') return false;  // exact excludes still-living
      }

      if (filterAgeType === 'min') return age >= debouncedFilterAge;
      if (filterAgeType === 'exact') return age === debouncedFilterAge;
      if (filterAgeType === 'max') return age <= debouncedFilterAge;
      return true;
    });

    return humans;
  }, [
    globeState.notableHumanData,
    articleMetadata,
    idSet,
    debouncedSearchQuery,
    nameMatchType,
    dateFilterType,
    filterMonth,
    filterDay,
    debouncedFilterYear,
    debouncedFilterYearRange,
    filterAgeType,
    debouncedFilterAge
  ]);

  // 5) SORT for list
  const sortedHumans = useMemo(() => {
    const arr = [...filteredHumans];
    arr.sort(sortHumansComparator(sortBy, sortAsc));
    return arr;
  }, [filteredHumans, sortBy, sortAsc]);



    // Initialize summary & clauses
    const initialParams = {
        nameMatchType,
        searchQuery, dateFilterType,
        filterYear, filterYearRange,
        filterMonth, filterDay,
        filterAge, filterAgeType,
        attributeFilters,
        resultsCount: filteredHumans.length,
    };
    const [filterSummary, setFilterSummary] = useState(
        generateFilterSummary(initialParams)
    );
    const [filterClauses, setFilterClauses] = useState(
        getFilterClauses(initialParams)
    );

    useEffect(() => {
      const timeoutId = setTimeout(() => {
        const params = {...initialParams, resultsCount: filteredHumans.length};
        setFilterSummary(generateFilterSummary(params));
        setFilterClauses(getFilterClauses(params));
      }, 350);
      return () => clearTimeout(timeoutId);
    }, [
      filteredHumans.length,
      nameMatchType,
      searchQuery,
      dateFilterType,
      filterYear,
      filterYearRange,
      filterMonth,
      filterDay,
      filterAge,
      filterAgeType,
      attributeFilters,
    ]);

    // ← Build a `filters` object with every single value & setter
    const filters = useMemo(() => ({
        nameMatchType, setNameMatchType,
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
        attributeFilters, setAttributeFilters
    }), [
        nameMatchType, searchQuery, sortBy, sortAsc,
        dateFilterType, filterMonth, filterDay, filterYear, filterYearRange,
        filterAgeType, filterAge, attributeFilters
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

        <Globe {...globeState} filters={filters} filterClauses={filterClauses} notableHumans={filteredHumans} />

        <Sidebar
            {...globeState}
            filters={filters}
            notableHumans={sortedHumans}
        />
      </Box>
    </Box>
  );
}

export default App;
