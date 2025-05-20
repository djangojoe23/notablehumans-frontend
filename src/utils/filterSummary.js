// src/utils/filterSummary.js

export const generateFilterSummary = ({
  searchQuery,
  dateFilterType,
  filterYear,
  filterYearRange,
  filterMonth,
  filterDay,
  attributeFilters,
  filterAge,
  filterAgeType,
  resultsCount,
}) => {
  const parts = [];

  // Name filter
  if (searchQuery?.trim()) {
    parts.push(`name${resultsCount !== 1 ? 's' : ''} containing "${searchQuery.trim()}"`);
  }

  // // Date filter
  // if (dateFilterType && filterYear != null) {
  //   let dateDesc = `${dateFilterType} in ${filterYear}`;
  //   if (filterYearRange != null) {
  //     dateDesc += ` ± ${filterYearRange} years`;
  //   }
  //   if (filterMonth != null) {
  //     dateDesc += `, month ${filterMonth}`;
  //   }
  //   if (filterDay != null) {
  //     dateDesc += `, day ${filterDay}`;
  //   }
  //   parts.push(dateDesc);
  // }
  //
  // // Attribute filters
  // if (attributeFilters?.some(f => f.attribute && f.values.length)) {
  //   const attrDesc = attributeFilters
  //     .filter(f => f.attribute && f.values.length)
  //     .map(f => `${f.attribute}: ${f.values.join(', ')}`)
  //     .join('; ');
  //   parts.push(`with attributes (${attrDesc})`);
  // }
  //
  // // Age filters
  // if (filterAge != null && filterAgeType) {
  //   parts.push(
  //     filterAgeType === 'min'
  //       ? `aged at least ${filterAge}`
  //       : `aged exactly ${filterAge}`
  //   );
  // }

  const filtersSummary = parts.length > 0
    ? parts.join(', ')
    : 'all notable humans';

  // Include number of results in sentence
  return `${resultsCount} notable human${resultsCount !== 1 ? 's' : ''} with ${filtersSummary}.`;
};
