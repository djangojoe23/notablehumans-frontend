// useFilterState.js
import { useState } from 'react';

export const useFilterState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('n');
  const [sortAsc, setSortAsc] = useState(true);

  const [birthYearRange, setBirthYearRange] = useState([-4000, 2025]);


  return {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortAsc, setSortAsc,

    birthYearRange, setBirthYearRange
  };
};
