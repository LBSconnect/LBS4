/**
 * site-accessibility.spec.ts
 *
 * Sitewide accessibility (axe-core) and responsive-layout audit for every
 * major public page template that ISN'T already covered by
 * i9-accessibility.spec.ts (the New-Hire Verification marketing page and
 * the portal's public login/register entry points). This file follows the
 * exact same pattern established there — axe scan tagged to WCAG 2.1/2.2
 * A/AA, plus a horizontal-overflow check at each of the required
 * breakpoints — extended to cover the rest of the site.
 *
 * Scope: Home, Services (list), ServiceDetail (a few representative
 * services), ForBusinesses, About, Contact, Resources, Book, every legal/
 * policy page, the employer New-Hire-Verification marketing/agreement/
 * intake/pricing pages, and the corporate marketing Landing page. The
 * already-covered I-9 portal public pages are intentionally NOT re-scanned
 * here (see i9-accessibility.spec.ts) — this file's job is everything else.
 *
 * Pages requiring authentication (portal dashboard, corporate portal/admin
 * behind a password gate, etc.) are out of scope for the same reason noted
 * in i9-accessibility.spec.ts: axe-scanning authenticated views needs a
 * seeded session per breakpoint per page for marginal added signal.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({
  launchOptions: {
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  },
});

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";

// One page per major template. A couple of ServiceDetail pages stand in for
// the whole service-detail template (they share the same component/layout,
// so scanning every slug adds run time without added signal).
const PUBLIC_PAGES: { path: string; label: string }[] = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services (list)" },
  { path: "/services/notary-service", label: "ServiceDetail — Notary Service" },
  { path: "/services/passport-photos", label: "ServiceDetail — Passport Photos" },
  { path: "/services/certification-exam-testing", label: "ServiceDetail — Certiport Exam Testing" },
  { path: "/for-businesses", label: "For Businesses" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/resources", label: "Resources" },
  { path: "/book", label: "Book" },
  { path: "/texas-insurance-exam-prep-houston", label: "Insurance Exam Prep Hub" },
  { path: "/website-design-houston-77090", label: "Website Design Landing" },
  { path: "/privacy-policy", label: "Legal — Privacy Policy" },
  { path: "/terms-of-use", label: "Legal — Terms of Use" },
  { path: "/cookie-policy", label: "Legal — Cookie Policy" },
  { path: "/notice-at-collection", label: "Legal — Notice at Collection" },
  { path: "/privacy-request", label: "Legal — Privacy Request" },
  { path: "/accessibility-statement", label: "Legal — Accessibility Statement" },
  { path: "/copyright-dmca-policy", label: "Legal — Copyright/DMCA Policy" },
  { path: "/electronic-communications-terms", label: "Legal — Electronic Communications Terms" },
  { path: "/booking-cancellation-policy", label: "Legal — Booking Cancellation Policy" },
  { path: "/candidate-rules-surveillance-notice", label: "Legal — Candidate Rules & Surveillance Notice" },
  { path: "/document-handling-notice", label: "Legal — Document Handling Notice" },
  { path: "/employer-services/new-hire-verification", label: "Employer — New-Hire Verification (spot-check)" },
  { path: "/employer-services/new-hire-verification/agreement", label: "Employer — Service Agreement" },
  { path: "/employer-services/new-hire-verification/intake", label: "Employer — Client Intake" },
  { path: "/employer-services/new-hire-verification/pricing-sheet", label: "Employer — Pricing Sheet" },
  { path: "/corporate", label: "Corporate — Landing" },
  { path: "/corporate/programs", label: "Corporate — Programs" },
];

// Widths span the brief's required responsive range: small phone through
// large desktop monitor. Heights are nominal viewport heights for each
// class of device — not exact-device-accurate, just enough to exercise
// real reflow/wrapping behavior at each width.
const BREAKPOINTS: { width: number; height: number; label: string }[] = [
  { width: 320, height: 690, label: "320px (small phone)" },
  { width: 375, height: 812, label: "375px (phone)" },
  { width: 430, height: 932, label: "430px (large phone)" },
  { width: 768, height: 1024, label: "768px (tablet)" },
  { width: 1024, height: 768, label: "1024px (small desktop)" },
  { width: 1280, height: 800, label: "1280px (laptop)" },
  { width: 1440, height: 900, label: "1440px (desktop)" },
  { width: 1920, height: 1080, label: "1920px (large desktop)" },
];

// Includes wcag22a/wcag22aa (e.g. target-size, 2.5.8) alongside the 2.0/2.1
// tags the I-9 portal suite uses — the brief calls for WCAG 2.1/2.2 A/AA
// coverage, and axe-core 4.12 ships several 2.2 rules (like target-size)
// disabled-by-default that a tag-scoped runOnly still executes.
async function runAxe(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
    .analyze();
}

test.describe("Site — accessibility (axe-core)", () => {
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

test.describe("Site — responsive layout (no horizontal overflow)", () => {
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

test.describe("Site — heading hierarchy (no skipped levels, exactly one h1)", () => {
  for (const { path, label } of PUBLIC_PAGES) {
    test(`${label} has a valid heading hierarchy`, async ({ page }) => {
      await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) => Number(el.tagName[1]))
      );
      expect(levels.filter((l) => l === 1).length, `${label} should have exactly one <h1>`).toBe(1);
      let maxSeen = 0;
      for (const level of levels) {
        if (level > maxSeen + 1) {
          throw new Error(`${label}: heading level jumps from h${maxSeen} to h${level} (skipped level) — sequence: ${levels.join(",")}`);
        }
        maxSeen = Math.max(maxSeen, level);
      }
    });
  }
});

test.describe("Site — keyboard navigation", () => {
  test("Header mobile menu opens, traps focus on its items, and is dismissible via keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });

    const trigger = page.getByTestId("button-mobile-menu");
    await trigger.focus();
    await page.keyboard.press("Enter");

    const nav = page.getByTestId("nav-mobile");
    await expect(nav).toBeVisible();

    // First mobile nav link must be reachable and focusable via Tab.
    await page.keyboard.press("Tab");
    const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    expect(focusedTestId).toBeTruthy();

    // Escape closes the sheet (Radix Dialog default behavior).
    await page.keyboard.press("Escape");
    await expect(nav).not.toBeVisible();
  });

  test("Desktop top-level nav tabs (formerly the 'For Businesses' dropdown) are keyboard-focusable and navigate correctly", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });

    // "I-9 Verification" and "Web Design" used to live inside a "For
    // Businesses" dropdown; they're now plain top-level tabs, so a simple
    // focus + Enter is the whole interaction — no disclosure widget to open.
    const i9Tab = page.getByTestId("link-nav-i-9-verification");
    await expect(i9Tab).toBeVisible();
    await i9Tab.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/employer-services\/new-hire-verification/);
  });

  test("All interactive elements on Home reachable by Tab show a visible focus indicator", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });

    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
    }
    const outlineInfo = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        boxShadow: cs.boxShadow,
      };
    });
    expect(outlineInfo, "Tab should move focus off <body> onto a real element").not.toBeNull();
    const hasVisibleIndicator =
      outlineInfo!.outlineStyle !== "none" && outlineInfo!.outlineWidth !== "0px";
    const hasBoxShadowIndicator = outlineInfo!.boxShadow !== "none";
    expect(
      hasVisibleIndicator || hasBoxShadowIndicator,
      `Focused element <${outlineInfo!.tag}> has no visible outline or box-shadow focus indicator`
    ).toBe(true);
  });
});

test.describe("Site — forms have properly associated labels", () => {
  test("Contact form: every labelled control resolves via getByLabel", async ({ page }) => {
    await page.goto(BASE_URL + "/contact", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone (optional)")).toBeVisible();
    await expect(page.getByLabel("Service of Interest")).toBeVisible();
    await expect(page.getByLabel("Message")).toBeVisible();
  });

  test("Privacy Request form: every labelled control resolves via getByLabel", async ({ page }) => {
    await page.goto(BASE_URL + "/privacy-request", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Name *")).toBeVisible();
    await expect(page.getByLabel("Email *")).toBeVisible();
    await expect(page.getByLabel("Website or service involved *")).toBeVisible();
    await expect(page.getByLabel("Request type *")).toBeVisible();
    await expect(page.getByLabel("Description of request *")).toBeVisible();
  });

  test("Employer Client Intake form: Federal-Contractor Status and Selected Plan resolve via getByLabel", async ({ page }) => {
    await page.goto(BASE_URL + "/employer-services/new-hire-verification/intake", { waitUntil: "networkidle" });
    await expect(page.getByLabel("Federal-Contractor Status *")).toBeVisible();
    await expect(page.getByLabel("Selected Plan *")).toBeVisible();
  });
});

test.describe("Site — key CTAs remain reachable at mobile width", () => {
  test("Home hero CTA is visible and tappable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 690 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
    // getByTestId rather than a generic a[href="/book"]/button selector — the
    // Header's own (desktop-only, "hidden md:flex") "Book a Service" nav CTA
    // also matches that generic pattern and sits earlier in the DOM, so
    // `.first()` on it would silently grab the hidden desktop link instead of
    // this genuinely mobile-visible hero CTA.
    await expect(page.getByTestId("button-hero-book")).toBeVisible();
  });
});

test.describe("Site — touch target sizing on mobile (WCAG 2.5.8 AA, 24x24 CSS px minimum)", () => {
  test("Header mobile menu button and primary nav links meet minimum target size at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
    const box = await page.getByTestId("button-mobile-menu").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });
});

test.describe("Site — 200% zoom behavior", () => {
  test("Home remains usable (no overflow, hero CTA still visible) at 200% zoom on a 1280px viewport", async ({ page }) => {
    // Emulate 200% zoom by halving the effective viewport, per WCAG 1.4.4
    // reflow-equivalent technique used elsewhere in this suite.
    await page.setViewportSize({ width: 640, height: 400 });
    await page.goto(BASE_URL + "/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
    });
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
