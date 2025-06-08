import { useState, useMemo } from 'react';
import useSyncedStateWithRef from './useSyncedStateWithRef';

export const useFilterState = () => {
    // 1) Individual pieces of state and their setters
    const [nameMatchType,    setNameMatchType]    = useState('startswith');
    const [searchQuery,      setSearchQuery]      = useState('');
    const [sortBy,    setSortBy,      sortByRef]  = useSyncedStateWithRef('n');
    const [sortAsc,   setSortAsc,     sortAscRef] = useSyncedStateWithRef(true)

    const [dateFilterType,   setDateFilterType]   = useState('born');
    const [filterYear,       setFilterYear]       = useState(null);
    const [filterMonth,      setFilterMonth]      = useState(null);
    const [filterDay,        setFilterDay]        = useState(null);
    const [filterYearRange,  setFilterYearRange]  = useState(null);

    const [filterAgeType,    setFilterAgeType]    = useState('exact');
    const [filterAge,        setFilterAge]        = useState(null);

    const [attributeFilters, setAttributeFilters] = useState([
        { id: Date.now(), attribute: '', matchType: 'any', values: [] }
    ]);

    // 2) useMemo wraps the returned object so it only changes
    //    when one of the dependency values actually updates.
    return useMemo(() => ({
        nameMatchType,    setNameMatchType,
        searchQuery,      setSearchQuery,
        sortBy,           setSortBy, sortByRef,
        sortAsc,          setSortAsc, sortAscRef,

        dateFilterType,   setDateFilterType,
        filterYear,       setFilterYear,
        filterMonth,      setFilterMonth,
        filterDay,        setFilterDay,
        filterYearRange,  setFilterYearRange,

        filterAgeType,    setFilterAgeType,
        filterAge,        setFilterAge,

        attributeFilters, setAttributeFilters,
    }),
        [
            nameMatchType,
            searchQuery,
            sortBy,
            sortAsc,
            dateFilterType,
            filterMonth,
            filterDay,
            filterYear,
            filterYearRange,
            filterAgeType,
            filterAge,
            attributeFilters
        ]
    );
};
