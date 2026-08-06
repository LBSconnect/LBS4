/**
 * i9-business-days.test.ts
 *
 * Unit tests for server/i9BusinessDays.ts — the informational (never
 * controlling) case-creation-target calculator. The one property that
 * matters most here isn't a specific date, it's the contract: this value
 * must always be clearly marked `noncontrolling: true`, because it must
 * never be confused with — or override — a deadline E-Verify actually
 * displays (see server/i9Routes.ts's case-result recording, which stores
 * E-Verify-displayed dates completely separately).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { isUSFederalHoliday, isBusinessDay, addBusinessDays, informationalCaseCreationTarget } from "../../server/i9BusinessDays.ts";

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

describe("isUSFederalHoliday", () => {
  test("recognizes fixed-date holidays on their actual date (2025 — a year where all five land on weekdays)", () => {
    assert.equal(isUSFederalHoliday(utc(2025, 1, 1)), true, "New Year's Day");
    assert.equal(isUSFederalHoliday(utc(2025, 6, 19)), true, "Juneteenth");
    assert.equal(isUSFederalHoliday(utc(2025, 7, 4)), true, "Independence Day");
    assert.equal(isUSFederalHoliday(utc(2025, 11, 11)), true, "Veterans Day");
    assert.equal(isUSFederalHoliday(utc(2025, 12, 25)), true, "Christmas");
  });

  test("recognizes floating-date holidays for 2026", () => {
    assert.equal(isUSFederalHoliday(utc(2026, 1, 19)), true, "MLK Day — 3rd Monday of Jan 2026");
    assert.equal(isUSFederalHoliday(utc(2026, 2, 16)), true, "Presidents Day — 3rd Monday of Feb 2026");
    assert.equal(isUSFederalHoliday(utc(2026, 5, 25)), true, "Memorial Day — last Monday of May 2026");
    assert.equal(isUSFederalHoliday(utc(2026, 9, 7)), true, "Labor Day — 1st Monday of Sep 2026");
    assert.equal(isUSFederalHoliday(utc(2026, 10, 12)), true, "Columbus Day — 2nd Monday of Oct 2026");
    assert.equal(isUSFederalHoliday(utc(2026, 11, 26)), true, "Thanksgiving — 4th Thursday of Nov 2026");
  });

  test("shifts a Saturday holiday to the preceding Friday", () => {
    // July 4, 2026 falls on a Saturday -> observed on Friday July 3, 2026.
    assert.equal(utc(2026, 7, 4).getUTCDay(), 6, "sanity check: July 4 2026 is a Saturday");
    assert.equal(isUSFederalHoliday(utc(2026, 7, 3)), true, "observed on the preceding Friday");
    assert.equal(isUSFederalHoliday(utc(2026, 7, 4)), false, "the actual Saturday date itself is not flagged");
  });

  test("an ordinary Tuesday is not a holiday", () => {
    assert.equal(isUSFederalHoliday(utc(2026, 3, 10)), false);
  });

  test("works for a different year without being hardcoded to 2026", () => {
    assert.equal(isUSFederalHoliday(utc(2027, 1, 1)), true, "New Year's Day 2027");
    assert.equal(isUSFederalHoliday(utc(2030, 12, 25)), true, "Christmas 2030");
  });
});

describe("isBusinessDay", () => {
  test("Saturday and Sunday are never business days", () => {
    assert.equal(isBusinessDay(utc(2026, 8, 8)), false); // Saturday
    assert.equal(isBusinessDay(utc(2026, 8, 9)), false); // Sunday
  });

  test("an ordinary weekday is a business day", () => {
    assert.equal(isBusinessDay(utc(2026, 8, 10)), true); // Monday
  });

  test("a weekday federal holiday is not a business day", () => {
    // July 3, 2026 (Friday) is the *observed* Independence Day — a weekday
    // that would otherwise be a business day if the holiday check didn't run.
    assert.equal(utc(2026, 7, 3).getUTCDay(), 5, "sanity check: July 3 2026 is a Friday");
    assert.equal(isBusinessDay(utc(2026, 7, 3)), false, "observed Independence Day is excluded");

    assert.equal(utc(2026, 12, 25).getUTCDay(), 5, "sanity check: Christmas 2026 is a Friday");
    assert.equal(isBusinessDay(utc(2026, 12, 25)), false, "Christmas Day itself is excluded");
  });
});

describe("addBusinessDays", () => {
  test("adds N business days, skipping weekends", () => {
    // Monday Aug 3, 2026 + 3 business days -> Thursday Aug 6, 2026 (no holidays in between)
    const result = addBusinessDays(utc(2026, 8, 3), 3);
    assert.equal(result.toISOString().slice(0, 10), "2026-08-06");
  });

  test("skips a weekend that falls within the count", () => {
    // Thursday Aug 6, 2026 + 3 business days -> Fri(1), Mon(2), Tue(3) = Aug 11, 2026
    const result = addBusinessDays(utc(2026, 8, 6), 3);
    assert.equal(result.toISOString().slice(0, 10), "2026-08-11");
  });

  test("skips a federal holiday that falls within the count", () => {
    // Wed Nov 25, 2026 + 3 business days, skipping Thanksgiving (Thu Nov 26):
    // Fri Nov 27 (+1), weekend skipped, Mon Nov 30 (+2), Tue Dec 1 (+3).
    assert.equal(isUSFederalHoliday(utc(2026, 11, 26)), true, "sanity check: Nov 26 2026 is Thanksgiving");
    const result = addBusinessDays(utc(2026, 11, 25), 3);
    assert.equal(result.toISOString().slice(0, 10), "2026-12-01");
  });
});

describe("informationalCaseCreationTarget", () => {
  test("is always explicitly marked noncontrolling — this is the entire point of the function", () => {
    const result = informationalCaseCreationTarget("2026-08-10");
    assert.equal(result.noncontrolling, true);
  });

  test("computes 3 business days after the given first day of pay", () => {
    // Monday Aug 10, 2026 + 3 business days -> Thursday Aug 13, 2026
    const result = informationalCaseCreationTarget("2026-08-10");
    assert.equal(result.date, "2026-08-13");
  });

  test("returns a plain YYYY-MM-DD string, not a Date object or timestamp", () => {
    const result = informationalCaseCreationTarget("2026-08-10");
    assert.match(result.date, /^\d{4}-\d{2}-\d{2}$/);
  });
});
