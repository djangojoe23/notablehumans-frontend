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
