/**
 * Which day of a 7-day challenge is live right now.
 *
 * This is the single rule that decides what a member can answer, so the admin
 * screens import it too — if the panel and the server disagreed about the day,
 * an author would post a question and be unable to explain why nobody sees it.
 *
 * Day 1 is the start date itself. The result is clamped to 1–7, so a challenge
 * that has not started yet reads as Day 1 and one that has run long reads as
 * Day 7. Use `hasStarted` / `hasEnded` when that distinction matters.
 */
export const CHALLENGE_DAYS = 7;

export function currentDayNumber(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 1;
  const days = Math.floor((Date.now() - start) / 86_400_000) + 1;
  return Math.min(CHALLENGE_DAYS, Math.max(1, days));
}

/** False while the start date is still in the future. */
export function hasStarted(startDate: string | null): boolean {
  if (!startDate) return true;
  const start = new Date(startDate).getTime();
  return Number.isNaN(start) ? true : start <= Date.now();
}
