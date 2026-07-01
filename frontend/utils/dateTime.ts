/**
 * Timezone-safe date utilities for the Ares frontend.
 *
 * Convention:
 *   - All dates from the API are UTC (e.g. "2026-01-15T10:00:00Z").
 *   - **Date-only fields** (pickupDate, returnDate, dateOfBirth, validFrom, validTo)
 *     represent a calendar day — they are formatted with `timeZone: "UTC"` so
 *     the displayed day always matches what the server stored, regardless of the
 *     user's local timezone.
 *   - **DateTime fields** (createdAt, updatedAt, etc.) represent a moment in time —
 *     they are formatted in the user's local timezone so "3:00 PM" is meaningful.
 *   - Date-only values sent to the API use `toApiDate()` (YYYY-MM-DD local components).
 */

// ---------------------------------------------------------------------------
// Parsing — always treat API date strings as UTC
// ---------------------------------------------------------------------------

/**
 * Parse an ISO date string from the API as a UTC Date.
 *
 * The backend now serializes all DateTimes with a "Z" suffix, but older
 * data or edge cases may arrive without one. This function normalizes both.
 */
export function parseUtcDate(value: string | null | undefined): Date {
  if (!value) return new Date();

  // If the string already ends with Z or has an offset, parse as-is.
  if (/[Zz]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }

  // Otherwise assume UTC and append Z so the browser doesn't treat it as local.
  return new Date(`${value}Z`);
}

/**
 * Parse a date-only API string (e.g. "2026-01-15" or "2026-01-15T00:00:00Z")
 * into a **local-midnight** Date for use with MUI DatePicker.
 *
 * DatePickers render the date using local time components. If we use
 * `parseUtcDate("2026-01-15T00:00:00Z")`, a user in UTC-5 would see
 * December 14 instead of January 15. This function extracts the YYYY-MM-DD
 * portion and creates a Date at local midnight, so the DatePicker always
 * shows the correct calendar day.
 *
 * When saving, pair with `toApiDate()` (which also uses local components)
 * to ensure correct round-tripping.
 */
export function parseDateOnly(value: string | null | undefined): Date {
  if (!value) return new Date();
  const datePart = value.slice(0, 10); // "YYYY-MM-DD"
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d); // local midnight
}

// ---------------------------------------------------------------------------
// Formatting — send dates to the API without timezone shift
// ---------------------------------------------------------------------------

/**
 * Format a Date as "YYYY-MM-DD" using **local** date components.
 *
 * Use this for date-only API fields (pickupDate, returnDate, dateOfBirth, etc.).
 *
 * **Do NOT use `.toISOString()` for date-only values** — it converts to UTC first
 * and can shift the day by the timezone offset (e.g. midnight Jan 15 in UTC+2
 * becomes Jan 14T22:00Z via toISOString).
 */
export function toApiDate(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a Date as a full ISO-8601 UTC string ("YYYY-MM-DDTHH:mm:ssZ").
 *
 * Use this for datetime API fields where an exact timestamp is needed.
 */
export function toApiDateTime(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "";
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// Display — locale-aware date formatting
// ---------------------------------------------------------------------------

/** Resolve a BCP-47 locale tag from the next-intl locale string. */
export function resolveLocale(locale: string): string {
  return locale === "ar" ? "ar-EG" : "en-US";
}

/**
 * Format a **date-only** UTC string from the API for display, using the user's locale.
 *
 * Uses `timeZone: "UTC"` by default so the displayed calendar day always matches
 * the server-stored value, regardless of the user's local timezone. This is
 * critical for date-only fields like pickupDate, dateOfBirth, validFrom, etc.
 * where showing the wrong day (e.g. Jan 14 instead of Jan 15 in UTC-5) would
 * be incorrect.
 *
 * For datetime fields (createdAt, submittedAt, etc.) use `formatUtcDateTime()`
 * instead, which displays in the user's local timezone.
 */
export function formatUtcDate(
  value: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
  fallback = "N/A"
): string {
  if (!value) return fallback;
  const date = parseUtcDate(value);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(resolveLocale(locale), {
    timeZone: "UTC",
    ...options,
  });
}

/**
 * Format a **datetime** UTC string from the API for display, using the user's locale.
 *
 * Displays in the user's local timezone (e.g. "2026-01-15T15:00:00Z" shows
 * as "3:00 PM" in UTC+0, "5:00 PM" in UTC+2). This is correct for timestamp
 * fields like createdAt, submittedAt, etc., where the user expects a local-time
 * reading.
 *
 * For date-only fields (pickupDate, validFrom, etc.) use `formatUtcDate()`
 * instead, which forces `timeZone: "UTC"` so the calendar day is always correct.
 */
export function formatUtcDateTime(
  value: string | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
  fallback = "N/A"
): string {
  if (!value) return fallback;
  const date = parseUtcDate(value);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleString(resolveLocale(locale), options);
}
