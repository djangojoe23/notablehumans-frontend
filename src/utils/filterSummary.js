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

function formatYearLabel(year) {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  if (year > 0 && year < 1000) {
    return `AD ${year}`;
  }
  return `${year}`;
}

function buildFullDate({ year, month, day }) {
  return `${MONTH_NAMES[month]} ${day}, ${formatYearLabel(year)}`;
}

function buildDateLabel({ year, month, day }) {
  if (year != null && month != null && day != null) {
    return buildFullDate({ year, month, day });
  }
  if (year != null && month != null) {
    return `${MONTH_NAMES[month]} ${formatYearLabel(year)}`;
  }
  if (year != null && day != null) {
    return `the ${ordinalSuffix(day)} of a month in ${formatYearLabel(year)}`;
  }
  if (year != null) {
    return `${formatYearLabel(year)}`;
  }
  return null;
}

export function getFilterClauses({
  nameMatchType,
  searchQuery,
  dateFilterType,
  filterYear,
  filterYearRange,
  filterMonth,
  filterDay,
  filterAge,
  filterAgeType,
  attributeFilters,
  resultsCount,
}) {
  const verb = resultsCount === 1 ? 'was' : 'were';
  const diedVerb = resultsCount === 1 ? 'has died' : 'have died';
  const plural = resultsCount === 1 ? 'notable human' : 'notable humans';
  const phrases = [`${resultsCount} ${plural}`];

  // Name filter: contains vs starts with
  if (searchQuery?.trim()) {
    const mode = nameMatchType === 'startswith' ? 'starts with' : 'contains';
    phrases.push(`whose name ${mode} "${searchQuery.trim()}"`);
  }

  // Age filter
  if (filterAge != null && filterAgeType) {
    let ageLabel;
    switch (filterAgeType) {
      case 'min':
        ageLabel = 'at least';
        break;
      case 'max':
        ageLabel = 'at most';
        break;
      default:
        ageLabel = 'exactly';
    }
    phrases.push(`who lived to be ${ageLabel} ${filterAge} years old`);
  }

  // Date filter
  const hasDate = filterYear != null || filterMonth != null || filterDay != null;
  if (dateFilterType && hasDate) {
    const label =
      dateFilterType === 'born'
        ? `${verb} born`
        : dateFilterType === 'died'
        ? diedVerb
        : `${verb} alive`;

    // Year-range support
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
      const startLabel = buildDateLabel({ year: startYear, month: filterMonth, day: filterDay });
      const endLabel = buildDateLabel({ year: endYear, month: filterMonth, day: filterDay });

      if (filterDay != null && filterMonth == null) {
        datePhrase = `on the ${ordinalSuffix(filterDay)} of a month between ${formatYearLabel(startYear)} and ${formatYearLabel(endYear)}`;
      } else {
        datePhrase = `between ${startLabel} and ${endLabel}`;
      }
    } else {
      // Single-date logic
      if (filterYear != null && filterMonth != null && filterDay != null) {
        datePhrase = `on ${buildFullDate({ year: filterYear, month: filterMonth, day: filterDay })}`;
      } else if (filterYear != null && filterMonth != null) {
        datePhrase = `in ${MONTH_NAMES[filterMonth]} of ${formatYearLabel(filterYear)}`;
      } else if (filterYear != null && filterDay != null) {
        datePhrase = `on the ${ordinalSuffix(filterDay)} of a month in ${formatYearLabel(filterYear)}`;
      } else if (filterYear != null) {
        datePhrase = `in the year ${formatYearLabel(filterYear)}`;
      } else if (filterMonth != null && filterDay != null) {
        datePhrase = `on the ${ordinalSuffix(filterDay)} of ${MONTH_NAMES[filterMonth]} in any year`;
      } else if (filterMonth != null) {
        datePhrase = `in the month of ${MONTH_NAMES[filterMonth]} in any year`;
      } else if (filterDay != null) {
        datePhrase = `on the ${ordinalSuffix(filterDay)} of a month in any year`;
      }
    }

    if (datePhrase) {
      phrases.push(`${label} ${datePhrase}`);
    }
  }

  // Attribute filters
  if (Array.isArray(attributeFilters) && attributeFilters.length > 0) {
    attributeFilters.forEach(({ attribute, matchType, values }) => {
      if (values?.length) {
        // Clean attribute name
        const labelAttr = attribute.replace(/_/g, ' ');
        // Build values string with proper conjunction
        let valsStr;
        if (values.length === 1) {
          valsStr = values[0];
        } else {
          const conj = matchType === 'all' ? ' and ' : ' or ';
          valsStr = values.slice(0, -1).join(', ') + conj + values[values.length - 1];
        }
        phrases.push(`whose "${labelAttr}" attribute includes ${valsStr}`);
      }
    });
  }

  return phrases
}

export function generateFilterSummary(params) {
  const phrases = getFilterClauses(params);
  const { resultsCount } = params;
  const plural = resultsCount === 1 ? 'notable human' : 'notable humans';

  if (phrases.length === 0) {
    return `${resultsCount} ${plural}`;
  }
  return `${resultsCount} ${plural} ${phrases.join(' and ')}`;
}
