// useFilterState.js
import { useState } from 'react';

export const useFilterState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('n');
  const [sortAsc, setSortAsc] = useState(true);

  return {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortAsc, setSortAsc,
  };
};
