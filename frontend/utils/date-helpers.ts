/**
 * Calculates the number of days between two dates.
 * Useful for initial UI feedback before API pricing call.
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  // Parse API dates as UTC so day boundaries are consistent regardless of
  // the user's local timezone. Without "Z", the browser treats ISO strings
  // as local time, which can shift the day count near midnight.
  const start = new Date(ensureUtcSuffix(startDate));
  const end = new Date(ensureUtcSuffix(endDate));
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
};

/** Ensure an ISO date string is treated as UTC by appending "Z" if no offset is present. */
function ensureUtcSuffix(value: string): string {
  if (/[Zz]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
  return `${value}Z`;
}
