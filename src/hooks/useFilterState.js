// useFilterState.js
import { useState } from 'react';

export const useFilterState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('n');
  const [sortAsc, setSortAsc] = useState(true);

  const [filterYear,    setFilterYear]    = useState(null);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterDay,   setFilterDay]   = useState(null);
  const [filterYearRange,    setFilterYearRange]    = useState(null);

  const [dateFilterType, setDateFilterType] = useState('born');


  return {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortAsc, setSortAsc,

    filterYear,      setFilterYear,
    filterMonth,  setFilterMonth,
    filterDay,    setFilterDay,
    filterYearRange,      setFilterYearRange,

    dateFilterType, setDateFilterType,
  };
};
