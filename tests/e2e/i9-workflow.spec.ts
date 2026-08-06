/**
 * i9-workflow.spec.ts
 *
 * End-to-end verification of the I-9/E-Verify New-Hire Verification portal's
 * core workflow, run at the API level against a real Postgres database (no
 * browser needed — same pattern as business-hours.spec.ts). This is the
 * suite that actually exercises the business logic: tenant isolation, role
 * permissions, the onboarding status machine, attestation/second-review
 * gates, protected-data encryption + masking, and the audit trail — not just
 * "does the page render."
 *
 * Requires DATABASE_URL, PROTECTED_DATA_ENCRYPTION_KEY, SESSION_SECRET, and
 * I9_ADMIN_BOOTSTRAP_SECRET in .env.test (see .env.test.example). Tests are
 * skipped with a clear message if any of these aren't configured, rather
 * than failing confusingly.
 *
 * A single Program Admin + Case Processor are bootstrapped ONCE in
 * `beforeAll` and reused across every describe block below — POST
 * /api/i9/auth/login is rate-limited (10 / 15 min / IP, a real anti-brute-
 * force control this suite must not weaken), and a naive "log in fresh for
 * every test" design burns through that budget on its own before a single
 * real assertion runs. Tests that specifically need a throwaway identity
 * (the session-fixation check, the logout check) create their own, but
 * everything else shares the module-level fixtures.
 *
 * Serial within each describe block: later tests depend on state created by
 * earlier ones in the same block (e.g. a request must be created before it
 * can be submitted).
 */
import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { I9Session, randSuffix } from "./helpers/i9Session.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5000";
const HAS_I9_ENV = !!(process.env.DATABASE_URL && process.env.PROTECTED_DATA_ENCRYPTION_KEY && process.env.I9_ADMIN_BOOTSTRAP_SECRET);

test.skip(!HAS_I9_ENV, "I-9 workflow tests require DATABASE_URL, PROTECTED_DATA_ENCRYPTION_KEY, and I9_ADMIN_BOOTSTRAP_SECRET in .env.test");

async function req(session: I9Session, method: string, path: string, body?: unknown) {
  return session.req(BASE_URL, method, path, body);
}

async function loginAs(email: string, password: string, name = email): Promise<I9Session> {
  const session = new I9Session(name);
  const r = await req(session, "POST", "/api/i9/auth/login", { email, password });
  expect(r.status, `login as ${name}`).toBe(200);
  return session;
}

async function createInternalUser(admin: I9Session, role: string): Promise<{ email: string; password: string }> {
  const email = `${role}-${randSuffix()}@lbstest.internal`;
  const password = "TestPassword123!";
  const create = await req(admin, "POST", "/api/i9/admin/users", { email, password, fullName: `Test ${role}`, role });
  expect(create.status, `admin creates ${role}`).toBe(200);
  return { email, password };
}

async function registerClient(companyLegalName: string): Promise<{ session: I9Session; companyId: string; email: string }> {
  const session = new I9Session("client-" + randSuffix(4));
  const email = `client-${randSuffix()}@lbstest.example`;
  const r = await req(session, "POST", "/api/i9/auth/register-client", {
    companyLegalName,
    contactName: "Test Signer",
    email,
    password: "ClientPassword123!",
  });
  expect(r.status, "register-client should succeed").toBe(200);
  return { session, companyId: r.json.companyId, email };
}

const ONBOARDING_CHAIN = [
  "plan_selected", "lbs_agreement_pending", "lbs_agreement_signed", "setup_payment_pending",
  "business_intake_pending", "ready_for_everify_enrollment", "everify_enrollment_entered_by_lbs",
  "mou_signature_pending", "mou_signed", "hiring_sites_confirmed", "workflow_training_pending", "active",
];

/** Walks a freshly-registered company all the way to `active`, as an LBS
 *  Program Admin — the only role permitted to change onboarding status. */
async function advanceCompanyToActive(admin: I9Session, companyId: string) {
  for (const status of ONBOARDING_CHAIN) {
    const r = await req(admin, "POST", `/api/i9/companies/${companyId}/status`, { status });
    expect(r.status, `advance to ${status}`).toBe(200);
  }
}

// ─── Shared fixtures (one login each, reused everywhere below) ─────────────

let admin: I9Session;
let processor: I9Session;

test.beforeAll(async () => {
  admin = new I9Session("admin");
  const adminEmail = `admin-${randSuffix()}@lbstest.internal`;
  const boot = await req(admin, "POST", "/api/i9/auth/bootstrap-admin", {
    secret: process.env.I9_ADMIN_BOOTSTRAP_SECRET,
    email: adminEmail,
    password: "AdminPassword123!",
    fullName: "Test Program Admin",
  });
  expect(boot.status, "bootstrap-admin should succeed").toBe(200);
  const adminLogin = await req(admin, "POST", "/api/i9/auth/login", { email: adminEmail, password: "AdminPassword123!" });
  expect(adminLogin.status).toBe(200);

  const proc = await createInternalUser(admin, "lbs_case_processor");
  processor = await loginAs(proc.email, proc.password, "processor");
});

// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Auth & session security", () => {
  test("logging in over a planted session cookie rotates the session ID and kills the planted one", async () => {
    const decoy = await createInternalUser(admin, "lbs_intake_billing");
    const decoySession = await loginAs(decoy.email, decoy.password, "decoy");
    const plantedCookie = decoySession.cookieHeader;

    const victim = await createInternalUser(admin, "lbs_intake_billing");
    const loginRes = await fetch(BASE_URL + "/api/i9/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: plantedCookie },
      body: JSON.stringify({ email: victim.email, password: victim.password }),
    });
    expect(loginRes.status, "victim login over a planted cookie still succeeds").toBe(200);

    const newCookies = loginRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    expect(newCookies, "a brand-new session ID is issued").not.toContain(plantedCookie.split("=")[1]);

    const reuse = await fetch(BASE_URL + "/api/i9/auth/me", { headers: { Cookie: plantedCookie } });
    expect(reuse.status, "the planted (pre-login) session ID no longer authenticates anything").toBe(401);
  });

  test("a mutating request without X-CSRF-Token is rejected even with a valid session", async () => {
    const res = await fetch(BASE_URL + "/api/i9/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: admin.cookieHeader }, // deliberately no X-CSRF-Token
      body: JSON.stringify({ email: `nocsrf-${randSuffix()}@test.com`, password: "SomePassword123!", fullName: "No CSRF", role: "lbs_case_processor" }),
    });
    expect(res.status).toBe(403);
  });

  test("a logged-out session is rejected on the next request", async () => {
    const throwaway = await createInternalUser(admin, "lbs_intake_billing");
    const session = await loginAs(throwaway.email, throwaway.password, "throwaway");
    const before = await req(session, "GET", "/api/i9/auth/me");
    expect(before.status).toBe(200);
    await req(session, "POST", "/api/i9/auth/logout");
    const after = await req(session, "GET", "/api/i9/auth/me");
    expect(after.status).toBe(401);
  });
});

test.describe.serial("Sensitive-field rejection & tenant isolation", () => {
  test("a forbidden sensitive field name is rejected even on an authenticated request", async () => {
    const { session, companyId } = await registerClient("Sensitive Field Test Co");
    const r = await req(session, "POST", "/api/i9/new-hire-requests", {
      clientCompanyId: companyId,
      hiringSiteId: "placeholder",
      serviceRequested: "E-Verify case creation and processing",
      firstDayOfEmploymentForPay: "2026-08-10",
      attestJobOfferAccepted: true, attestNotPreScreening: true, attestEmployeeChoseDocuments: true,
      attestInformationAccurate: true, attestParticipatingHiringSite: true,
      ssn: "123-45-6789",
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toMatch(/ssn/i);
  });

  test("an SSN-shaped value hidden in free text is rejected", async () => {
    const r = await new I9Session("anon").req(BASE_URL, "POST", "/api/i9/leads", {
      contactName: "Test", companyName: "Test Co", businessEmail: `t-${randSuffix()}@test.com`, businessPhone: "281-555-1234",
      companyAddress: "123 Main St", industry: "Retail", employeeCount: "10-49", monthlyHires: "1-5", hiringLocations: "1",
      alreadyEnrolledInEverify: "not_sure", usesAnotherEmployerAgent: "not_sure", federalContractorStatus: "not_sure",
      desiredService: "E-Verify Employer Agent Services", preferredConsultationMethod: "Email",
      message: "employee ssn is 123-45-6789", consentToContact: true,
    });
    expect(r.status).toBe(400);
    expect(JSON.stringify(r.json)).toMatch(/Social Security/i);
  });

  test("company A cannot read, patch, or list hiring sites for company B", async () => {
    const a = await registerClient("Tenant Isolation Co A");
    const b = await registerClient("Tenant Isolation Co B");

    const readB = await req(a.session, "GET", `/api/i9/companies/${b.companyId}`);
    expect(readB.status).toBe(403);

    const patchB = await req(a.session, "PATCH", `/api/i9/companies/${b.companyId}/business-intake`, { industry: "Hacked" });
    expect(patchB.status).toBe(403);

    await req(b.session, "POST", `/api/i9/companies/${b.companyId}/hiring-sites`, { name: "B Site", address: "1 B St" });
    const listB = await req(a.session, "GET", `/api/i9/companies/${b.companyId}/hiring-sites`);
    expect(listB.status).toBe(403);
  });
});

test.describe.serial("Onboarding lifecycle gate", () => {
  test("business intake stores data and masks the EIN", async () => {
    const { session, companyId } = await registerClient("Business Intake Test LLC");
    const patch = await req(session, "PATCH", `/api/i9/companies/${companyId}/business-intake`, {
      entityType: "LLC", industry: "Manufacturing", naicsSector: "336",
      totalEmployeeCount: 85, averageMonthlyHires: 4,
      federalContractorStatus: "no", alreadyEnrolledInEverify: "no",
      ein: "12-3456789", acknowledgedResponsibilities: true,
    });
    expect(patch.status).toBe(200);

    const get = await req(session, "GET", "/api/i9/companies/me");
    expect(get.status).toBe(200);
    expect(get.json.company.einEncrypted).toBeUndefined();
    expect(get.json.company.einMasked).toMatch(/6789$/);
    expect(get.json.company.einMasked).not.toContain("12-3456789");
  });

  test("only lbs_program_admin / lbs_intake_billing can change onboarding status, and only along valid transitions", async () => {
    const { session, companyId } = await registerClient("Onboarding Gate Test Co");

    const clientAttempt = await req(session, "POST", `/api/i9/companies/${companyId}/status`, { status: "plan_selected" });
    expect(clientAttempt.status).toBe(403);

    const skipAhead = await req(admin, "POST", `/api/i9/companies/${companyId}/status`, { status: "active" });
    expect(skipAhead.status, "cannot skip straight from lead_qualified to active").toBe(400);

    await advanceCompanyToActive(admin, companyId);

    const invalidNext = await req(admin, "POST", `/api/i9/companies/${companyId}/status`, { status: "lead_qualified" });
    expect(invalidNext.status, "active has no transition back to lead_qualified").toBe(400);
  });

  test("new-hire requests can be drafted before a company is active, but not submitted", async () => {
    const { session, companyId } = await registerClient("Submit Gate Test Co");
    const site = await req(session, "POST", `/api/i9/companies/${companyId}/hiring-sites`, { name: "Main Site", address: "1 Main St" });
    const siteId = site.json.site.id;

    const draft = await req(session, "POST", "/api/i9/new-hire-requests", {
      clientCompanyId: companyId, hiringSiteId: siteId,
      serviceRequested: "E-Verify case creation and processing", firstDayOfEmploymentForPay: "2026-08-10",
      attestJobOfferAccepted: true, attestNotPreScreening: true, attestEmployeeChoseDocuments: true,
      attestInformationAccurate: true, attestParticipatingHiringSite: true,
    });
    expect(draft.status).toBe(200);
    expect(draft.json.request.status).toBe("draft");

    const blockedSubmit = await req(session, "POST", `/api/i9/new-hire-requests/${draft.json.request.id}/submit`);
    expect(blockedSubmit.status).toBe(400);
    expect(blockedSubmit.json.error).toMatch(/not active/i);

    await advanceCompanyToActive(admin, companyId);
    const okSubmit = await req(session, "POST", `/api/i9/new-hire-requests/${draft.json.request.id}/submit`);
    expect(okSubmit.status).toBe(200);
  });
});

test.describe.serial("New-hire request workflow: attestations, drafts, and the case lifecycle", () => {
  let client: I9Session;
  let companyId: string;
  let siteId: string;
  let requestId: string;

  test("setup: active company with a hiring site", async () => {
    const reg = await registerClient("Full Workflow Test Co");
    client = reg.session;
    companyId = reg.companyId;
    const site = await req(client, "POST", `/api/i9/companies/${companyId}/hiring-sites`, { name: "Workflow Site", address: "1 Workflow Way" });
    siteId = site.json.site.id;
    await advanceCompanyToActive(admin, companyId);
  });

  test("a draft missing a required attestation cannot be submitted, but can be PATCHed and then submitted", async () => {
    const create = await req(client, "POST", "/api/i9/new-hire-requests", {
      clientCompanyId: companyId, hiringSiteId: siteId,
      serviceRequested: "Form I-9 administrative review", firstDayOfEmploymentForPay: "2026-08-11",
      attestJobOfferAccepted: true, attestNotPreScreening: true,
      attestEmployeeChoseDocuments: false, // deliberately incomplete
      attestInformationAccurate: true, attestParticipatingHiringSite: true,
    });
    expect(create.status).toBe(200);
    requestId = create.json.request.id;

    const blocked = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/submit`);
    expect(blocked.status).toBe(400);
    expect(blocked.json.error).toMatch(/employee chose/i);

    const patch = await req(client, "PATCH", `/api/i9/new-hire-requests/${requestId}`, { attestEmployeeChoseDocuments: true });
    expect(patch.status).toBe(200);
    expect(patch.json.request.attestEmployeeChoseDocuments).toBe(true);

    const submit = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/submit`);
    expect(submit.status).toBe(200);
  });

  test("a request can no longer be PATCHed once it's no longer a draft", async () => {
    const patch = await req(client, "PATCH", `/api/i9/new-hire-requests/${requestId}`, { clientNotes: "too late" });
    expect(patch.status).toBe(400);
    expect(patch.json.error).toMatch(/draft/i);
  });

  test("ready_for_case_creation requires an explicit second-review confirmation, and only from LBS staff", async () => {
    const noConfirm = await req(processor, "POST", `/api/i9/new-hire-requests/${requestId}/status`, { status: "ready_for_case_creation" });
    expect(noConfirm.status).toBe(400);
    expect(noConfirm.json.error).toMatch(/second review/i);

    const clientAttempt = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/status`, { status: "ready_for_case_creation", secondReviewConfirmed: true });
    expect([400, 403]).toContain(clientAttempt.status);

    const ok = await req(processor, "POST", `/api/i9/new-hire-requests/${requestId}/status`, { status: "ready_for_case_creation", secondReviewConfirmed: true });
    expect(ok.status).toBe(200);
  });

  test("recording a case result advances the request and stores the E-Verify-displayed deadline verbatim", async () => {
    const result = await req(processor, "POST", `/api/i9/new-hire-requests/${requestId}/case-result`, {
      everifyCaseNumber: "2026999888777",
      everifyInitialResult: "Employment Authorized",
      deadlineDate: "2026-08-14",
      deadlineType: "case_creation",
      notes: "Entered manually.",
    });
    expect(result.status).toBe(200);

    const get = await req(processor, "GET", `/api/i9/new-hire-requests/${requestId}`);
    expect(get.json.request.status).toBe("case_created");
    expect(get.json.request.everifyCaseNumber).toBe("2026999888777");

    const deadlines = await req(processor, "GET", `/api/i9/new-hire-requests/${requestId}/deadlines`);
    const deadline = deadlines.json.deadlines.find((d: any) => d.deadlineDate === "2026-08-14");
    expect(deadline, "deadline was stored").toBeTruthy();
    expect(deadline.source).toBe("everify_displayed");
  });

  test("government result recording requires LBS staff and no adverse-action-flavored blocking", async () => {
    const clientAttempt = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/status`, { status: "employment_authorized" });
    expect(clientAttempt.status).toBe(403);

    const ok = await req(processor, "POST", `/api/i9/new-hire-requests/${requestId}/status`, { status: "employment_authorized", note: "Confirmed in E-Verify." });
    expect(ok.status).toBe(200);
  });

  test("protected employee data: write, masked summary, role-gated reveal, audit trail", async () => {
    const write = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/protected-data`, {
      employeeName: "John Q. Testworker",
      employeeContact: "john@example.com",
      ssn: "123-45-6789",
      documentInfo: { listB: "Driver's License" },
    });
    expect(write.status).toBe(200);

    const billingCreds = await createInternalUser(admin, "lbs_intake_billing");
    const billing = await loginAs(billingCreds.email, billingCreds.password, "billing");
    const billingAttempt = await req(billing, "POST", `/api/i9/new-hire-requests/${requestId}/protected-data`, { employeeName: "Should Be Blocked", ssn: "111-22-3333" });
    expect(billingAttempt.status, "lbs_intake_billing is barred from writing protected employee data").toBe(403);

    const get = await req(client, "GET", `/api/i9/new-hire-requests/${requestId}`);
    const masked = get.json.protectedDataSummary?.ssnMasked;
    expect(masked).toContain("6789");
    expect(masked).not.toContain("123-45-6789");

    const clientReveal = await req(client, "POST", `/api/i9/new-hire-requests/${requestId}/protected-data/reveal`, { reason: "self reveal attempt" });
    expect(clientReveal.status).toBeGreaterThanOrEqual(401);
    expect(clientReveal.status).toBeLessThan(500);

    const reveal = await req(processor, "POST", `/api/i9/new-hire-requests/${requestId}/protected-data/reveal`, { reason: "Manual E-Verify case entry" });
    expect(reveal.status).toBe(200);
    expect(reveal.json.data.ssn).toBe("123-45-6789");

    const audit = await req(admin, "GET", "/api/i9/reports/audit");
    expect(audit.status).toBe(200);
    const revealEvent = audit.json.auditEvents.find((e: any) => e.action === "protected_data.reveal" && e.entityId === requestId);
    expect(revealEvent, "a protected_data.reveal audit event exists").toBeTruthy();
    expect(JSON.stringify(revealEvent.details ?? {})).not.toContain("123-45-6789");

    const processorAudit = await req(processor, "GET", "/api/i9/reports/audit");
    expect(processorAudit.status, "audit report is program-admin only").toBe(403);
  });

  test("the case work packet is retrievable by LBS staff only", async () => {
    const staffView = await req(processor, "GET", `/api/i9/new-hire-requests/${requestId}/work-packet`);
    expect(staffView.status).toBe(200);
    expect(staffView.json.workPacket).toBeTruthy();

    const clientView = await req(client, "GET", `/api/i9/new-hire-requests/${requestId}/work-packet`);
    expect(clientView.status).toBe(403);
  });
});

// ─── Cleanup ────────────────────────────────────────────────────────────────
// This file is the only spec that touches i9_* tables, so it's safe to wipe
// them (never the seeded catalog) once the suite finishes.
test.afterAll(async () => {
  if (!process.env.DATABASE_URL) return;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'i9\\_%' AND tablename NOT IN ('i9_service_plans', 'i9_add_ons')`
    );
    for (const { tablename } of rows) {
      await pool.query(`TRUNCATE TABLE "${tablename}" CASCADE`);
    }
  } catch (err: any) {
    console.warn(`[i9-workflow teardown] skipped (${err.message ?? err})`);
  } finally {
    await pool.end().catch(() => {});
  }
});
