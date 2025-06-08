import React, { useEffect, useMemo, useState } from 'react';
import axios from "axios";

import { Box, Typography, CircularProgress } from '@mui/material';

import NavBar from './components/NavBar';
import { useGlobeState } from './hooks/useGlobeState';
import { useFilterState } from './hooks/useFilterState';
import Globe from "../src/components/Globe";
import Sidebar from "../src/components/Sidebar";
import {sortHumansComparator} from "./utils/sortHumans";
import {parseYMD} from "./utils/formatDates";

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
const makeFilterDate = (year, month, day) => {
    const d = new Date(0);               // epoch
    d.setUTCFullYear(year, month - 1, day);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

function App() {
    const SIDEBAR_WIDTH = 450;

    const globeState = useGlobeState();
    const filterState = useFilterState();
    const [articleMetadata, setArticleMetadata] = useState(null); // for sorting
    const [attributeMatchIds, setAttributeMatchIds] = useState([]);

    //Load the GeoJSON of all humans
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/names-coords-dates/`)
        .then((result) => {
            globeState.setGeojsonData(result.data);
            globeState.setGeojsonLoadError(null);
        })
        .catch((err) => {
            //Log the full error object to the console (dev debugging)
            console.error("Failed to fetch GeoJSON:", err);

            // If the server responded with a status code (4xx/5xx), err.response will be defined. You can inspect it:
            if (err.response) {
                // HTTP status code (e.g. 404, 500, etc.)
                const status = err.response.status;
                // Sometimes the API sends back its own error message
                const serverMessage = err.response.data?.message || "";
                const customMessage = `Server returned ${status}. ${serverMessage}`;
                globeState.setGeojsonLoadError(customMessage);
            }
            // If the request was made but no response came back (network issue, CORS, timeout)
                else if (err.request) {
                    globeState.setGeojsonLoadError(
                      "No response from server. Please check your network connection."
                );
            }
            // Something else happened when setting up the request
            else {
                globeState.setGeojsonLoadError(
                  `Request setup failed: ${err.message}`
                );
            }
        });
    }, []);

    // Load Wikipedia article metadata when needed for sorting
    useEffect(() => {
        if (
            ["cd", "al", "rv", "te"].includes(filterState.sortBy) && !articleMetadata
        ) {
            axios.get(`${process.env.REACT_APP_API_URL}/article-metadata/`)
            .then((result) => setArticleMetadata(result.data))
            .catch((err) => console.error("Failed to load article metadata", err));
        }
    }, [filterState.sortBy, articleMetadata]);

    // 3) Whenever attributeFilters changes, hit the server for matching IDs
    useEffect(() => {
        // only call when there's at least one fully-configured filter
        const active = filterState.attributeFilters.filter(f => f.attribute && f.values.length);
        if (active.length > 0) {
          axios.post(
            `${process.env.REACT_APP_API_URL}/filter-by-attributes/`,
            { filters: active }
          )
          .then(result => {
            setAttributeMatchIds(Array.isArray(result.data.ids) ? result.data.ids : []);
          })
          .catch(err => {
            console.error("Attribute filter failed", err);
            setAttributeMatchIds([]); // treat as no matches
          });
        } else {
          // no attribute filters → clear
          setAttributeMatchIds([]); // no filter -> allow everyone
        }
    }, [filterState.attributeFilters]);

    const debouncedSearchQuery = useDebouncedValue(filterState.searchQuery, 300);
    const debouncedFilterYearRange = useDebouncedValue(filterState.filterYearRange, 300); // 300ms delay
    const debouncedFilterYear  = useDebouncedValue(filterState.filterYear, 300);
    const debouncedFilterAge  = useDebouncedValue(filterState.filterAge, 300);
    const humanIdSetAfterAttributeFilter = useMemo(() => {
        return attributeMatchIds.length > 0
          ? new Set(attributeMatchIds)
          : null;
    }, [attributeMatchIds]);

    const filteredHumans = useMemo(() => {
        if (!globeState.geojsonData?.features) return [];

        let humans = globeState.geojsonData.features.map(f => ({
            ...f.properties,
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            ...(articleMetadata?.[f.properties.id] || {})
        }));

        // attribute filter
        if (humanIdSetAfterAttributeFilter) humans = humans.filter(h => humanIdSetAfterAttributeFilter.has(h.id));

        // name filter
        if (debouncedSearchQuery.trim()) {
            const q = debouncedSearchQuery.toLowerCase();
                humans = humans.filter(h => {
                const name = h.n?.toLowerCase() || '';
                return filterState.nameMatchType === 'startswith'
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
            const m0 = filterState.filterMonth;
            const d0 = filterState.filterDay;

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

            if (filterState.dateFilterType === 'born') {
                if (y0 == null) {
                    if (m0 != null && bm !== m0) return false;
                    if (d0 != null && bd !== d0) return false;
                    return true;
                }
                return inRange(by, bm, bd);
            }

            if (filterState.dateFilterType === 'died') {
                if (dy == null) return false;
                if (y0 == null) {
                    if (m0 != null && dm !== m0) return false;
                    if (d0 != null && dd !== d0) return false;
                    return true;
                }
                return inRange(dy, dm, dd);
            }

            if (filterState.dateFilterType === 'alive') {
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
                if (filterState.filterAgeType === 'exact') return false;  // exact excludes still-living
            }

            if (filterState.filterAgeType === 'min') return age >= debouncedFilterAge;
            if (filterState.filterAgeType === 'exact') return age === debouncedFilterAge;
            if (filterState.filterAgeType === 'max') return age <= debouncedFilterAge;
            return true;
        });

        return humans;
    }, [
        globeState.geojsonData,
        humanIdSetAfterAttributeFilter,
        articleMetadata,
        debouncedSearchQuery, filterState.nameMatchType,
        filterState.dateFilterType,
        filterState.filterMonth,
        filterState.filterDay,
        debouncedFilterYear,
        debouncedFilterYearRange,
        filterState.filterAgeType,
        debouncedFilterAge
    ]);
    // Build a Set of IDs for O(1) membership checks:
    const filteredHumansIdSet = useMemo(
    () => new Set(filteredHumans.map((h) => h.id)),
    [filteredHumans]
    );

    const sortedHumans = useMemo(() => {
        const unpackedHumans = [...filteredHumans];
        unpackedHumans.sort(sortHumansComparator(filterState.sortBy, filterState.sortAsc));
        return unpackedHumans;
    }, [filteredHumans, filterState.sortBy, filterState.sortAsc]);

    if (globeState.geojsonLoadError) {
        return (
          <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <Typography color="error" fontWeight="bold">
              {globeState.geojsonLoadError}
            </Typography>
          </Box>
        );
      }
    if (!globeState.geojsonData) {
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

            <NavBar />
            <Box position="relative" flex={1} overflow="hidden">

                <Globe
                    humans={filteredHumans}
                    globeState={globeState}
                    filterState={filterState}
                    filteredHumansIdSet={filteredHumansIdSet}
                    SIDEBAR_WIDTH={SIDEBAR_WIDTH}
                />

                <Sidebar
                    humans={sortedHumans}
                    SIDEBAR_WIDTH={SIDEBAR_WIDTH}
                    globeState={globeState}
                    filterState={filterState}
                />

            </Box>
        </Box>
    );
}

export default App;
