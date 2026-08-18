/**
 * Which day of a 7-day challenge is live right now.
 *
 * This is the single rule that decides what a member can answer, so the admin
 * screens import it too — if the panel and the server disagreed about the day,
 * an author would post a question and be unable to explain why nobody sees it.
 *
 * Days roll over at midnight on the CALENDAR date, not on the clock time the
 * challenge was created. A challenge starting 17 Aug at 07:00 is on Day 2 for
 * the whole of 18 Aug — not from 07:00 onwards. Counting raw 24h blocks was
 * what made a freshly posted Day 2 question read as locked all morning.
 *
 * The result is clamped to 1–7, so a challenge that has not started yet reads
 * as Day 1 and one that has run long reads as Day 7. Use `hasStarted` when
 * that distinction matters.
 */
export const CHALLENGE_DAYS = 7;

/** Midnight (UTC) of the calendar date a timestamp falls on. */
function startOfDay(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function currentDayNumber(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 1;
  const days = Math.round((startOfDay(Date.now()) - startOfDay(start)) / 86_400_000) + 1;
  return Math.min(CHALLENGE_DAYS, Math.max(1, days));
}

/**
 * A question is answerable once its day has arrived — or as soon as an admin
 * unlocks it early, which is recorded as a `published_at` timestamp in the
 * past. Both the member server functions and the admin table use this.
 */
export function isQuestionOpen(
  question: { day_number: number; published_at?: string | null },
  currentDay: number,
): boolean {
  if (question.day_number <= currentDay) return true;
  if (!question.published_at) return false;
  const at = new Date(question.published_at).getTime();
  return !Number.isNaN(at) && at <= Date.now();
}

/** False while the start date is still in the future. */
export function hasStarted(startDate: string | null): boolean {
  if (!startDate) return true;
  const start = new Date(startDate).getTime();
  return Number.isNaN(start) ? true : start <= Date.now();
}
