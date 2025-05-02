// useFilterState.js
import { useState } from 'react';

export const useFilterState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('n');
  const [sortAsc, setSortAsc] = useState(true);

  const [birthYearRange, setBirthYearRange] = useState([-4000, 2025]);
  const [minBirthMonth, setMinBirthMonth] = useState(null);
  const [minBirthDay,    setMinBirthDay]    = useState(null);
  const [maxBirthMonth,  setMaxBirthMonth]  = useState(null);
  const [maxBirthDay,    setMaxBirthDay]    = useState(null);


  return {
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    sortAsc, setSortAsc,

    birthYearRange, setBirthYearRange,

    minBirthMonth, setMinBirthMonth,
    minBirthDay,   setMinBirthDay,
    maxBirthMonth, setMaxBirthMonth,
    maxBirthDay,   setMaxBirthDay,
  };
};
