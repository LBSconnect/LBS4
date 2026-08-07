/**
 * i9-portal-ui.spec.ts
 *
 * Browser-driven verification of the I-9 portal's React UI — distinct from
 * tests/e2e/i9-workflow.spec.ts, which proves the API layer is correct but
 * never renders a page. This file catches the class of bug API tests can't:
 * wrong data binding, a button that's disabled when it shouldn't be, a form
 * that doesn't actually call the endpoint it's supposed to.
 *
 * Tedious multi-step setup (registering a company, walking it through 12
 * onboarding statuses) is done via API calls through `page.request`, which
 * shares cookies with the browser context — so the browser session set up
 * by a real UI login is what performs those calls too. Only the parts worth
 * verifying as real UI interactions (login, registration, the new-hire
 * request form, protected-data entry, the work packet view) are driven
 * through actual page interactions.
 */
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";
const PORTAL = "/employer-services/new-hire-verification/portal";
const HAS_I9_ENV = !!(process.env.DATABASE_URL && process.env.PROTECTED_DATA_ENCRYPTION_KEY && process.env.I9_ADMIN_BOOTSTRAP_SECRET);

test.skip(!HAS_I9_ENV, "I-9 portal UI tests require DATABASE_URL, PROTECTED_DATA_ENCRYPTION_KEY, and I9_ADMIN_BOOTSTRAP_SECRET in .env.test");

function rand(n = 8): string {
  return Math.random().toString(36).slice(2, 2 + n);
}

async function apiPost(request: APIRequestContext, path: string, data: unknown) {
  const csrf = (await request.storageState()).cookies.find((c) => c.name === "i9_csrf")?.value;
  return request.post(BASE_URL + path, { data, headers: csrf ? { "X-CSRF-Token": csrf } : {} });
}

async function readJson(res: Awaited<ReturnType<APIRequestContext["post"]>>) {
  return res.json();
}

test.describe.serial("I-9 portal — browser UI", () => {
  let adminRequest: APIRequestContext;
  let processorEmail: string;
  let companyId: string;
  let requestId: string;

  test.beforeAll(async ({ playwright }) => {
    // A separate API context (its own cookie jar) just to bootstrap an admin
    // and a case processor account — not something a real user does through
    // the UI, so it's fair to skip past it here.
    adminRequest = await playwright.request.newContext({ baseURL: BASE_URL });
    const adminEmail = `ui-admin-${rand()}@lbstest.internal`;
    const boot = await adminRequest.post("/api/i9/auth/bootstrap-admin", {
      data: { secret: process.env.I9_ADMIN_BOOTSTRAP_SECRET, email: adminEmail, password: "AdminPassword123!", fullName: "UI Test Admin" },
    });
    expect(boot.ok()).toBeTruthy();
    const login = await adminRequest.post("/api/i9/auth/login", { data: { email: adminEmail, password: "AdminPassword123!" } });
    expect(login.ok()).toBeTruthy();
    const loginJson = await readJson(login);
    expect(loginJson.user.mustChangePassword, "a freshly bootstrapped admin must be flagged to change their temp password").toBe(true);
    // bootstrap-admin always issues a temp password that must be changed
    // before anything else works (server/i9Auth.ts's requireI9Auth) — every
    // other authenticated call below would otherwise 403.
    const forceChange = await apiPost(adminRequest, "/api/i9/auth/force-change-password", { newPassword: "AdminRealPassword456!" });
    expect(forceChange.ok()).toBeTruthy();

    processorEmail = `ui-processor-${rand()}@lbstest.internal`;
    const createProc = await apiPost(adminRequest, "/api/i9/admin/users", { email: processorEmail, password: "ProcPassword123!", fullName: "UI Test Processor", role: "lbs_case_processor" });
    expect(createProc.ok()).toBeTruthy();
  });

  test.afterAll(async () => {
    await adminRequest.dispose();
  });

  test("a client can register, add a hiring site, and create a new-hire request through the real UI", async ({ page }) => {
    await page.goto(`${BASE_URL}${PORTAL}/register`);
    const companyName = `UI Test Co ${rand(4)}`;
    await page.fill("#i9-company", companyName);
    await page.fill("#i9-contact", "UI Test Signer");
    const clientEmail = `ui-client-${rand()}@lbstest.example`;
    await page.fill("#i9-reg-email", clientEmail);
    await page.fill("#i9-reg-password", "ClientUiPassword123!");
    await page.fill("#i9-reg-password-confirm", "ClientUiPassword123!");
    await page.click('button[type="submit"]');
    // Registration lands on the onboarding wizard (not straight to the
    // dashboard) — its first step prefills the company name it was just
    // registered with.
    await page.waitForURL(`**${PORTAL}/onboarding`, { timeout: 10_000 });
    await expect(page.getByText("Employer Onboarding")).toBeVisible();
    await expect(page.getByLabel("Legal Business Name")).toHaveValue(companyName);

    // Grab the companyId from the authenticated session for the admin-side
    // onboarding-advance calls below.
    const me = await page.request.get(`${BASE_URL}/api/i9/auth/me`);
    const meJson = await me.json();
    companyId = meJson.user.clientCompanyId;
    expect(companyId).toBeTruthy();

    // Hiring site via the real form.
    await page.goto(`${BASE_URL}${PORTAL}/hiring-sites`);
    await page.click("text=Add Hiring Site");
    await page.fill('input[placeholder="e.g. Houston Warehouse"]', "UI Test Site");
    const addressInputs = page.locator("input");
    // Fill address by locating the field after the "Address" label — use nth Input within the visible form (2nd input after name).
    await page.locator('div.bg-\\[\\#f8f9fb\\] input').nth(1).fill("100 UI Test Way, Houston, TX");
    await page.click("text=Save Site");
    await expect(page.getByText("UI Test Site")).toBeVisible({ timeout: 5000 });

    // Advance the company to active via the admin API (not a UI concern for this test).
    const chain = [
      "plan_selected", "lbs_agreement_pending", "lbs_agreement_signed", "setup_payment_pending",
      "business_intake_pending", "ready_for_everify_enrollment", "everify_enrollment_entered_by_lbs",
      "mou_signature_pending", "mou_signed", "hiring_sites_confirmed", "workflow_training_pending", "active",
    ];
    for (const status of chain) {
      const r = await apiPost(adminRequest, `/api/i9/companies/${companyId}/status`, { status });
      expect(r.ok(), `advance to ${status}`).toBeTruthy();
    }

    // New-hire request via the real form.
    await page.goto(`${BASE_URL}${PORTAL}/requests/new`);
    await page.selectOption("select", { label: "UI Test Site" }); // hiring site select is the first <select> on the page
    const selects = page.locator("select");
    await selects.nth(1).selectOption({ label: "E-Verify case creation and processing" });
    await page.fill('input[type="date"]', "2026-08-17");
    for (const label of [
      "This employee has accepted a job offer",
      "This request is not being submitted before a hiring decision",
      "The employee chose which acceptable documents",
      "The information in this request is accurate",
      "The hiring site selected above is a confirmed",
    ]) {
      await page.getByText(label, { exact: false }).locator("xpath=preceding-sibling::input").check();
    }
    await page.click("text=Save as Draft");
    // Not page.waitForURL("**/requests/*") — the *current* URL (.../requests/new)
    // already satisfies that glob, so it resolves immediately against the
    // pre-navigation URL instead of waiting for the real one. Wait for
    // content that only exists on the detail page instead, then read the URL.
    await expect(page.getByText("Ready to Submit?")).toBeVisible({ timeout: 10_000 });
    requestId = page.url().split("/requests/")[1];
    expect(requestId, "captured request id should not be the literal 'new' route").not.toBe("new");
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    await page.click("text=Submit for Processing");
    await expect(page.getByText("submitted", { exact: false }).first()).toBeVisible({ timeout: 5000 });
  });

  test("the protected-data form on the request detail page actually saves data through the UI", async ({ page }) => {
    // Re-login as the same client isn't needed — the page context carries the
    // cookie from the previous test's registration since tests in a
    // `serial` block share the same page/context by default in this file's
    // configuration... to be explicit and independent of that assumption,
    // log back in as the LBS processor instead, since protected-data entry
    // is also allowed for LBS staff (server/i9Routes.ts) and this test only
    // needs *a* valid, non-billing session.
    await page.goto(`${BASE_URL}${PORTAL}/login`);
    await page.fill("#i9-email", processorEmail);
    await page.fill("#i9-password", "ProcPassword123!");
    await page.click('button[type="submit"]');
    // The processor account was created via POST /api/i9/admin/users, which
    // defaults to mustChangePassword — this is its first-ever login, so it
    // lands on the forced password-change screen before anything else.
    await page.waitForURL(`**${PORTAL}/force-change-password`, { timeout: 10_000 });
    await page.fill("#i9-force-new-password", "ProcPasswordChanged456!");
    await page.fill("#i9-force-new-password-confirm", "ProcPasswordChanged456!");
    await page.click('button[type="submit"]');
    await page.waitForURL(`**${PORTAL}`, { timeout: 10_000 });

    await page.goto(`${BASE_URL}${PORTAL}/requests/${requestId}`);
    await expect(page.getByRole("heading", { name: "Protected Employee Data" })).toBeVisible();

    // Required fields render their label as "Employee Name*" (the Field
    // component's visual required-indicator asterisk is part of the
    // accessible name), so match on the prefix rather than an exact string.
    await page.getByLabel(/^Employee Name/).fill("Browser Test Employee");
    await page.getByLabel(/Social Security Number/).fill("123-45-6789");
    await page.click("text=Save Protected Data");
    await expect(page.getByText("saved securely")).toBeVisible({ timeout: 5000 });

    // Masked summary shows only the last 4 — never the full SSN — in the page DOM.
    await page.reload();
    await expect(page.getByText(/SSN 6789/).or(page.getByText(/\*\*\*-\*\*-6789/))).toBeVisible();
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("123-45-6789");
  });

  test("the work packet view renders for LBS staff, with a reveal action that requires a reason", async ({ page }) => {
    // Advance the request far enough that ready_for_case_creation and the
    // work packet are meaningful (second-review + move it forward) via API,
    // then verify the UI renders it correctly.
    const readyRes = await apiPost(adminRequest, `/api/i9/new-hire-requests/${requestId}/status`, { status: "ready_for_case_creation", secondReviewConfirmed: true });
    expect(readyRes.ok()).toBeTruthy();

    await page.goto(`${BASE_URL}${PORTAL}/login`);
    await page.fill("#i9-email", processorEmail);
    // Already changed from the initial temp password in the previous test.
    await page.fill("#i9-password", "ProcPasswordChanged456!");
    await page.click('button[type="submit"]');
    await page.waitForURL(`**${PORTAL}`, { timeout: 10_000 });

    await page.goto(`${BASE_URL}${PORTAL}/requests/${requestId}`);
    await page.click("text=View Work Packet");
    await expect(page.getByRole("button", { name: "Open E-Verify" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator("table").getByText("Employee Name")).toBeVisible();
    // The table shows the masked SSN column, never the full value.
    const packetText = await page.locator("table").textContent();
    expect(packetText).toContain("6789");
    expect(packetText).not.toContain("123-45-6789");

    // Reveal requires a reason first.
    await page.click("text=Reveal Full Details");
    await expect(page.getByText(/at least 5 characters/)).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder("e.g. Manual E-Verify case entry").fill("Manual E-Verify case entry for testing");
    await page.click("text=Reveal Full Details");
    await expect(page.getByText("123-45-6789")).toBeVisible({ timeout: 5000 });
  });
});
