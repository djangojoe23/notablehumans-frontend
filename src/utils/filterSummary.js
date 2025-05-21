const MONTH_NAMES = [
  '', // index 0 unused
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function ordinalSuffix(n) {
  if (n == null) return '';
  const s = ['th', 'st', 'nd', 'rd'],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildDateLabel({ year, month, day }) {
  if (year != null && month != null && day != null) {
    return `${MONTH_NAMES[month]} ${day}, ${year}`;
  }
  if (year != null && month != null) {
    return `${MONTH_NAMES[month]} ${year}`;
  }
  if (year != null && day != null) {
    return `the ${ordinalSuffix(day)} of a month in ${year}`;
  }
  if (year != null) {
    return `${year}`;
  }
  return null;
}

export const generateFilterSummary = ({
  searchQuery,
  dateFilterType,
  filterYear,
  filterYearRange,
  filterMonth,
  filterDay,
  resultsCount,
}) => {
  const plural = resultsCount === 1 ? 'notable human' : 'notable humans';
  const verb = resultsCount === 1 ? 'was' : 'were';

  const phrases = [];

  // Name filter
  if (searchQuery?.trim()) {
    phrases.push(`whose name contains "${searchQuery.trim()}"`);
  }

  // Date logic
  const hasDate = filterYear != null || filterMonth != null || filterDay != null;

  if (dateFilterType && hasDate) {
    const label =
      dateFilterType === 'born'
        ? `${verb} born`
        : dateFilterType === 'died'
        ? `${verb} deceased`
        : `${verb} alive`;

    const hasYearRange =
      filterYear != null &&
      filterYearRange != null &&
      filterYearRange !== 0;

    let datePhrase = '';

    if (hasYearRange) {
      const y1 = filterYear;
      const y2 = filterYear + filterYearRange;
      const startYear = Math.min(y1, y2);
      const endYear = Math.max(y1, y2);

      const startLabel = buildDateLabel({
        year: startYear,
        month: filterMonth,
        day: filterDay,
      });

      const endLabel = buildDateLabel({
        year: endYear,
        month: filterMonth,
        day: filterDay,
      });

      if (filterDay && !filterMonth) {
        // Special case: day + year range with no month
        datePhrase = `on the ${ordinalSuffix(filterDay)} of a month between ${startYear} and ${endYear}`;
      } else {
        datePhrase = `between ${startLabel} and ${endLabel}`;
      }
    } else {
      const singleLabel = buildDateLabel({
        year: filterYear,
        month: filterMonth,
        day: filterDay,
      });

      if (singleLabel) {
        if (filterDay && !filterMonth && filterYear) {
          datePhrase = `on the ${ordinalSuffix(filterDay)} of a month in ${filterYear}`;
        } else if (filterDay && !filterMonth && !filterYear) {
          datePhrase = `on the ${ordinalSuffix(filterDay)}`;
        } else {
          datePhrase = `on ${singleLabel}`;
        }
      }
    }

    if (datePhrase) {
      phrases.push(`${label} ${datePhrase}`);
    }
  }

  if (phrases.length === 0) {
    return `${resultsCount} ${plural}`;
  }

  return `${resultsCount} ${plural} ${phrases.join(' and ')}`;
};
