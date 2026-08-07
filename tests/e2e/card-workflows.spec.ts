import { test, expect } from '@playwright/test';

test.use({
  launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' },
});

test('Card 1 - Certiport booking workflow', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card1 = page.locator('[data-testid="link-core-service-certiport-exam-testing"]');
  await expect(card1).toBeVisible();
  await card1.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 1 landed on:', page.url());
  await expect(page).toHaveURL(/certiport-testing-center-houston/);

  // Verify the booking section is visible on the page (the submit button
  // itself only renders after a date + time are picked in the calendar)
  const bookingSection = page.locator('text=Book an Appointment', { exact: false }).first();
  await expect(bookingSection).toBeVisible();
  console.log('Card 1: PASS —', page.url());
});

test('Card 2 - Bootcamp filter workflow', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card2 = page.locator('[data-testid="link-core-service-life-insurance-boot-camp"]');
  await expect(card2).toBeVisible();
  await card2.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 2 landed on:', page.url());
  await expect(page).toHaveURL(/filter=bootcamp/);

  await expect(page.locator('text=Texas Life Insurance Exam Boot Camp')).toBeVisible();
  await expect(page.locator('text=Texas Property & Casualty Exam Boot Camp')).toBeVisible();

  const notary = await page.locator('[data-testid="card-service-notary-service"]').count();
  console.log('Notary cards shown (should be 0):', notary);
  expect(notary).toBe(0);

  console.log('Card 2: PASS');
});

test('Card 3 - View all services workflow (full unfiltered list, matching top-nav Services)', async ({ page }) => {
  await page.goto('http://localhost:5000/');
  await page.waitForLoadState('networkidle');

  const card3 = page.locator('[data-testid="button-view-all-services"]');
  await expect(card3).toBeVisible();
  await card3.click();
  await page.waitForLoadState('networkidle');

  console.log('Card 3 landed on:', page.url());
  await expect(page).toHaveURL('http://localhost:5000/services');

  await expect(page.locator('[data-testid="card-service-notary-service"]')).toBeVisible();
  await expect(page.locator('[data-testid="card-service-passport-photos"]')).toBeVisible();

  // Unlike the old filter=business link, the unfiltered page also shows a
  // "Testing Center" card in the business grid, linking to the dedicated
  // Testing Center page — same content a visitor gets from the top-nav
  // "Services" link.
  const testingCenterCard = await page.locator('[data-testid="card-service-testing-center"]').count();
  console.log('Testing Center card shown (should be 1):', testingCenterCard);
  expect(testingCenterCard).toBeGreaterThan(0);

  console.log('Card 3: PASS');
});
