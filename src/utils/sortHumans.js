// src/utils/sortHumans.js
export const sortHumansComparator = (sortBy, sortAsc) => (a, b) => {
  // Assuming the human object properties are in 'n', 'by', etc.
  switch (sortBy) {
    case 'n':
      return sortAsc
        ? (a.n || '').localeCompare(b.n || '')
        : (b.n || '').localeCompare(a.n || '');
    case 'by': {
      const aHasBirth = a.by != null;
      const bHasBirth = b.by != null;
      if (aHasBirth && !bHasBirth) return -1;
      if (!aHasBirth && bHasBirth) return 1;
      if (!aHasBirth && !bHasBirth) return 0;
      return sortAsc ? a.by - b.by : b.by - a.by;
    }
    case 'dy': {
      const isADied = a.dy != null;
      const isBDied = b.dy != null;
      if (isADied && !isBDied) return sortAsc ? -1 : 1;
      if (!isADied && isBDied) return sortAsc ? 1 : -1;
      if (!isADied && !isBDied) {
        const aBirth = a.by ?? Infinity;
        const bBirth = b.by ?? Infinity;
        return sortAsc ? aBirth - bBirth : bBirth - aBirth;
      }
      const aDeath = a.dy ?? Infinity;
      const bDeath = b.dy ?? Infinity;
      return sortAsc ? aDeath - bDeath : bDeath - aDeath;
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
