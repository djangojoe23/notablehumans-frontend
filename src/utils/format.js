export const formatYear = (year) => {
  if (year === null || year === undefined) return 'Unknown';
  return year < 0 ? `${Math.abs(year)} BC` : `${year}`;
};
