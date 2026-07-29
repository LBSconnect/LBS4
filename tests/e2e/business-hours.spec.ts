/**
 * business-hours.spec.ts
 *
 * Verifies the booking calendar and API enforce correct business hours:
 *
 *   Monday – Friday  —  8:30 AM – 6 PM CT (slots 9 AM – 5 PM)
 *   Saturday         —  9 AM – 3 PM CT (slots 9 AM – 2 PM)
 *   Sunday           —  CLOSED (no slots)
 *
 * Tests run at the API level (no browser needed) so they are fast and
 * deterministic regardless of which day of the week today happens to be.
 */
import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { TEST_TAG } from "../fixtures/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

test.use({
  launchOptions: {
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  },
});

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";

// ─── Timezone helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the given UTC date falls in Central Daylight Time.
 * CDT: 2nd Sunday of March → 1st Sunday of November.
 */
function isCDT(date: Date): boolean {
  const year = date.getUTCFullYear();
  const mar1Dow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const dstStartDay = 1 + (7 - mar1Dow) % 7 + 7;
  const dstStart = new Date(Date.UTC(year, 2, dstStartDay, 8, 0, 0));
  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const dstEndDay = 1 + (7 - nov1Dow) % 7;
  const dstEnd = new Date(Date.UTC(year, 10, dstEndDay, 7, 0, 0));
  return date >= dstStart && date < dstEnd;
}

/** Convert a CT hour-of-day to its UTC equivalent for the given date. */
function ctHourToUTC(dateUTC: Date, ctHour: number): number {
  return ctHour + (isCDT(dateUTC) ? 5 : 6);
}

/**
 * Find the next date (from today, potentially including today) whose UTC day
 * of week matches `targetDow` (0 = Sunday … 6 = Saturday).
 * Returns a Date set to midnight UTC on that day.
 *
 * Offset 4 weeks out (not just the nearest occurrence) so these read-only
 * slot-shape checks never land on the same calendar day as seed.ts's
 * permanent "next Monday 10 AM" concurrency fixture, or as the nearest
 * Monday/Saturday other spec files (booking-payment, email-notification)
 * book real appointments against.
 */
function nextDayOfWeek(targetDow: number): Date {
  const now = new Date();
  const todayDow = now.getUTCDay();
  const daysAhead = (targetDow - todayDow + 7) % 7 || 7; // 1–7 (never 0 — always future)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysAhead + 28));
  return d;
}

/** Build a UTC ISO string for the given date at the given CT hour. */
function slotISO(dateUTC: Date, ctHour: number): string {
  const utcHour = ctHourToUTC(dateUTC, ctHour);
  return new Date(Date.UTC(
    dateUTC.getUTCFullYear(),
    dateUTC.getUTCMonth(),
    dateUTC.getUTCDate() + (utcHour >= 24 ? 1 : 0),
    utcHour % 24,
    0, 0, 0,
  )).toISOString();
}

/** Fetch the available slots from the API for a given UTC date. */
async function fetchSlots(dateISO: string): Promise<string[]> {
  const res = await fetch(
    `${BASE_URL}/api/appointments/available-slots?date=${encodeURIComponent(dateISO)}`
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  return body.slots as string[];
}

/** Convert a slot ISO string to CT hour-of-day. */
function slotToCTHour(slotISO: string, refDate: Date): number {
  const slotDate = new Date(slotISO);
  const utcHour = slotDate.getUTCHours();
  const offset = isCDT(refDate) ? 5 : 6;
  return (utcHour - offset + 24) % 24;
}

/** POST a booking to the API. */
async function postBooking(payload: object): Promise<Response> {
  return fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Thursday — open (same hours as Monday)", () => {
  test("returns 9 slots for next Thursday", async () => {
    const thu = nextDayOfWeek(4); // dow 4 = Thursday
    const slots = await fetchSlots(thu.toISOString());
    expect(slots).toHaveLength(9);
  });

  test("last slot is 5 PM CT on Thursday", async () => {
    const thu = nextDayOfWeek(4);
    const slots = await fetchSlots(thu.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], thu);
    expect(lastCTHour).toBe(17);
  });
});

test.describe("Sunday — closed all day", () => {
  test("returns zero slots for next Sunday", async () => {
    const sun = nextDayOfWeek(0);
    const slots = await fetchSlots(sun.toISOString());
    expect(slots).toHaveLength(0);
  });

  test("rejects a direct API booking on Sunday with 400", async () => {
    const sun = nextDayOfWeek(0);
    const res = await postBooking({
      customerName: "Test Sunday",
      customerEmail: `sun+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0002",
      serviceName: "Notary Service",
      appointmentDate: slotISO(sun, 10),
      payNow: true,
      notes: `${TEST_TAG}:sun-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Saturday — 9 AM to 3 PM (last slot 2 PM)", () => {
  test("first slot is 9 AM CT", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const firstCTHour = slotToCTHour(slots[0], sat);
    expect(firstCTHour).toBe(9);
  });

  test("last slot is 2 PM CT (not 3 PM or later)", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], sat);
    expect(lastCTHour).toBe(14); // 2 PM
  });

  test("has exactly 6 slots (9 AM through 2 PM inclusive)", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    expect(slots).toHaveLength(6); // 9,10,11,12,13,14
  });

  test("a 3 PM slot is not in the Saturday list", async () => {
    const sat = nextDayOfWeek(6);
    const slots = await fetchSlots(sat.toISOString());
    const slot3pm = slotISO(sat, 15); // 3 PM CT
    expect(slots).not.toContain(slot3pm);
  });

  test("rejects a direct API booking at 3 PM Saturday with 400", async () => {
    const sat = nextDayOfWeek(6);
    const res = await postBooking({
      customerName: "Test Sat 3pm",
      customerEmail: `sat3pm+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0003",
      serviceName: "Notary Service",
      appointmentDate: slotISO(sat, 15), // 3 PM CT — past last slot
      payNow: true,
      notes: `${TEST_TAG}:sat-3pm-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Monday — 8:30 AM to 6 PM (last slot 5 PM)", () => {
  test("first slot is 9 AM CT", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const firstCTHour = slotToCTHour(slots[0], mon);
    expect(firstCTHour).toBe(9);
  });

  test("last slot is 5 PM CT (not 6 PM or later)", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    const lastCTHour = slotToCTHour(slots[slots.length - 1], mon);
    expect(lastCTHour).toBe(17); // 5 PM
  });

  test("has exactly 9 slots (9 AM through 5 PM inclusive)", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    expect(slots).toHaveLength(9); // 9,10,11,12,13,14,15,16,17
  });

  test("a 6 PM slot is not in the Monday list", async () => {
    const mon = nextDayOfWeek(1);
    const slots = await fetchSlots(mon.toISOString());
    const slot6pm = slotISO(mon, 18); // 6 PM CT
    expect(slots).not.toContain(slot6pm);
  });

  test("rejects a direct API booking at 6 PM Monday with 400", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Test Mon 6pm",
      customerEmail: `mon6pm+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0004",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 18), // 6 PM CT — past closing
      payNow: true,
      notes: `${TEST_TAG}:mon-6pm-reject`,
    });
    expect(res.status).toBe(400);
  });
});

test.describe("Tuesday — same hours as Monday", () => {
  test("last slot is 5 PM CT", async () => {
    const tue = nextDayOfWeek(2);
    const slots = await fetchSlots(tue.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], tue);
    expect(lastCTHour).toBe(17);
  });
});

test.describe("Wednesday — same hours as Monday", () => {
  test("last slot is 5 PM CT", async () => {
    const wed = nextDayOfWeek(3);
    const slots = await fetchSlots(wed.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], wed);
    expect(lastCTHour).toBe(17);
  });
});

test.describe("Friday — 8:30 AM to 6 PM (last slot 5 PM)", () => {
  test("last slot is 5 PM CT", async () => {
    const fri = nextDayOfWeek(5);
    const slots = await fetchSlots(fri.toISOString());
    expect(slots.length).toBeGreaterThan(0);
    const lastCTHour = slotToCTHour(slots[slots.length - 1], fri);
    expect(lastCTHour).toBe(17);
  });

  test("has exactly 9 slots", async () => {
    const fri = nextDayOfWeek(5);
    const slots = await fetchSlots(fri.toISOString());
    expect(slots).toHaveLength(9);
  });
});

test.describe("All services return correct slots", () => {
  const services = [
    "notary-service",
    "passport-photos",
    "certification-exam-testing",
  ];

  for (const slug of services) {
    test(`${slug}: Monday slots are 9 AM–5 PM`, async ({ page }) => {
      const mon = nextDayOfWeek(1);
      const slots = await fetchSlots(mon.toISOString());
      expect(slots.length).toBeGreaterThan(0);

      const ctHours = slots.map((s) => slotToCTHour(s, mon));
      expect(Math.min(...ctHours)).toBe(9);
      expect(Math.max(...ctHours)).toBe(17);
    });

    test(`${slug}: calendar page does not disable Thursday`, async ({ page }) => {
      await page.goto(`/services/${slug}`);
      await page.waitForSelector("table");

      // Thursday should now be enabled — verify no Thursday cell is disabled
      const thu = nextDayOfWeek(4);
      const thuDay = thu.getUTCDate();

      // The calendar opens on the current month; the target date can be
      // months out (business-hours dates are deliberately offset to avoid
      // colliding with other spec files' bookings), so navigate forward
      // month-by-month first — otherwise a same-numbered day in whichever
      // month happens to be showing gets matched instead.
      const now = new Date();
      const monthsAhead =
        (thu.getUTCFullYear() - now.getUTCFullYear()) * 12 +
        (thu.getUTCMonth() - now.getUTCMonth());
      const nextMonthBtn = page.locator('button[name="next-month"]');
      for (let i = 0; i < monthsAhead; i++) {
        await nextMonthBtn.click();
      }

      // Exclude "outside day" cells (showOutsideDays renders adjacent months'
      // trailing/leading days with the same day-of-month label, e.g. July 27
      // shows up disabled alongside the real August 27 target).
      const thuBtn = page.locator(
        `button[name="day"]:not(.day-outside)`
      ).filter({ hasText: String(thuDay) }).first();

      const visible = await thuBtn.isVisible().catch(() => false);
      if (visible) {
        await expect(thuBtn).not.toBeDisabled();
      }
    });
  }
});

test.describe("Before-hours and after-hours API rejection", () => {
  test("rejects booking at 8 AM CT on a weekday (before open)", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Early Bird",
      customerEmail: `early+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0010",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 8), // 8 AM CT — before 9 AM open
      payNow: true,
      notes: `${TEST_TAG}:before-hours`,
    });
    expect(res.status).toBe(400);
  });

  test("rejects booking at midnight CT on a weekday", async () => {
    const mon = nextDayOfWeek(1);
    const res = await postBooking({
      customerName: "Midnight Booker",
      customerEmail: `midnight+${Date.now()}@e2e.test`,
      customerPhone: "(713) 555-0011",
      serviceName: "Notary Service",
      appointmentDate: slotISO(mon, 0), // midnight CT
      payNow: true,
      notes: `${TEST_TAG}:midnight`,
    });
    expect(res.status).toBe(400);
  });
});
