export const formatYear = (year) => {
  if (year === null || year === undefined) return 'Unknown';
  return year < 0 ? `${Math.abs(year)} BC` : `${year}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const dt = new Date(dateStr);
  // omit the locale argument to use the user's browser locale,
  // or pass e.g. 'en-US' to force US formatting
  return dt.toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'long',
    day:   'numeric'
  });
}