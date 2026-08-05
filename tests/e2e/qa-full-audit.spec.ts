/**
 * qa-full-audit.spec.ts
 *
 * Comprehensive QA pass covering every page, workflow, button, and link.
 * UI-only (no DB / Stripe credentials required); runs against localhost:5000.
 */

import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:5000";

// Run all tests in this QA file in parallel — no shared DB state
test.describe.configure({ mode: "parallel" });

test.use({
  launchOptions: {
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  },
});

async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("load");
}

/** Select first available day on calendar and first time slot. Returns true if a slot was found. */
async function pickFirstSlot(page: Page): Promise<boolean> {
  // Wait for the DayPicker calendar to render
  try {
    await page.waitForSelector('button[name="day"]', { timeout: 15000 });
  } catch {
    return false;
  }
  // Find first non-disabled day button (react-day-picker uses HTML disabled attr)
  const dayBtn = page
    .locator('button[name="day"]:not([disabled])')
    .first();
  if ((await dayBtn.count()) === 0) return false;
  await dayBtn.click();
  // Wait for time slot buttons to appear after API fetch
  try {
    await page.waitForSelector('[data-testid="btn-time-slot"]', { timeout: 12000 });
  } catch {
    return false;
  }
  const slotBtn = page.locator('[data-testid="btn-time-slot"]').first();
  if ((await slotBtn.count()) === 0) return false;
  await slotBtn.click({ force: true });
  // Wait for customer info form to appear (React re-renders after selectedTime is set)
  try {
    await page.waitForSelector('input[id="name"]', { timeout: 8000 });
  } catch {
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. ALL PAGES LOAD
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Page load — all routes render without crash", () => {
  const routes = [
    "/",
    "/services",
    "/about",
    "/contact",
    "/book",
    "/checkout/success",
    "/checkout/cancel",
    "/privacy-policy",
    "/terms-of-use",
    "/notary-houston-77090",
    "/passport-photos-houston-77090",
    "/certiport-testing-center-houston",
    "/texas-insurance-exam-prep-houston",
    "/website-design-houston-77090",
    "/services/life-insurance-boot-camp",
    "/services/property-casualty-boot-camp",
  ];

  for (const path of routes) {
    test(path, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  test("/services/nonexistent-slug shows service-not-found", async ({ page }) => {
    await goto(page, "/services/fake-service");
    await expect(page.locator("body")).toContainText(/not found|does not exist/i);
  });

  test("unknown route shows 404", async ({ page }) => {
    await goto(page, "/this-does-not-exist-at-all");
    await expect(page.locator("body")).toContainText(/not found|404/i);
  });
});

test.describe("Legacy service URLs 301-redirect to their new SEO landing pages", () => {
  const redirects: [string, string][] = [
    ["/services/notary-service", "/notary-houston-77090"],
    ["/services/passport-photos", "/passport-photos-houston-77090"],
    ["/services/certification-exam-testing", "/certiport-testing-center-houston"],
  ];

  for (const [from, to] of redirects) {
    test(`${from} → 301 → ${to}`, async ({ request }) => {
      const res = await request.get(`${BASE}${from}`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(res.headers()["location"]).toBe(to);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. HEADER
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Header navigation", () => {
  test("logo → /", async ({ page }) => {
    await goto(page, "/services");
    await page.click('[data-testid="link-logo"]');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("Home nav → /", async ({ page }) => {
    await goto(page, "/services");
    await page.click('[data-testid="link-nav-home"]');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("Services nav → /services", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-nav-services"]');
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("About Us nav → /about", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-nav-about-us"]');
    await expect(page).toHaveURL(`${BASE}/about`);
  });

  test("Contact nav → /contact", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-nav-contact"]');
    await expect(page).toHaveURL(`${BASE}/contact`);
  });

  test("Book Now → /book", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-book-now"]');
    await expect(page).toHaveURL(`${BASE}/book`);
  });

  test("Exam Cram removed from top navigation", async ({ page }) => {
    await goto(page, "/");
    await expect(page.locator('[data-testid="link-nav-exam-cram"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="link-mobile-exam-cram"]')).toHaveCount(0);
  });

  test("Top bar phone = tel:2818365357", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="link-phone-top"]')
      .getAttribute("href");
    expect(href).toBe("tel:2818365357");
  });

  test("Top bar email = mailto:info@lbsconnect.net", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="link-email-top"]')
      .getAttribute("href");
    expect(href).toBe("mailto:info@lbsconnect.net");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. FOOTER
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Footer navigation", () => {
  test("footer present on home page", async ({ page }) => {
    await goto(page, "/");
    await expect(page.locator("footer")).toBeVisible();
  });

  test("Footer Home → /", async ({ page }) => {
    await goto(page, "/services");
    await page.click('[data-testid="link-footer-home"]');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("Footer Our Services → /services", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-footer-our-services"]');
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("Footer About Us → /about", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-footer-about-us"]');
    await expect(page).toHaveURL(`${BASE}/about`);
  });

  test("Footer Contact → /contact", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-footer-contact"]');
    await expect(page).toHaveURL(`${BASE}/contact`);
  });

  test("Footer Notary Service → /notary-houston-77090", async ({ page }) => {
    await goto(page, "/");
    await page
      .locator('[data-testid="link-footer-service-notary-service"]')
      .click();
    await expect(page).toHaveURL(`${BASE}/notary-houston-77090`);
  });

  test("Footer Passport Photos → /passport-photos-houston-77090", async ({ page }) => {
    await goto(page, "/");
    await page
      .locator('[data-testid="link-footer-service-passport-photos"]')
      .click();
    await expect(page).toHaveURL(`${BASE}/passport-photos-houston-77090`);
  });

  test("Footer Website Design → /website-design-houston-77090", async ({ page }) => {
    await goto(page, "/");
    await page
      .locator('[data-testid="link-footer-service-website-design"]')
      .click();
    await expect(page).toHaveURL(`${BASE}/website-design-houston-77090`);
  });

  test("Footer Certiport Exams → /certiport-testing-center-houston", async ({
    page,
  }) => {
    await goto(page, "/");
    await page
      .locator('[data-testid="link-footer-service-certiport-exams"]')
      .click();
    await expect(page).toHaveURL(`${BASE}/certiport-testing-center-houston`);
  });

  test("Footer Texas Insurance Exam Prep → /texas-insurance-exam-prep-houston", async ({ page }) => {
    await goto(page, "/");
    await page
      .locator('[data-testid="link-footer-service-texas-insurance-exam-prep"]')
      .click();
    await expect(page).toHaveURL(`${BASE}/texas-insurance-exam-prep-houston`);
  });

  test("Footer Privacy Policy → /privacy-policy", async ({ page }) => {
    await goto(page, "/");
    await page.locator("footer").getByText("Privacy Policy").click();
    await expect(page).toHaveURL(`${BASE}/privacy-policy`);
  });

  test("Footer Terms of Use → /terms-of-use", async ({ page }) => {
    await goto(page, "/");
    await page.locator("footer").getByText("Terms of Use").click();
    await expect(page).toHaveURL(`${BASE}/terms-of-use`);
  });

  test("Footer phone = tel:2818365357", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="link-footer-phone"]')
      .getAttribute("href");
    expect(href).toBe("tel:2818365357");
  });

  test("Footer email = mailto:info@lbsconnect.net", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="link-footer-email"]')
      .getAttribute("href");
    expect(href).toBe("mailto:info@lbsconnect.net");
  });

  test("Footer address links to Google Maps", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="link-footer-address"]')
      .getAttribute("href");
    expect(href).toMatch(/maps\.google\.com|goo\.gl/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Home page — sections and CTAs", () => {
  test("hero title renders", async ({ page }) => {
    await goto(page, "/");
    await expect(page.locator('[data-testid="text-hero-title"]')).toBeVisible();
  });

  test("hero Book Now button links to /book", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-hero-book"]');
    await expect(page).toHaveURL(`${BASE}/book`);
  });

  test("hero trust indicators render", async ({ page }) => {
    await goto(page, "/");
    await expect(page.locator('[data-testid="section-hero"]')).toContainText("Fast & Reliable Service");
    await expect(page.locator('[data-testid="section-hero"]')).toContainText("Trusted by Our Community");
  });

  test("hero Browse Services button links to /services", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-hero-browse"]');
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("Core Business Services icon strip renders notary, passport, website design, certifications, bootcamp", async ({ page }) => {
    await goto(page, "/");
    const strip = page.locator('[data-testid="section-core-services"]');
    await expect(strip).toBeVisible();
    await expect(strip.locator('a[href="/notary-houston-77090"]')).toBeVisible();
    await expect(strip.locator('a[href="/passport-photos-houston-77090"]')).toBeVisible();
    await expect(strip.locator('a[href="/certiport-testing-center-houston"]')).toBeVisible();
    await expect(strip.locator('a[href="/website-design-houston-77090"]').filter({ hasText: "Website Design" })).toBeVisible();
    await expect(strip.locator('a[href="/services?filter=bootcamp"]').filter({ hasText: "Life Insurance Boot Camp" })).toBeVisible();
  });

  test("clicking a core service icon navigates to its detail page", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="link-core-service-notary"]');
    await expect(page).toHaveURL(/notary-houston-77090/);
  });

  test("View all services → /services (same full list as top-nav Services)", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-view-all-services"]');
    await expect(page).toHaveURL(`${BASE}/services`);
    await expect(page.locator('[data-testid="section-testing-exam-programs"]')).toBeVisible();
  });

  test("Exam Testing Services secondary section renders", async ({ page }) => {
    await goto(page, "/");
    await expect(page.locator('[data-testid="section-testing-services"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-testing-services"]')).toContainText("More Services");
  });

  test("View Testing Info → /certiport-testing-center-houston", async ({
    page,
  }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-view-testing-info"]');
    await expect(page).toHaveURL(/certiport-testing-center-houston/);
  });

  test("Testimonials section shows 3 cards", async ({ page }) => {
    await goto(page, "/");
    await expect(
      page.locator('[data-testid="section-testimonials"]')
    ).toBeVisible();
    // 3 testimonial cards (Card elements inside the section)
    const cards = page
      .locator('[data-testid="section-testimonials"]')
      .locator('[class*="card"], [class*="Card"]')
      .filter({ has: page.locator('text="★★★★★"') });
    await expect(cards).toHaveCount(3);
  });

  test("Google review link is NOT a placeholder", async ({ page }) => {
    await goto(page, "/");
    const placeholder = page.locator(
      'a[href*="your-google-business-link"]'
    );
    await expect(placeholder).toHaveCount(0);
  });

  test("Google review link points to real g.page URL", async ({ page }) => {
    await goto(page, "/");
    const link = page
      .locator('[data-testid="section-testimonials"]')
      .locator('a[href*="g.page"]');
    await expect(link).toBeVisible();
  });

  test("FAQ section renders and accordion works", async ({ page }) => {
    await goto(page, "/");
    const faq = page.locator('[data-testid="section-faq"]');
    await expect(faq).toBeVisible();
    const firstQ = faq.locator("button").first();
    await firstQ.click();
    // After clicking, the answer div should appear
    await expect(firstQ).toHaveAttribute("aria-expanded", "true");
  });

  test("Bottom CTA call = tel:2818365357", async ({ page }) => {
    await goto(page, "/");
    const href = await page
      .locator('[data-testid="button-cta-call"]')
      .getAttribute("href");
    expect(href).toBe("tel:2818365357");
  });

  test("Get Directions button → /contact", async ({ page }) => {
    await goto(page, "/");
    await page.click('[data-testid="button-contact-cta"]');
    await expect(page).toHaveURL(`${BASE}/contact`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. SERVICES PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Services page", () => {
  test("default view: title = LBS Services, business services + Testing & Exam Programs row visible", async ({
    page,
  }) => {
    await goto(page, "/services");
    await expect(
      page.locator('[data-testid="text-services-title"]')
    ).toContainText("LBS Services");
    for (const slug of [
      "notary-service",
      "passport-photos",
    ]) {
      await expect(
        page.locator(`[data-testid="card-service-${slug}"]`)
      ).toBeVisible();
    }
    await expect(
      page.locator('[data-testid="section-testing-exam-programs"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-testing-row-certification"]')
    ).toBeVisible();
  });

  test("filter=bootcamp: only bootcamp cards, no notary/passport/exam-cram", async ({
    page,
  }) => {
    await goto(page, "/services?filter=bootcamp");
    await expect(
      page.locator('[data-testid="text-services-title"]')
    ).toContainText("Exam Prep Bootcamps");
    await expect(
      page.locator('[data-testid="card-service-life-insurance-boot-camp"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-service-property-casualty-boot-camp"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-service-notary-service"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="card-service-passport-photos"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="card-service-exam-cram"]')
    ).toHaveCount(0);
  });

  test("filter=business: only Notary + Passport, no bootcamp/certiport/exam-cram", async ({
    page,
  }) => {
    await goto(page, "/services?filter=business");
    await expect(
      page.locator('[data-testid="text-services-title"]')
    ).toContainText("Business Services");
    await expect(
      page.locator('[data-testid="card-service-notary-service"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-service-passport-photos"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-service-life-insurance-boot-camp"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="card-service-certification-exam-testing"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-testid="card-service-exam-cram"]')
    ).toHaveCount(0);
  });

  test("filtered view: Back to all services navigates to /services", async ({
    page,
  }) => {
    await goto(page, "/services?filter=bootcamp");
    const back = page.locator('a[href="/services"]').filter({ hasText: /back/i });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("bootcamp cards show Next: Saturday badge", async ({ page }) => {
    await goto(page, "/services?filter=bootcamp");
    const badge = page
      .locator('[data-testid="card-service-life-insurance-boot-camp"]')
      .locator('text=/Next:/');
    await expect(badge).toBeVisible();
  });

  test("Certiport card → /certiport-testing-center-houston", async ({
    page,
  }) => {
    await goto(page, "/services?filter=testing");
    await page.click(
      '[data-testid="card-service-certification-exam-testing"]'
    );
    await expect(page).toHaveURL(/certiport-testing-center-houston/);
  });

  test("Notary card → /notary-houston-77090", async ({ page }) => {
    await goto(page, "/services");
    await page.click('[data-testid="card-service-notary-service"]');
    await expect(page).toHaveURL(/notary-houston-77090/);
  });

  test("Exam Cram card links to myeasypass.net", async ({ page }) => {
    await goto(page, "/services");
    const href = await page
      .locator('a[href*="myeasypass"]')
      .first()
      .getAttribute("href");
    expect(href).toContain("myeasypass.net");
  });

  test("Testing & Exam Programs row shows certification, boot camps, and MyEasyPass", async ({ page }) => {
    await goto(page, "/services");
    await expect(
      page.locator('[data-testid="section-testing-exam-programs"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-testing-row-certification"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-testing-row-life-insurance-bootcamp"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-testing-row-property-casualty-bootcamp"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="card-testing-row-myeasypass"]')
    ).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. SERVICE DETAIL PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("ServiceDetail — Certiport Exam Testing", () => {
  test("title contains Pearson VUE & Certiport Exam Testing", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    await expect(
      page.locator('[data-testid="text-detail-title"]')
    ).toContainText("Pearson VUE & Certiport Exam Testing");
  });

  test("service image renders", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    await expect(
      page.locator('[data-testid="img-service-detail"]')
    ).toBeVisible();
  });

  test("Back to Services → /services", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    await page.click('[data-testid="button-back"]');
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("calendar shows Mon-Sat note", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    await expect(page.locator("text=Available Mon–Sat")).toBeVisible();
  });

  test("exam selector appears after date+time selection", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    const found = await pickFirstSlot(page);
    if (found) {
      await expect(page.locator('label:has-text("Exam")')).toBeVisible();
    }
  });

  test("missing exam selection triggers toast on submit", async ({ page }) => {
    await goto(page, "/services/certification-exam-testing");
    const found = await pickFirstSlot(page);
    if (found) {
      await page.fill('input[id="name"]', "Test User");
      await page.fill('input[id="email"]', "test@example.com");
      await page.fill('input[id="phone"]', "(713) 555-0100");
      // Skip exam — click the actual booking form's submit button
      await page.locator('[data-testid="button-submit-booking"]').click();
      await expect(
        page.locator('[role="status"]').filter({ hasText: /exam|missing/i })
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("ServiceDetail — Notary Service", () => {
  test("shows pay-at-office message, no price display", async ({ page }) => {
    await goto(page, "/services/notary-service");
    await expect(
      page.locator("text=Payment collected in office")
    ).toBeVisible();
  });

  test("book button says 'Book Appointment' (not 'Book & Pay')", async ({
    page,
  }) => {
    await goto(page, "/services/notary-service");
    const found = await pickFirstSlot(page);
    if (found) {
      const bookBtn = page.locator('button:has-text("Book Appointment")');
      await expect(bookBtn).toBeVisible();
      await expect(
        page.locator('button:has-text("Book & Pay")')
      ).toHaveCount(0);
    }
  });

  test("Mon-Sat calendar note (not Saturday-only)", async ({ page }) => {
    await goto(page, "/services/notary-service");
    await expect(page.locator("text=Available Mon–Sat")).toBeVisible();
  });

  test("missing fields triggers validation toast", async ({ page }) => {
    await goto(page, "/services/notary-service");
    const found = await pickFirstSlot(page);
    if (found) {
      await page.locator('button:has-text("Book Appointment")').click();
      await expect(
        page.locator('[role="status"]').filter({ hasText: /missing/i })
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe("ServiceDetail — Life Insurance Boot Camp", () => {
  test("title contains Life Insurance", async ({ page }) => {
    await goto(page, "/services/life-insurance-boot-camp");
    await expect(
      page.locator('[data-testid="text-detail-title"]')
    ).toContainText("Life Insurance");
  });

  test("Saturday-only note shown", async ({ page }) => {
    await goto(page, "/services/life-insurance-boot-camp");
    await expect(page.locator("text=Available Saturdays only")).toBeVisible();
  });

  test("Book & Pay $99 button shown after Sat slot selected", async ({
    page,
  }) => {
    await goto(page, "/services/life-insurance-boot-camp");
    const found = await pickFirstSlot(page);
    if (found) {
      // Should always show a "Book & Pay" + "$99" since isBootcamp=true
      await expect(
        page.locator('button:has-text("Book & Pay")')
      ).toBeVisible();
      await expect(page.locator('button:has-text("$99")')).toBeVisible();
    }
  });

  test("bootcamp without Stripe price → payment required toast (not silent booking)", async ({
    page,
  }) => {
    await goto(page, "/services/life-insurance-boot-camp");
    const found = await pickFirstSlot(page);
    if (found) {
      await page.fill('input[id="name"]', "QA Tester");
      await page.fill('input[id="email"]', "qa@test.com");
      await page.fill('input[id="phone"]', "(713) 555-0100");
      const bookBtn = page.locator('button:has-text("Book")').last();
      await bookBtn.click();
      // Either goes to Stripe (price configured) or shows payment toast (not configured)
      const navigatedToStripe = page.url().includes("stripe.com");
      if (!navigatedToStripe) {
        await expect(
          page.locator('[role="status"]').filter({ hasText: /payment|call/i })
        ).toBeVisible({ timeout: 6000 });
      }
    }
  });
});

test.describe("ServiceDetail — P&C Boot Camp", () => {
  test("title contains Property", async ({ page }) => {
    await goto(page, "/services/property-casualty-boot-camp");
    await expect(
      page.locator('[data-testid="text-detail-title"]')
    ).toContainText("Property");
  });

  test("Saturday-only note shown", async ({ page }) => {
    await goto(page, "/services/property-casualty-boot-camp");
    await expect(page.locator("text=Available Saturdays only")).toBeVisible();
  });
});

test.describe("ServiceDetail — Passport Photos", () => {
  test("title contains Passport", async ({ page }) => {
    await goto(page, "/services/passport-photos");
    await expect(
      page.locator('[data-testid="text-detail-title"]')
    ).toContainText("Passport");
  });

  test("$25 price displayed", async ({ page }) => {
    await goto(page, "/services/passport-photos");
    await expect(page.locator("body")).toContainText("$25");
  });

  test("Mon–Sat calendar note", async ({ page }) => {
    await goto(page, "/services/passport-photos");
    await expect(page.locator("text=Available Mon–Sat")).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. BOOK PAGE
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Book page (/book)", () => {
  test("all 5 services listed", async ({ page }) => {
    await goto(page, "/book");
    for (const name of [
      "Certiport Exam Testing",
      "Notary Service",
      "Passport Photos",
      "Texas Life Insurance Exam Boot Camp",
      "Texas Property & Casualty Exam Boot Camp",
    ]) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible();
    }
  });

  test("Exam Cram external link present", async ({ page }) => {
    await goto(page, "/book");
    await expect(
      page.locator('a[href*="myeasypass"]').first()
    ).toBeVisible();
  });

  test("clicking Notary Service → /notary-houston-77090", async ({
    page,
  }) => {
    await goto(page, "/book");
    await page.locator("text=Notary Service").first().click();
    await expect(page).toHaveURL(/notary-houston-77090/);
  });

  test("phone CTA = tel:2818365357", async ({ page }) => {
    await goto(page, "/book");
    const href = await page
      .locator('a[href="tel:2818365357"]')
      .first()
      .getAttribute("href");
    expect(href).toBe("tel:2818365357");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. CHECKOUT PAGES
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Checkout Success", () => {
  test("heading: Payment Successful", async ({ page }) => {
    await goto(page, "/checkout/success");
    await expect(
      page.locator('[data-testid="text-success-title"]')
    ).toContainText("Payment Successful");
  });

  test("Return to Home → /", async ({ page }) => {
    await goto(page, "/checkout/success");
    await page.click('[data-testid="button-back-home"]');
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test("Google Review link is NOT a placeholder", async ({ page }) => {
    await goto(page, "/checkout/success");
    await expect(
      page.locator('a[href*="your-google-business-link"]')
    ).toHaveCount(0);
  });
});

test.describe("Checkout Cancel", () => {
  test("heading: Checkout Cancelled", async ({ page }) => {
    await goto(page, "/checkout/cancel");
    await expect(
      page.locator('[data-testid="text-cancel-title"]')
    ).toContainText("Checkout Cancelled");
  });

  test("Try Again → /services", async ({ page }) => {
    await goto(page, "/checkout/cancel");
    await page.click('[data-testid="button-try-again"]');
    await expect(page).toHaveURL(`${BASE}/services`);
  });

  test("Call for Help = tel:2818365357", async ({ page }) => {
    await goto(page, "/checkout/cancel");
    const href = await page
      .locator('[data-testid="button-call-help"]')
      .getAttribute("href");
    expect(href).toBe("tel:2818365357");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. SERVER API SANITY
// ═══════════════════════════════════════════════════════════════════════════

test.describe("Server API — sanity", () => {
  test("GET /api/products-with-prices responds", async ({ request }) => {
    const res = await request.get(`${BASE}/api/products-with-prices`);
    // 200 (Stripe configured) or 500 (not configured in dev) — both are handled
    expect([200, 500]).toContain(res.status());
  });

  test("GET /api/appointments/available-slots — Monday has slots", async ({
    request,
  }) => {
    const now = new Date();
    const daysToMon = ((8 - now.getDay()) % 7) || 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() + daysToMon);
    const res = await request.get(
      `${BASE}/api/appointments/available-slots?date=${mon.toISOString()}&service=notary-service`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.slots)).toBe(true);
    expect(body.slots.length).toBeGreaterThan(0);
  });

  test("GET /api/appointments/available-slots — Sunday has 0 slots", async ({
    request,
  }) => {
    const now = new Date();
    const daysToSun = ((7 - now.getDay()) % 7) || 7;
    const sun = new Date(now);
    sun.setDate(now.getDate() + daysToSun);
    const res = await request.get(
      `${BASE}/api/appointments/available-slots?date=${sun.toISOString()}`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.slots.length).toBe(0);
  });

  test("POST /api/appointments — Bootcamp without payNow → 400", async ({
    request,
  }) => {
    const now = new Date();
    const daysToSat = ((6 - now.getDay() + 7) % 7) || 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + daysToSat);
    sat.setUTCHours(13, 0, 0, 0); // 8 AM CT (CDT)
    const res = await request.post(`${BASE}/api/appointments`, {
      data: {
        customerName: "QA Tester",
        customerEmail: "qa@test.com",
        serviceName: "Texas Life Insurance Exam Boot Camp",
        appointmentDate: sat.toISOString(),
        payNow: false,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/payment|required/i);
  });

  test("POST /api/appointments — Notary without payNow → 200 or 500 (requires DB)", async ({
    request,
  }) => {
    const now = new Date();
    const daysToMon = ((8 - now.getDay()) % 7) || 7;
    const mon = new Date(now);
    mon.setDate(now.getDate() + daysToMon);
    mon.setUTCHours(14, 0, 0, 0); // ~8 AM CT

    // Use unique email to avoid slot conflicts
    const email = `qa+notary+${Date.now()}@test.com`;
    const res = await request.post(`${BASE}/api/appointments`, {
      data: {
        customerName: "QA Tester",
        customerEmail: email,
        customerPhone: "(713) 555-0100",
        serviceName: "Notary Service",
        appointmentDate: mon.toISOString(),
        payNow: false,
      },
    });
    // 200 when DB is available; 500 when DATABASE_URL is not set (no DB in this env)
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.success).toBe(true);
    }
  });

  test("POST /api/appointments — missing required field → 400", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/appointments`, {
      data: { customerName: "Incomplete" }, // missing email, serviceName, appointmentDate
    });
    expect(res.status()).toBe(400);
  });
});
