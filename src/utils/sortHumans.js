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
      const aYear = a.by;
      const bYear = b.by;

      // missing birth years go last
      if (aYear == null && bYear == null) return 0;
      if (aYear == null) return 1 * m;
      if (bYear == null) return -1 * m;

      if (aYear !== bYear) {
        return (aYear - bYear) * m;
      }

      // same birth year — break tie with full birth date
      return compareISO('bd');
    }
    case 'dd': {
      const aDeathYear = a.dy ?? null;
      const bDeathYear = b.dy ?? null;

      const aSortYear = aDeathYear ?? a.by ?? null;
      const bSortYear = bDeathYear ?? b.by ?? null;

      if (aSortYear == null && bSortYear == null) return 0;
      if (aSortYear == null) return 1 * m;
      if (bSortYear == null) return -1 * m;

      if (aSortYear !== bSortYear) {
        return (aSortYear - bSortYear) * m;
      }

      // If years are same, fall back to comparing full death dates if available
      if (a.dd && b.dd) return compareISO('dd');

      // If no death date, fallback to birth date
      return compareISO('bd');
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
