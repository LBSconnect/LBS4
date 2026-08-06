// ─────────────────────────────────────────────────────────────────────────────
// Informational-only business-day helper.
//
// Per the operating rules: LBS never calculates a legal E-Verify deadline
// from memory when the E-Verify system displays an actual date — that
// displayed date is what gets stored in CaseDeadline (source:
// "everify_displayed"). This helper produces a *target*, not a deadline: a
// heads-up for internal workflow planning, always labeled noncontrolling,
// and it is federal-holiday-aware so it doesn't undercount.
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed-date federal holidays plus the observed-date rules for New Year's,
 *  Juneteenth, Independence Day, Veterans Day, and Christmas (shifted to
 *  Friday/Monday when they fall on a weekend), and the floating-date holidays
 *  (MLK Day, Presidents Day, Memorial Day, Labor Day, Columbus Day,
 *  Thanksgiving). Good through any year — computed, not hardcoded per year. */
export function isUSFederalHoliday(date: Date): boolean {
  const y = date.getUTCFullYear();
  const md = (m: number, d: number) => `${m}-${d}` === `${date.getUTCMonth() + 1}-${date.getUTCDate()}`;

  const observed = (month: number, day: number): boolean => {
    const actual = new Date(Date.UTC(y, month - 1, day));
    const dow = actual.getUTCDay();
    let observedDate = actual;
    if (dow === 6) observedDate = new Date(Date.UTC(y, month - 1, day - 1)); // Sat -> observed Fri
    if (dow === 0) observedDate = new Date(Date.UTC(y, month - 1, day + 1)); // Sun -> observed Mon
    return (
      date.getUTCFullYear() === observedDate.getUTCFullYear() &&
      date.getUTCMonth() === observedDate.getUTCMonth() &&
      date.getUTCDate() === observedDate.getUTCDate()
    );
  };

  if (observed(1, 1)) return true; // New Year's Day
  if (observed(6, 19)) return true; // Juneteenth
  if (observed(7, 4)) return true; // Independence Day
  if (observed(11, 11)) return true; // Veterans Day
  if (observed(12, 25)) return true; // Christmas

  const nthWeekdayOfMonth = (month: number, weekday: number, n: number): Date => {
    const first = new Date(Date.UTC(y, month - 1, 1));
    const firstWeekday = first.getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return new Date(Date.UTC(y, month - 1, 1 + offset + (n - 1) * 7));
  };
  const lastWeekdayOfMonth = (month: number, weekday: number): Date => {
    const lastDay = new Date(Date.UTC(y, month, 0));
    const lastWeekday = lastDay.getUTCDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    return new Date(Date.UTC(y, month - 1, lastDay.getUTCDate() - offset));
  };
  const sameDate = (a: Date) => a.getUTCFullYear() === y && a.getUTCMonth() === date.getUTCMonth() && a.getUTCDate() === date.getUTCDate();

  if (sameDate(nthWeekdayOfMonth(1, 1, 3))) return true; // MLK Day — 3rd Monday of Jan
  if (sameDate(nthWeekdayOfMonth(2, 1, 3))) return true; // Presidents Day — 3rd Monday of Feb
  if (sameDate(lastWeekdayOfMonth(5, 1))) return true; // Memorial Day — last Monday of May
  if (sameDate(nthWeekdayOfMonth(9, 1, 1))) return true; // Labor Day — 1st Monday of Sep
  if (sameDate(nthWeekdayOfMonth(10, 1, 2))) return true; // Columbus Day — 2nd Monday of Oct
  if (sameDate(nthWeekdayOfMonth(11, 4, 4))) return true; // Thanksgiving — 4th Thursday of Nov

  void md; // (kept for readability of the fixed-date checks above)
  return false;
}

export function isBusinessDay(date: Date): boolean {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !isUSFederalHoliday(date);
}

export function addBusinessDays(start: Date, count: number): Date {
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  let remaining = count;
  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d)) remaining -= 1;
  }
  return d;
}

/** Informational only — never controlling, never used to override a date
 *  E-Verify actually displayed. Callers must always label this in the UI. */
export function informationalCaseCreationTarget(firstDayOfEmploymentForPay: string): { date: string; noncontrolling: true } {
  const start = new Date(firstDayOfEmploymentForPay + "T00:00:00Z");
  const target = addBusinessDays(start, 3);
  return { date: target.toISOString().slice(0, 10), noncontrolling: true };
}
