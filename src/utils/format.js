export const formatYear = (year) => {
  if (year === null || year === undefined) return 'Unknown';
  return year < 0 ? `${Math.abs(year)} BC` : `${year}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return null;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed
  const day = parseInt(dayStr, 10);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Invalid date';

  return `${months[month]} ${day}, ${formatYear(year)}`;
};

export function parseYMD(dateStr) {
  // Returns { year, month, day } or nulls if it doesn’t match
  const m = /^(-?\d+)-(\d+)-(\d+)/.exec(dateStr || '');
  if (!m) return { year: null, month: null, day: null };
  return {
    year:  parseInt(m[1], 10),
    month: parseInt(m[2], 10),
    day:   parseInt(m[3], 10),
  };
}