// src/utils/sortHumans.js
export const sortHumansComparator = (sortBy, sortAsc) => (a, b) => {
    // multiplier so we can just flip the sign
  const m = sortAsc ? 1 : -1

  // helper: compare two ISO dates as strings, treating missing as “last”
  const compareISO = (key) => {
    const aVal = a[key] ?? ''
    const bVal = b[key] ?? ''

    if (!aVal && bVal) return  1 * m   // a missing → after b
    if (aVal && !bVal) return -1 * m   // b missing → after a
    return aVal.localeCompare(bVal) * m
  }

  // Assuming the human object properties are in 'n', 'by', etc.
  switch (sortBy) {
    case 'n':
      return sortAsc
        ? (a.n || '').localeCompare(b.n || '')
        : (b.n || '').localeCompare(a.n || '');
    case 'bd': {
      return compareISO('bd')
    }
    case 'dd': {
       // sort by death date, but if neither died, fall back to birth date
      const aD = a.dd, bD = b.dd
      if (!aD && bD) return  1 * m
      if (aD && !bD) return -1 * m
      if (!aD && !bD) return compareISO('bd')
      return compareISO('dd')
    }
    case 'al': // article length
    case 'rv': // recent views
    case 'te': { // total edits
      const aVal = a[sortBy] ?? -Infinity;
      const bVal = b[sortBy] ?? -Infinity;
      return sortAsc ? aVal - bVal : bVal - aVal;
    }

    case 'cd': { // article created date
      const aDate = new Date(a.cd || 0);
      const bDate = new Date(b.cd || 0);
      return sortAsc ? aDate - bDate : bDate - aDate;
    }
    default:
      return 0;
  }
};
