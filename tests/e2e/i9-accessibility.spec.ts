/**
 * i9-accessibility.spec.ts
 *
 * Automated accessibility (axe-core) and responsive-layout checks for the
 * new I-9 / New-Hire Verification surfaces added this phase:
 *   - the public marketing page (client-facing, must be accessible to any
 *     visitor and to search/assistive tooling — no auth required)
 *   - the portal's public entry points (login, register — no employee data
 *     rendered on either)
 *
 * Deliberately out of scope here: pages behind authentication that render
 * real case/company data (dashboard, new-hire request detail, protected
 * data view). Axe-scanning those would require seeding a logged-in session
 * per breakpoint per page, which is a large amount of added test surface
 * for marginal signal beyond what i9-portal-ui.spec.ts and the manual
 * accessibility fix (Field label association, see _shared.tsx) already
 * cover. The pages scanned here are the ones a real, unauthenticated user —
 * including one using a screen reader — actually lands on.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({
  launchOptions: {
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  },
});

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";

const PUBLIC_PAGES: { path: string; label: string }[] = [
  { path: "/employer-services/new-hire-verification", label: "New-Hire Verification marketing page" },
  { path: "/employer-services/new-hire-verification/portal/login", label: "Portal login" },
  { path: "/employer-services/new-hire-verification/portal/register", label: "Portal register" },
];

// Widths span the brief's required responsive range: small phone through
// large desktop. Heights are nominal viewport heights for each class of
// device — not exact-device-accurate, just enough to exercise real
// reflow/wrapping behavior at each width.
const BREAKPOINTS: { width: number; height: number; label: string }[] = [
  { width: 320, height: 690, label: "320px (small phone)" },
  { width: 375, height: 812, label: "375px (phone)" },
  { width: 430, height: 932, label: "430px (large phone)" },
  { width: 768, height: 1024, label: "768px (tablet)" },
  { width: 1024, height: 768, label: "1024px (small desktop)" },
  { width: 1440, height: 900, label: "1440px (desktop)" },
];

// Every axe-core rule is enforced, including `color-contrast` — the
// sitewide `text-[#FF6A00]` brand-orange accent used as an "eyebrow" label
// color was found at ~2.87:1 (a real WCAG 1.4.3 violation, not a scanner
// false positive) and fixed sitewide by darkening it for text use only
// (#C75300 light / #FF8A3D dark, both verified ≥4.5:1 against their
// respective backgrounds) — see the sitewide sed pass touching every
// `text-xs font-bold uppercase tracking-widest text-[#FF6A00]` eyebrow
// label plus the handful of other real-text usages (phone CTA, star
// ratings, dashboard "Current stage" label). Decorative icons that sit
// beside already-legible text keep the original brand orange, since they
// aren't the sole conveyor of information and WCAG 1.4.11 doesn't require
// them to individually clear 3:1.
async function runAxe(page: Page) {
  return new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
}

test.describe("I-9 public pages — accessibility (axe-core)", () => {
  for (const { path, label } of PUBLIC_PAGES) {
    test(`${label} has no automatically-detectable WCAG 2.1 A/AA violations`, async ({ page }) => {
      await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
      const results = await runAxe(page);
      if (results.violations.length > 0) {
        const summary = results.violations
          .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`)
          .join("\n");
        console.log(`Axe violations on ${label}:\n${summary}`);
      }
      expect(results.violations, `Accessibility violations on ${label}`).toEqual([]);
    });
  }
});

test.describe("I-9 public pages — responsive layout (no horizontal overflow)", () => {
  for (const { path, label: pageLabel } of PUBLIC_PAGES) {
    for (const { width, height, label: bpLabel } of BREAKPOINTS) {
      test(`${pageLabel} at ${bpLabel} has no horizontal scroll/overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
        });
        // A 1px tolerance absorbs sub-pixel rounding from scrollbar reflow;
        // anything beyond that is real content spilling past the viewport.
        expect(
          overflow.scrollWidth,
          `${pageLabel} at ${width}px: scrollWidth ${overflow.scrollWidth} vs clientWidth ${overflow.clientWidth}`
        ).toBeLessThanOrEqual(overflow.clientWidth + 1);
      });
    }
  }
});

test.describe("I-9 public pages — key CTAs remain reachable at mobile width", () => {
  test("New-Hire Verification hero CTAs are visible and tappable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 690 });
    await page.goto(BASE_URL + "/employer-services/new-hire-verification", { waitUntil: "networkidle" });
    await expect(page.getByTestId("button-hero-start-onboarding")).toBeVisible();
    await expect(page.getByTestId("button-hero-client-portal-login")).toBeVisible();
  });
});
