// useFilterState.js
import { useState } from 'react';

export const useFilterState = () => {
  const [nameMatchType, setNameMatchType] = useState('startswith');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('n');
  const [sortAsc, setSortAsc] = useState(true);

  const [dateFilterType, setDateFilterType] = useState('born');
  const [filterYear,    setFilterYear]    = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterDay,   setFilterDay]   = useState(null);
  const [filterYearRange,    setFilterYearRange]    = useState(null);

  const [filterAgeType, setFilterAgeType] = useState('exact');
  const [filterAge,     setFilterAge]     = useState(null);

  const [attributeFilters, setAttributeFilters] = useState([
    { id: Date.now(), attribute: '', matchType: 'any', values: [] }
  ]);

  return {
    nameMatchType, setNameMatchType,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortAsc, setSortAsc,

    dateFilterType, setDateFilterType,
    filterYear,      setFilterYear,
    filterMonth,  setFilterMonth,
    filterDay,    setFilterDay,
    filterYearRange,      setFilterYearRange,

    filterAgeType, setFilterAgeType,
    filterAge,     setFilterAge,

    attributeFilters, setAttributeFilters,
  };
};
