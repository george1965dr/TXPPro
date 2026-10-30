/**
 * The practice's own timezone. Timestamps (created_at, accepted_at...) are
 * instants; which calendar day they fall on depends on where you stand. Pinning
 * one zone keeps the server render and the browser render identical, so a plan
 * created at 8pm doesn't print tomorrow's date and the page can't hydrate to a
 * different day than it was sent as.
 */
export const PRACTICE_TIME_ZONE = "America/New_York";

/**
 * Formats a plain "YYYY-MM-DD" (birth dates, due dates) without a timezone.
 * `new Date("1959-12-21")` is UTC midnight, which any US timezone renders as
 * December 20th.
 */
export function formatDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-US");
}

/** Formats an instant as a calendar date in the practice's timezone. */
export function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { timeZone: PRACTICE_TIME_ZONE });
}
