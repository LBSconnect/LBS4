// ─────────────────────────────────────────────────────────────────────────────
// API routes for the New-Hire Verification & Form I-9 Support portal.
//
// Organized top-to-bottom by access level: public (unauthenticated lead
// capture + pricing) -> auth -> onboarding -> hiring sites -> new-hire
// request workflow -> protected employee data -> secure documents ->
// authorized-rep designations -> appointments -> notifications ->
// billing/usage -> reports -> retention -> security incidents.
// ─────────────────────────────────────────────────────────────────────────────

import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import {
  insertI9EmployerLeadSchema,
  insertI9ClientCompanySchema,
  insertI9HiringSiteSchema,
  insertI9NewHireRequestSchema,
  I9_ROLES,
  I9_CLIENT_COMPANY_STATUSES,
  I9_SECURE_DOCUMENT_TYPES,
  FORBIDDEN_SENSITIVE_FIELD_NAMES,
  type I9Role,
} from "@shared/i9Schema";
import * as store from "./i9Storage";
import {
  requireI9Auth,
  requireI9Role,
  requireI9TenantMatch,
  requireI9Csrf,
  i9RateLimit,
  establishI9Session,
  destroyI9Session,
  type I9AuthedRequest,
} from "./i9Auth";
import { verifyPassword, signDocumentToken, verifyDocumentToken, isProtectedDataEncryptionConfigured } from "./i9Security";
import { informationalCaseCreationTarget } from "./i9BusinessDays";
import { sendI9NotificationEmail, sendI9InternalNotificationEmail } from "./i9EmailService";
import { sendEmployerConsultationNotification } from "./emailService";

const PRIVATE_UPLOAD_DIR = path.join(process.cwd(), "server", "private-uploads", "i9");
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_UPLOAD_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
const DOCUMENT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5-minute signed download links

function ensureUploadDir() {
  fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

/** Express 5's route-param/query types allow `string | string[] | ParsedQs |
 *  ParsedQs[]` (to support repeated params like `/:id+` and nested query
 *  objects like `?a[b]=c`), none of which these routes use — every `:id`/
 *  query value here is always a single flat string. These narrow it back to
 *  a plain string so it can be passed to the storage layer. */
function pstr(v: unknown): string {
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  return typeof v === "string" ? v : "";
}
function pstrOpt(v: unknown): string | undefined {
  const s = pstr(v);
  return s === "" ? undefined : s;
}

/** Checked against the RAW request body before Zod parsing — Zod's default
 *  object parsing silently strips unknown keys, so checking post-parse data
 *  (as an earlier draft of this file did) never actually fires: the field is
 *  already gone by the time a refinement would see it. Checking the raw body
 *  turns an accidental/malicious sensitive-field submission into a visible
 *  400 instead of a silent no-op. */
function rejectForbiddenFields(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  for (const key of FORBIDDEN_SENSITIVE_FIELD_NAMES) {
    if (key in (body as Record<string, unknown>)) {
      return `Field '${key}' is not permitted on this form. Do not submit employee Form I-9 information, Social Security numbers, or other sensitive employee data here.`;
    }
  }
  return null;
}

/** Response helper: a consistent "this needs infra we don't have configured
 *  yet" gate, instead of collecting sensitive data insecurely. */
function secureConfigRequired(res: Response, missing: string[]) {
  return res.status(503).json({
    error: "Secure portal configuration required",
    detail: `This feature needs the following configured before it can safely handle protected employee data: ${missing.join(", ")}.`,
    missing,
  });
}

export function registerI9Routes(app: Express): void {
  // Migrations + catalog seed run on boot, mirroring corporateRoutes.ts.
  (async () => {
    try {
      await store.runI9Migrations();
      if (process.env.DATABASE_URL) await store.seedI9Catalog();
    } catch (err) {
      console.error("[i9-portal] Migrations/seed failed:", err);
    }
  })();

  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC — lead capture & pricing (no auth, no sensitive fields accepted)
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/leads", i9RateLimit("i9-lead", 15, 15 * 60 * 1000), async (req: Request, res: Response) => {
    try {
      const forbidden = rejectForbiddenFields(req.body);
      if (forbidden) return res.status(400).json({ error: forbidden });

      const captchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
      const { captchaToken, ...formData } = req.body;
      if (captchaSecretKey) {
        if (!captchaToken) return res.status(400).json({ error: "Captcha verification required" });
        const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${captchaSecretKey}&response=${captchaToken}`,
        });
        const verifyResult = (await verifyResponse.json()) as { success: boolean };
        if (!verifyResult.success) return res.status(400).json({ error: "Captcha verification failed" });
      }

      const parsed = insertI9EmployerLeadSchema.safeParse(formData);
      if (!parsed.success) return res.status(400).json({ error: "Invalid form data", details: parsed.error.flatten() });

      let lead;
      if (process.env.DATABASE_URL) {
        lead = await store.createI9EmployerLead(parsed.data);
      }
      // Always also notify by email, same as the existing employer-consultations
      // endpoint — keeps working even before DATABASE_URL is configured.
      await sendEmployerConsultationNotification({
        contactName: parsed.data.contactName,
        companyName: parsed.data.companyName,
        businessEmail: parsed.data.businessEmail,
        businessPhone: parsed.data.businessPhone,
        companyAddress: parsed.data.companyAddress,
        industry: parsed.data.industry,
        employeeCount: parsed.data.employeeCount,
        newHiresPerMonth: parsed.data.monthlyHires,
        hiringLocations: parsed.data.hiringLocations,
        desiredService: parsed.data.desiredService,
        preferredConsultationMethod: parsed.data.preferredConsultationMethod,
        message: parsed.data.message,
      });
      res.json({ success: true, message: "Consultation request received", leadId: lead?.id });
    } catch (err: any) {
      console.error("i9 lead error:", err.message);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.get("/api/i9/catalog", async (_req: Request, res: Response) => {
    try {
      if (!process.env.DATABASE_URL) return res.json({ plans: [], addOns: [], configured: false });
      const [plans, addOns] = await Promise.all([store.listI9ServicePlans(), store.listI9AddOns()]);
      res.json({ plans, addOns, configured: true });
    } catch {
      res.status(500).json({ error: "Failed to load catalog" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════

  const registerClientSchema = z.object({
    companyLegalName: z.string().min(1).max(200),
    contactName: z.string().min(1).max(200),
    email: z.string().email().max(200),
    password: z.string().min(12),
  });

  app.post("/api/i9/auth/register-client", i9RateLimit("i9-register", 10, 60 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    try {
      const parsed = registerClientSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      const existing = await store.getI9ClientUserByEmail(parsed.data.email);
      if (existing) return res.status(409).json({ error: "An account with this email already exists." });

      const company = await store.createI9ClientCompany({ legalBusinessName: parsed.data.companyLegalName });
      const user = await store.createI9ClientUser({
        clientCompanyId: company.id,
        email: parsed.data.email.toLowerCase(),
        password: parsed.data.password,
        fullName: parsed.data.contactName,
        role: "client_authorized_signer",
      });

      establishI9Session(req, res, user.id, "client_authorized_signer", company.id);
      await store.logI9Audit({ actorUserId: user.id, actorRole: "client_authorized_signer", action: "user.register", entityType: "ClientCompany", entityId: company.id, clientCompanyId: company.id, ipAddress: req.ip });
      res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, companyId: company.id });
    } catch (err: any) {
      console.error("i9 register error:", err.message);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/i9/auth/login", i9RateLimit("i9-login", 10, 15 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      const user = await store.getI9ClientUserByEmail(email);
      if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
        await store.logI9Audit({ action: "auth.login_failed", details: { email }, ipAddress: req.ip });
        return res.status(401).json({ error: "Invalid email or password." });
      }

      establishI9Session(req, res, user.id, user.role as I9Role, user.clientCompanyId);
      await store.touchI9ClientUserLogin(user.id);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.login", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, clientCompanyId: user.clientCompanyId } });
    } catch (err: any) {
      console.error("i9 login error:", err.message);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/i9/auth/logout", requireI9Auth, (req: I9AuthedRequest, res: Response) => {
    destroyI9Session(req, res, () => res.json({ success: true }));
  });

  app.get("/api/i9/auth/me", requireI9Auth, (req: I9AuthedRequest, res: Response) => {
    res.json({ user: req.i9User });
  });

  /** One-time bootstrap for the first Program Administrator account. Refuses
   *  once any admin exists implicitly (an admin should disable this route's
   *  secret after first use — see deliverables). */
  app.post("/api/i9/auth/bootstrap-admin", i9RateLimit("i9-bootstrap", 5, 60 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    const bootstrapSecret = process.env.I9_ADMIN_BOOTSTRAP_SECRET;
    if (!bootstrapSecret) return res.status(503).json({ error: "I9_ADMIN_BOOTSTRAP_SECRET is not configured." });
    const { secret, email, password, fullName } = req.body as { secret?: string; email?: string; password?: string; fullName?: string };
    if (secret !== bootstrapSecret) return res.status(401).json({ error: "Invalid bootstrap secret" });
    if (!email || !password || !fullName) return res.status(400).json({ error: "email, password, and fullName are required" });
    const existing = await store.getI9ClientUserByEmail(email);
    if (existing) return res.status(409).json({ error: "An account with this email already exists." });
    const user = await store.createI9ClientUser({ email: email.toLowerCase(), password, fullName, role: "lbs_program_admin" });
    await store.logI9Audit({ actorUserId: user.id, actorRole: "lbs_program_admin", action: "admin.bootstrap", ipAddress: req.ip });
    res.json({ success: true, userId: user.id });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: internal + client user management
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/admin/users", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const schema = z.object({
        clientCompanyId: z.string().optional(),
        email: z.string().email(),
        password: z.string().min(12),
        fullName: z.string().min(1).max(200),
        role: z.enum(I9_ROLES),
        assignedHiringSiteIds: z.array(z.string()).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      const user = await store.createI9ClientUser(parsed.data);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "user.create", entityType: "ClientUser", entityId: user.id, clientCompanyId: parsed.data.clientCompanyId, ipAddress: req.ip });
      res.json({ success: true, userId: user.id });
    } catch {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/i9/companies/:id/users", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const users = await store.listI9ClientUsersForCompany(pstr(req.params.id));
    res.json({ users: users.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt })) });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // ONBOARDING: ClientCompany + business intake
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/companies/me", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    if (!req.i9User!.clientCompanyId) return res.status(404).json({ error: "No company associated with this account." });
    const company = await store.getI9ClientCompany(req.i9User!.clientCompanyId);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { einEncrypted, ...safe } = company;
    res.json({ company: { ...safe, einMasked: store.maskedEin(company) } });
  });

  app.get("/api/i9/companies", requireI9Auth, requireI9Role("lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"), async (_req: I9AuthedRequest, res: Response) => {
    const companies = await store.listI9ClientCompanies();
    res.json({ companies: companies.map((c) => { const { einEncrypted, ...safe } = c; return { ...safe, einMasked: store.maskedEin(c) }; }) });
  });

  app.get("/api/i9/companies/:id", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const company = await store.getI9ClientCompany(pstr(req.params.id));
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { einEncrypted, ...safe } = company;
    res.json({ company: { ...safe, einMasked: store.maskedEin(company) } });
  });

  app.patch("/api/i9/companies/:id/business-intake", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    try {
      const parsed = insertI9ClientCompanySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      await store.updateI9ClientCompany(pstr(req.params.id), parsed.data);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "company.business_intake_update", entityType: "ClientCompany", entityId: pstr(req.params.id), clientCompanyId: pstr(req.params.id), ipAddress: req.ip });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to update business intake" });
    }
  });

  const ONBOARDING_TRANSITIONS: Record<string, string[]> = {
    lead_qualified: ["plan_selected"],
    plan_selected: ["lbs_agreement_pending"],
    lbs_agreement_pending: ["lbs_agreement_signed"],
    lbs_agreement_signed: ["setup_payment_pending"],
    setup_payment_pending: ["business_intake_pending"],
    business_intake_pending: ["ready_for_everify_enrollment"],
    ready_for_everify_enrollment: ["everify_enrollment_entered_by_lbs"],
    everify_enrollment_entered_by_lbs: ["mou_signature_pending"],
    mou_signature_pending: ["mou_signed"],
    mou_signed: ["hiring_sites_confirmed"],
    hiring_sites_confirmed: ["workflow_training_pending"],
    workflow_training_pending: ["active"],
    active: ["suspended", "offboarding"],
    suspended: ["active", "offboarding"],
    offboarding: ["terminated"],
    terminated: [],
  };

  app.post("/api/i9/companies/:id/status", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const { status } = req.body as { status?: string };
      if (!status || !I9_CLIENT_COMPANY_STATUSES.includes(status as any)) return res.status(400).json({ error: "Invalid status" });
      const company = await store.getI9ClientCompany(pstr(req.params.id));
      if (!company) return res.status(404).json({ error: "Company not found" });
      const allowed = ONBOARDING_TRANSITIONS[company.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Cannot move from '${company.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}.` });
      }
      await store.updateI9ClientCompanyStatus(pstr(req.params.id), status);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "company.status_change", entityType: "ClientCompany", entityId: pstr(req.params.id), clientCompanyId: pstr(req.params.id), details: { from: company.status, to: status }, ipAddress: req.ip });

      if (status === "active" && company.authorizedSignerEmail) {
        await sendI9NotificationEmail({ to: company.authorizedSignerEmail, recipientName: company.authorizedSignerName || "there", companyName: company.legalBusinessName, event: "client_activated" });
      }
      res.json({ success: true, status });
    } catch {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HIRING SITES
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/companies/:id/hiring-sites", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const parsed = insertI9HiringSiteSchema.safeParse({ ...req.body, clientCompanyId: pstr(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
    const site = await store.createI9HiringSite(parsed.data);
    res.json({ success: true, site });
  });

  app.get("/api/i9/companies/:id/hiring-sites", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    res.json({ sites: await store.listI9HiringSitesForCompany(pstr(req.params.id)) });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NEW-HIRE REQUEST WORKFLOW (metadata/attestations only — no employee PII)
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/new-hire-requests", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    try {
      const forbidden = rejectForbiddenFields(req.body);
      if (forbidden) return res.status(400).json({ error: forbidden });

      const parsed = insertI9NewHireRequestSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      const isInternal = req.i9User!.role.startsWith("lbs_");
      if (!isInternal && parsed.data.clientCompanyId !== req.i9User!.clientCompanyId) {
        return res.status(403).json({ error: "You do not have access to this company." });
      }

      const request = await store.createI9NewHireRequest(parsed.data, req.i9User!.id);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "new_hire_request.create_draft", entityType: "NewHireRequest", entityId: request.id, clientCompanyId: parsed.data.clientCompanyId, ipAddress: req.ip });
      res.json({ success: true, request });
    } catch (err: any) {
      console.error("create new-hire request error:", err.message);
      res.status(500).json({ error: "Failed to create request" });
    }
  });

  app.get("/api/i9/new-hire-requests", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    const role = req.i9User!.role;
    if (role === "lbs_case_processor") return res.json({ requests: await store.listI9NewHireRequestsAssignedTo(req.i9User!.id) });
    if (role === "lbs_program_admin" || role === "lbs_intake_billing") return res.json({ requests: await store.listAllI9NewHireRequests() });
    if (!req.i9User!.clientCompanyId) return res.json({ requests: [] });
    res.json({ requests: await store.listI9NewHireRequestsForCompany(req.i9User!.clientCompanyId) });
  });

  app.get("/api/i9/new-hire-requests/:id", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    const request = await store.getI9NewHireRequest(pstr(req.params.id));
    if (!request) return res.status(404).json({ error: "Not found" });
    const isInternal = req.i9User!.role.startsWith("lbs_");
    if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });
    const protectedSummary = process.env.DATABASE_URL ? await store.getI9ProtectedEmployeeDataMasked(pstr(req.params.id)) : null;
    res.json({ request, protectedDataSummary: protectedSummary, informationalCaseCreationTarget: informationalCaseCreationTarget(request.firstDayOfEmploymentForPay) });
  });

  app.post("/api/i9/new-hire-requests/:id/submit", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    try {
      const request = await store.getI9NewHireRequest(pstr(req.params.id));
      if (!request) return res.status(404).json({ error: "Not found" });
      const isInternal = req.i9User!.role.startsWith("lbs_");
      if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });

      const company = await store.getI9ClientCompany(request.clientCompanyId);
      if (!company || company.status !== "active") {
        return res.status(400).json({ error: "This client company is not active yet. New-hire requests can be drafted, but not submitted, until onboarding is complete." });
      }

      const validation = store.validateI9StatusTransition(request, "submitted", req.i9User!.role);
      if (!validation.ok) return res.status(400).json({ error: validation.reason });

      await store.updateI9NewHireRequestStatus(pstr(req.params.id), "submitted", req.i9User!.id);
      await store.createI9Notification({ clientCompanyId: request.clientCompanyId, event: "new_hire_request_submitted", relatedEntityType: "NewHireRequest", relatedEntityId: request.id, inPortalMessage: `New-hire request ${request.internalRequestNumber} was submitted and is awaiting LBS review.` });
      await sendI9InternalNotificationEmail({ companyName: company.legalBusinessName, event: "new_hire_request_submitted", detail: `Request ${request.internalRequestNumber}` });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  app.post("/api/i9/new-hire-requests/:id/assign", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin"), async (req: I9AuthedRequest, res: Response) => {
    const { processorUserId } = req.body as { processorUserId?: string };
    if (!processorUserId) return res.status(400).json({ error: "processorUserId is required" });
    const request = await store.getI9NewHireRequest(pstr(req.params.id));
    if (!request) return res.status(404).json({ error: "Not found" });
    await store.updateI9NewHireRequestStatus(pstr(req.params.id), "assigned", req.i9User!.id, `Assigned to processor ${processorUserId}`);
    res.json({ success: true });
  });

  app.post("/api/i9/new-hire-requests/:id/status", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_case_processor"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const { status, note, secondReviewConfirmed } = req.body as { status?: string; note?: string; secondReviewConfirmed?: boolean };
      if (!status) return res.status(400).json({ error: "status is required" });
      const request = await store.getI9NewHireRequest(pstr(req.params.id));
      if (!request) return res.status(404).json({ error: "Not found" });

      const validation = store.validateI9StatusTransition(request, status, req.i9User!.role, { secondReviewConfirmed });
      if (!validation.ok) return res.status(400).json({ error: validation.reason });

      await store.updateI9NewHireRequestStatus(pstr(req.params.id), status, req.i9User!.id, note);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "new_hire_request.status_change", entityType: "NewHireRequest", entityId: pstr(req.params.id), clientCompanyId: request.clientCompanyId, details: { from: request.status, to: status }, ipAddress: req.ip });
      res.json({ success: true, status });
    } catch {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.post("/api/i9/new-hire-requests/:id/case-result", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_case_processor"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const schema = z.object({
        everifyCaseNumber: z.string().min(1).max(60),
        everifyInitialResult: z.string().min(1).max(60),
        deadlineDate: z.string().max(20).optional(),
        deadlineType: z.string().max(60).optional(),
        notes: z.string().max(4000).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      const request = await store.getI9NewHireRequest(pstr(req.params.id));
      if (!request) return res.status(404).json({ error: "Not found" });

      await store.recordI9CaseResult(pstr(req.params.id), parsed.data, req.i9User!.id, parsed.data.notes);

      if (parsed.data.deadlineDate) {
        await store.recordI9CaseDeadline({
          newHireRequestId: pstr(req.params.id),
          deadlineType: parsed.data.deadlineType || "case_creation",
          deadlineDate: parsed.data.deadlineDate,
          source: "everify_displayed",
          enteredByUserId: req.i9User!.id,
        });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("case-result error:", err.message);
      res.status(500).json({ error: "Failed to record case result" });
    }
  });

  app.get("/api/i9/new-hire-requests/:id/activity", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    res.json({ activity: await store.listI9CaseActivity(pstr(req.params.id)) });
  });

  app.get("/api/i9/new-hire-requests/:id/deadlines", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    res.json({ deadlines: await store.listI9CaseDeadlines(pstr(req.params.id)) });
  });

  /** Case work packet: everything a processor needs to manually create the
   *  case in E-Verify, with each value's source labeled. */
  app.get("/api/i9/new-hire-requests/:id/work-packet", requireI9Auth, requireI9Role("lbs_program_admin", "lbs_case_processor"), async (req: I9AuthedRequest, res: Response) => {
    const request = await store.getI9NewHireRequest(pstr(req.params.id));
    if (!request) return res.status(404).json({ error: "Not found" });
    const company = await store.getI9ClientCompany(request.clientCompanyId);
    const protectedSummary = process.env.DATABASE_URL ? await store.getI9ProtectedEmployeeDataMasked(pstr(req.params.id)) : null;

    await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "work_packet.view", entityType: "NewHireRequest", entityId: pstr(req.params.id), clientCompanyId: request.clientCompanyId, ipAddress: req.ip });

    res.json({
      workPacket: {
        clientCompanyName: { value: company?.legalBusinessName, source: "ClientCompany.legalBusinessName" },
        internalRequestNumber: { value: request.internalRequestNumber, source: "NewHireRequest.internalRequestNumber" },
        hiringSiteId: { value: request.hiringSiteId, source: "NewHireRequest.hiringSiteId" },
        firstDayOfEmploymentForPay: { value: request.firstDayOfEmploymentForPay, source: "NewHireRequest.firstDayOfEmploymentForPay (client-submitted)" },
        informationalTarget: { value: informationalCaseCreationTarget(request.firstDayOfEmploymentForPay), source: "Computed — 3 US business days after first day of pay. Informational only, not a legal deadline." },
        formI9Section1Date: { value: request.formI9Section1CompletedDate, source: "NewHireRequest.formI9Section1CompletedDate (client-submitted)" },
        formI9Section2Date: { value: request.formI9Section2CompletedDate, source: "NewHireRequest.formI9Section2CompletedDate (client-submitted)" },
        attestations: {
          value: {
            jobOfferAccepted: request.attestJobOfferAccepted,
            notPreScreening: request.attestNotPreScreening,
            employeeChoseDocuments: request.attestEmployeeChoseDocuments,
            listBHasPhoto: request.attestListBHasPhoto,
            informationAccurate: request.attestInformationAccurate,
          },
          source: "NewHireRequest attestation fields (client-submitted)",
        },
        employeeName: { value: protectedSummary?.employeeName ?? "(secure workflow not configured)", source: "ProtectedEmployeeData.employeeName (encrypted at rest)" },
        ssnMasked: { value: protectedSummary?.ssnMasked ?? null, source: "ProtectedEmployeeData.ssnEncrypted — masked; use the audited reveal action to view in full" },
        status: { value: request.status, source: "NewHireRequest.status" },
      },
      everifyExternalUrl: "https://everify.uscis.gov/everify/",
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // PROTECTED EMPLOYEE DATA — separate, encrypted, audited
  // ═══════════════════════════════════════════════════════════════════════

  const protectedDataInputSchema = z.object({
    employeeName: z.string().min(1).max(200),
    employeeContact: z.string().max(300).optional(),
    ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, "SSN must be 9 digits").optional(),
    documentInfo: z.record(z.string(), z.unknown()).optional(),
  });

  app.post("/api/i9/new-hire-requests/:id/protected-data", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    if (!store.isI9SecureWorkflowAvailable()) {
      return secureConfigRequired(res, !process.env.DATABASE_URL ? ["DATABASE_URL", "PROTECTED_DATA_ENCRYPTION_KEY"] : ["PROTECTED_DATA_ENCRYPTION_KEY"]);
    }
    try {
      const request = await store.getI9NewHireRequest(pstr(req.params.id));
      if (!request) return res.status(404).json({ error: "Not found" });
      const isInternal = req.i9User!.role.startsWith("lbs_");
      if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });
      if (req.i9User!.role === "lbs_intake_billing") return res.status(403).json({ error: "Intake/Billing users cannot enter protected employee data." });

      const parsed = protectedDataInputSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      await store.createOrUpdateI9ProtectedEmployeeData(pstr(req.params.id), parsed.data, req.i9User!.id);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "protected_data.write", entityType: "NewHireRequest", entityId: pstr(req.params.id), clientCompanyId: request.clientCompanyId, ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("protected-data write error:", err.message);
      res.status(500).json({ error: "Failed to save protected employee data" });
    }
  });

  /** Full reveal — narrow, role-checked, always audited. */
  app.post("/api/i9/new-hire-requests/:id/protected-data/reveal", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_case_processor"), async (req: I9AuthedRequest, res: Response) => {
    if (!store.isI9SecureWorkflowAvailable()) return secureConfigRequired(res, ["PROTECTED_DATA_ENCRYPTION_KEY"]);
    try {
      const { reason } = req.body as { reason?: string };
      if (!reason || reason.trim().length < 5) return res.status(400).json({ error: "A brief reason is required to reveal protected employee data (recorded in the audit log)." });
      const data = await store.revealI9ProtectedEmployeeData(pstr(req.params.id));
      if (!data) return res.status(404).json({ error: "No protected data on file for this request." });
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "protected_data.reveal", entityType: "NewHireRequest", entityId: pstr(req.params.id), details: { reason }, ipAddress: req.ip });
      res.json({ data });
    } catch {
      res.status(500).json({ error: "Failed to reveal protected data" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SECURE DOCUMENTS — private disk storage + short-lived signed tokens
  // ═══════════════════════════════════════════════════════════════════════

  const uploadSchema = z.object({
    clientCompanyId: z.string().min(1),
    relatedNewHireRequestId: z.string().optional(),
    documentType: z.enum(I9_SECURE_DOCUMENT_TYPES),
    filename: z.string().min(1).max(300),
    mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
    base64Content: z.string().min(1),
  });

  app.post("/api/i9/documents/upload", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => (req.body as any)?.clientCompanyId), async (req: I9AuthedRequest, res: Response) => {
    try {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid upload", details: parsed.error.flatten() });

      const buffer = Buffer.from(parsed.data.base64Content, "base64");
      if (buffer.length > MAX_UPLOAD_BYTES) return res.status(413).json({ error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` });
      if (buffer.length === 0) return res.status(400).json({ error: "Empty file" });

      ensureUploadDir();
      const id = crypto.randomUUID();
      const ext = parsed.data.mimeType === "application/pdf" ? "pdf" : parsed.data.mimeType === "image/png" ? "png" : "jpg";
      const storagePath = path.join(PRIVATE_UPLOAD_DIR, `${id}.${ext}`);
      fs.writeFileSync(storagePath, buffer, { mode: 0o600 });

      const doc = await store.createI9SecureDocument({
        id,
        clientCompanyId: parsed.data.clientCompanyId,
        relatedNewHireRequestId: parsed.data.relatedNewHireRequestId,
        documentType: parsed.data.documentType,
        originalFilename: parsed.data.filename,
        storagePath,
        mimeType: parsed.data.mimeType,
        fileSizeBytes: buffer.length,
        uploadedByUserId: req.i9User!.id,
      });

      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "secure_document.upload", entityType: "SecureDocument", entityId: doc.id, clientCompanyId: parsed.data.clientCompanyId, details: { documentType: parsed.data.documentType, malwareScanStatus: "not_scanned" }, ipAddress: req.ip });
      res.json({ success: true, documentId: doc.id, malwareScanStatus: "not_scanned", warning: "No malware-scanning provider is configured for this deployment — see deliverables report." });
    } catch (err: any) {
      console.error("document upload error:", err.message);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  app.get("/api/i9/documents/:id/token", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    const doc = await store.getI9SecureDocument(pstr(req.params.id));
    if (!doc || doc.deletedAt) return res.status(404).json({ error: "Not found" });
    const isInternal = req.i9User!.role.startsWith("lbs_");
    if (!isInternal && doc.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });

    const expiresAt = Date.now() + DOCUMENT_TOKEN_TTL_MS;
    const token = signDocumentToken(doc.id, expiresAt);
    await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "secure_document.token_issued", entityType: "SecureDocument", entityId: doc.id, clientCompanyId: doc.clientCompanyId, ipAddress: req.ip });
    res.json({ token, expiresAt, downloadUrl: `/api/i9/documents/${doc.id}/download?token=${encodeURIComponent(token)}` });
  });

  app.get("/api/i9/documents/:id/download", async (req: Request, res: Response) => {
    // Authenticated by signed token rather than session, so this link can be
    // opened directly (e.g. a portal button that opens a new tab) without
    // depending on cookie context. Token is single-purpose, 5-minute-lived,
    // and bound to this exact document ID.
    const token = pstrOpt(req.query.token);
    if (!token) return res.status(401).json({ error: "Missing token" });
    const verification = verifyDocumentToken(token, pstr(req.params.id));
    if (!verification.valid) return res.status(401).json({ error: "Invalid or expired download link", reason: verification.reason });

    const doc = await store.getI9SecureDocument(pstr(req.params.id));
    if (!doc || doc.deletedAt || !fs.existsSync(doc.storagePath)) return res.status(404).json({ error: "Not found" });

    await store.logI9Audit({ action: "secure_document.download", entityType: "SecureDocument", entityId: doc.id, clientCompanyId: doc.clientCompanyId, ipAddress: req.ip });
    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.originalFilename.replace(/"/g, "")}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(doc.storagePath).pipe(res);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // AUTHORIZED REPRESENTATIVE DESIGNATION
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/authorized-rep-designations", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => (req.body as any)?.clientCompanyId), async (req: I9AuthedRequest, res: Response) => {
    const schema = z.object({
      clientCompanyId: z.string().min(1),
      employerLegalName: z.string().min(1).max(200),
      employeeNameOrClass: z.string().min(1).max(300),
      designatedLbsRepresentativeName: z.string().min(1).max(200),
      scopeOfAuthorization: z.string().min(1).max(2000),
      appointmentType: z.enum(["in_office", "mobile"]),
      location: z.string().min(1).max(300),
      effectiveDate: z.string().min(1).max(20),
      employerAcknowledgedResponsibility: z.boolean(),
      signedByName: z.string().max(200).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
    if (!parsed.data.employerAcknowledgedResponsibility) return res.status(400).json({ error: "Employer must acknowledge responsibility for Form I-9 compliance and the acts of its representative." });

    const designation = await store.createI9AuthorizedRepDesignation(parsed.data);
    res.json({ success: true, designation });
  });

  app.get("/api/i9/authorized-rep-designations", requireI9Auth, requireI9TenantMatch((req) => pstrOpt(req.query.companyId)), async (req: I9AuthedRequest, res: Response) => {
    const companyId = pstrOpt(req.query.companyId);
    if (!companyId) return res.status(400).json({ error: "companyId is required" });
    res.json({ designations: await store.listI9AuthorizedRepDesignationsForCompany(companyId) });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // APPOINTMENTS (in-office / mobile document examination, hiring events)
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/appointments", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => (req.body as any)?.clientCompanyId), async (req: I9AuthedRequest, res: Response) => {
    const schema = z.object({
      clientCompanyId: z.string().min(1),
      hiringSiteId: z.string().optional(),
      appointmentType: z.enum(["in_office_examination", "mobile_examination", "hiring_event"]),
      authorizedRepDesignationId: z.string().optional(),
      employeeCountEstimate: z.number().int().positive().optional(),
      i9Notes: z.string().max(2000).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
    const appointment = await store.createI9Appointment(parsed.data);
    res.json({ success: true, appointment });
  });

  app.patch("/api/i9/appointments/:id/confirm", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_case_processor"), async (req: I9AuthedRequest, res: Response) => {
    const appt = await store.getI9Appointment(pstr(req.params.id));
    if (!appt) return res.status(404).json({ error: "Not found" });
    if ((appt.appointmentType === "in_office_examination" || appt.appointmentType === "mobile_examination") && !appt.authorizedRepDesignationId) {
      return res.status(400).json({ error: "A written authorized-representative designation is required before this appointment can be confirmed." });
    }
    await store.confirmI9Appointment(pstr(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/i9/appointments", requireI9Auth, requireI9TenantMatch((req) => (pstrOpt(req.query.companyId)) ?? undefined), async (req: I9AuthedRequest, res: Response) => {
    const companyId = pstr(req.query.companyId) || req.i9User!.clientCompanyId;
    if (!companyId) return res.json({ appointments: [] });
    res.json({ appointments: await store.listI9AppointmentsForCompany(companyId) });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/notifications", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    res.json({ notifications: await store.listI9NotificationsForUser(req.i9User!.id) });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // USAGE / BILLING
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/usage/pending-approval", requireI9Auth, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (_req: I9AuthedRequest, res: Response) => {
    res.json({ usage: await store.listI9UsageRecordsPendingApproval() });
  });

  app.post("/api/i9/usage/:id/approve", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin"), async (req: I9AuthedRequest, res: Response) => {
    await store.approveI9UsageRecord(pstr(req.params.id), req.i9User!.id);
    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // REPORTS (least-privilege — internal reference numbers only)
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/reports/monthly-case-volume", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    const isInternal = req.i9User!.role.startsWith("lbs_");
    const companyId = isInternal ? (pstrOpt(req.query.companyId)) : req.i9User!.clientCompanyId ?? undefined;
    res.json({ report: await store.getI9MonthlyCaseVolumeReport(companyId) });
  });

  app.get("/api/i9/reports/by-hiring-site", requireI9Auth, requireI9TenantMatch((req) => pstrOpt(req.query.companyId)), async (req: I9AuthedRequest, res: Response) => {
    const companyId = pstr(req.query.companyId) || req.i9User!.clientCompanyId;
    if (!companyId) return res.status(400).json({ error: "companyId is required" });
    res.json({ report: await store.getI9RequestsByHiringSite(companyId) });
  });

  app.get("/api/i9/reports/audit", requireI9Auth, requireI9Role("lbs_program_admin"), async (_req: I9AuthedRequest, res: Response) => {
    res.json({ auditEvents: await store.listI9AuditEvents() });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // RETENTION
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/companies/:id/retention/export", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin"), async (req: I9AuthedRequest, res: Response) => {
    const { reason } = req.body as { reason?: string };
    await store.createI9RetentionAction({ clientCompanyId: pstr(req.params.id), actionType: "export", performedByUserId: req.i9User!.id, reason: reason?.slice(0, 2000) });
    const [requests, hiringSites] = await Promise.all([
      store.listI9NewHireRequestsForCompany(pstr(req.params.id)),
      store.listI9HiringSitesForCompany(pstr(req.params.id)),
    ]);
    res.json({ success: true, export: { requests: requests.map(({ id, internalRequestNumber, status, createdAt }) => ({ id, internalRequestNumber, status, createdAt })), hiringSites } });
  });

  app.post("/api/i9/documents/:id/retention/delete", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin"), async (req: I9AuthedRequest, res: Response) => {
    const { reason } = req.body as { reason?: string };
    if (!reason) return res.status(400).json({ error: "A reason is required to delete a secure document." });
    const doc = await store.getI9SecureDocument(pstr(req.params.id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (fs.existsSync(doc.storagePath)) fs.unlinkSync(doc.storagePath);
    await store.softDeleteI9SecureDocument(pstr(req.params.id));
    await store.createI9RetentionAction({ clientCompanyId: doc.clientCompanyId, actionType: "delete", targetEntityType: "SecureDocument", targetEntityId: doc.id, performedByUserId: req.i9User!.id, reason });
    await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "secure_document.delete", entityType: "SecureDocument", entityId: doc.id, clientCompanyId: doc.clientCompanyId, details: { reason }, ipAddress: req.ip });
    res.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // SECURITY INCIDENTS
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/security-incidents", requireI9Auth, requireI9Role("lbs_program_admin"), async (_req: I9AuthedRequest, res: Response) => {
    res.json({ incidents: await store.listI9SecurityIncidents() });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Diagnostics — lets the client UI know what's configured without leaking
  // secrets, so it can show the right "secure portal configuration required"
  // messaging instead of a confusing generic error.
  // ═══════════════════════════════════════════════════════════════════════

  app.get("/api/i9/system-status", (_req: Request, res: Response) => {
    res.json({
      databaseConfigured: !!process.env.DATABASE_URL,
      protectedDataEncryptionConfigured: isProtectedDataEncryptionConfigured(),
      secureWorkflowAvailable: store.isI9SecureWorkflowAvailable(),
      mfaAvailable: false, // no MFA provider configured — see deliverables
      malwareScanningAvailable: false, // no scanning provider configured — see deliverables
      eSignatureAvailable: false, // no e-signature provider configured — see deliverables
    });
  });
}
