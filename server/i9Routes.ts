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
  type I9ClientCompany,
  type I9NotificationEvent,
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
import {
  verifyPassword,
  signDocumentToken,
  verifyDocumentToken,
  isProtectedDataEncryptionConfigured,
  generatePasswordResetToken,
  hashPasswordResetToken,
  generateTotpSecret,
  totpProvisioningUri,
  verifyTotpCode,
  matchTotpCodeStep,
  signMfaChallengeToken,
  verifyMfaChallengeToken,
  encryptToColumn,
  decryptFromColumn,
} from "./i9Security";
import { informationalCaseCreationTarget } from "./i9BusinessDays";
import { sendI9NotificationEmail, sendI9InternalNotificationEmail, sendI9PasswordResetEmail } from "./i9EmailService";
import { sendEmployerConsultationNotification } from "./emailService";
import { syncI9StripeProducts } from "./i9StripeSync";
import { getUncachableStripeClient } from "./stripeClient";

const PRIVATE_UPLOAD_DIR = path.join(process.cwd(), "server", "private-uploads", "i9");
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_UPLOAD_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
const DOCUMENT_TOKEN_TTL_MS = 5 * 60 * 1000; // 5-minute signed download links

function ensureUploadDir() {
  fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });
}

/** The upload route's `mimeType` field is client-declared metadata, not a
 *  server-verified fact — a caller could send `application/pdf` alongside
 *  bytes that are actually an HTML/script payload or an executable. This
 *  checks the file's real magic bytes against the declared type so upload
 *  validation isn't trusting the client's word for what the file is. Download
 *  already forces `Content-Disposition: attachment` + `X-Content-Type-Options:
 *  nosniff` (belt-and-suspenders against a browser executing served content),
 *  but rejecting a mismatched file at upload time is the stronger control. */
export function magicBytesMatchMimeType(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;
  switch (mimeType) {
    case "application/pdf":
      return buffer.subarray(0, 4).toString("latin1") === "%PDF";
    case "image/png":
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    default:
      return false;
  }
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

/** Generates the LBS <-> Client commercial-services agreement as plain HTML
 *  for download/print — never a live e-signature flow (none is configured;
 *  see deliverables doc). This is filled-in *text*, not a signature: the
 *  actual signature is captured on a physically- or externally-signed copy,
 *  uploaded separately and linked via recordI9AgreementSignedCopy. Contains
 *  no employee data — company-level fields only. Business document; legal
 *  review is recommended before this text is used with a real client. */
function renderI9AgreementHtml(company: I9ClientCompany): string {
  const today = new Date().toISOString().slice(0, 10);
  const esc = (v: string | null | undefined) => (v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>LBS Employer-Support Services Agreement (Draft)</title></head>
<body style="font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; line-height: 1.6; color: #1a1a1a;">
  <p style="text-align:center; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #b45309; border: 1px solid #f59e0b; background: #fffbeb; padding: 0.75rem;">
    Draft generated ${today} — business document, legal review recommended before use. Not a substitute for legal advice.
  </p>
  <h1 style="font-size: 1.5rem;">Employer-Support Services Agreement</h1>
  <p>This Agreement is entered into between <strong>Linton Business Solutions LLC</strong> ("LBS"), 616 FM 1960 Road West, Suite 101, Houston, Texas 77090, and <strong>${esc(company.legalBusinessName)}</strong>${company.dba ? ` (d/b/a ${esc(company.dba)})` : ""} ("Client").</p>
  <h2 style="font-size: 1.1rem;">1. Services</h2>
  <p>LBS will provide administrative Form I-9 and E-Verify case-management support services to Client as an E-Verify Employer Agent, per the plan and add-on services selected by Client through LBS's client portal. LBS is not the U.S. Department of Homeland Security, U.S. Citizenship and Immigration Services, or E-Verify, and does not provide immigration legal advice, determine immigration status, or make employment decisions on Client's behalf.</p>
  <h2 style="font-size: 1.1rem;">2. Client Responsibilities</h2>
  <p>Client remains responsible for its own Form I-9 and E-Verify compliance obligations, for the accuracy of information it submits, and for all employment decisions. LBS's services are administrative support only.</p>
  <h2 style="font-size: 1.1rem;">3. E-Verify Memorandum of Understanding</h2>
  <p>Client acknowledges that any E-Verify Memorandum of Understanding is executed directly between Client and the federal government outside of LBS's website, and that this Agreement does not itself constitute or replace that MOU.</p>
  <h2 style="font-size: 1.1rem;">4. Fees</h2>
  <p>Client agrees to pay the fees associated with its selected plan and any requested add-on services, as published by LBS and agreed to at the time of purchase.</p>
  <h2 style="font-size: 1.1rem;">5. Term and Termination</h2>
  <p>This Agreement remains in effect until terminated by either party in accordance with LBS's standard offboarding process.</p>
  <p style="margin-top: 3rem;">Authorized Signer: ${esc(company.authorizedSignerName)}${company.authorizedSignerTitle ? `, ${esc(company.authorizedSignerTitle)}` : ""}<br/>
  Date: ______________________</p>
</body></html>`;
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
      if (process.env.DATABASE_URL && process.env.STRIPE_SECRET_KEY) {
        await syncI9StripeProducts().catch((err) => console.error("[i9-portal] Stripe catalog sync failed:", err.message));
      }
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
  // BILLING — plan checkout via the existing Stripe integration. Never puts
  // sensitive employee data in metadata/invoice descriptions — only
  // company/plan identifiers.
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/companies/:id/checkout", requireI9Auth, requireI9Csrf, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY) return secureConfigRequired(res, ["STRIPE_SECRET_KEY"]);
    try {
      const { servicePlanId } = req.body as { servicePlanId?: string };
      if (!servicePlanId) return res.status(400).json({ error: "servicePlanId is required" });

      const company = await store.getI9ClientCompany(pstr(req.params.id));
      if (!company) return res.status(404).json({ error: "Company not found" });
      const plan = await store.getI9ServicePlan(servicePlanId);
      if (!plan || !plan.isActive) return res.status(404).json({ error: "Plan not found" });
      if (!plan.stripeMonthlyPriceId) {
        return secureConfigRequired(res, ["Stripe catalog sync has not run for this plan yet"]);
      }

      const existingSub = await store.getLatestI9SubscriptionForCompany(pstr(req.params.id));
      const setupFeeAlreadyPaid = existingSub?.setupFeePaid === true;

      const pending = await store.createI9PendingSubscription(pstr(req.params.id), servicePlanId);

      const lineItems: { price: string; quantity: number }[] = [{ price: plan.stripeMonthlyPriceId, quantity: 1 }];
      if (plan.stripeSetupPriceId && !setupFeeAlreadyPaid) {
        lineItems.push({ price: plan.stripeSetupPriceId, quantity: 1 });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = process.env.BASE_URL || "https://www.lbs4.com";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: company.billingContactEmail || company.authorizedSignerEmail || undefined,
        line_items: lineItems,
        // Company/plan identifiers only — never employee or case data.
        metadata: { app: "lbs4", i9SubscriptionId: pending.id, i9ClientCompanyId: company.id, i9ServicePlanId: plan.id, i9SetupFeeIncluded: String(!setupFeeAlreadyPaid) },
        success_url: `${baseUrl}/employer-services/new-hire-verification/portal?checkout=success`,
        cancel_url: `${baseUrl}/employer-services/new-hire-verification/portal/billing?checkout=cancelled`,
      });

      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "billing.checkout_created", entityType: "ClientCompany", entityId: company.id, clientCompanyId: company.id, details: { servicePlanId, sessionId: session.id }, ipAddress: req.ip });
      res.json({ success: true, checkoutUrl: session.url });
    } catch (err: any) {
      console.error("i9 checkout error:", err.message);
      res.status(500).json({ error: "Failed to start checkout" });
    }
  });

  app.get("/api/i9/companies/:id/subscription", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const sub = await store.getLatestI9SubscriptionForCompany(pstr(req.params.id));
    res.json({ subscription: sub });
  });

  // ── Metered add-ons ──────────────────────────────────────────────────────
  // Attaching and recording usage are both LBS-staff-only, deliberately —
  // this is administrative billing action tied to a real service LBS staff
  // performed, not a client self-service purchase flow.

  app.get("/api/i9/companies/:id/add-ons", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const subscription = await store.getLatestI9SubscriptionForCompany(pstr(req.params.id));
    const attached = subscription ? await store.listI9SubscriptionAddOns(subscription.id) : [];
    res.json({ subscription, attached });
  });

  app.post("/api/i9/companies/:id/add-ons/:addOnId/attach", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY) return secureConfigRequired(res, ["STRIPE_SECRET_KEY"]);
    try {
      const addOn = await store.getI9AddOn(pstr(req.params.addOnId));
      if (!addOn) return res.status(404).json({ error: "Add-on not found" });
      if (addOn.priceUnit === "flat") return res.status(400).json({ error: "This add-on is flat-priced and isn't attached to a subscription for metered billing." });
      if (!addOn.stripePriceId) return res.status(503).json({ error: "This add-on's Stripe price hasn't synced yet. Try again shortly." });

      const subscription = await store.getLatestI9SubscriptionForCompany(pstr(req.params.id));
      if (!subscription || subscription.status !== "active" || !subscription.stripeSubscriptionId) {
        return res.status(400).json({ error: "This company needs an active subscription before an add-on can be attached." });
      }
      const already = await store.getI9SubscriptionAddOn(subscription.id, addOn.id);
      if (already) return res.status(409).json({ error: "This add-on is already attached to the subscription." });

      const stripe = await getUncachableStripeClient();
      const item = await stripe.subscriptionItems.create({ subscription: subscription.stripeSubscriptionId, price: addOn.stripePriceId });
      const row = await store.attachI9SubscriptionAddOn(subscription.id, addOn.id, item.id);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "billing.addon_attached", entityType: "SubscriptionAddOn", entityId: row.id, clientCompanyId: pstr(req.params.id), details: { addOnId: addOn.id, addOnName: addOn.name }, ipAddress: req.ip });
      res.json({ success: true, subscriptionAddOn: row });
    } catch (err: any) {
      console.error("i9 add-on attach error:", err.message);
      res.status(500).json({ error: "Failed to attach add-on" });
    }
  });

  app.post("/api/i9/companies/:id/add-ons/:addOnId/usage", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    if (!process.env.STRIPE_SECRET_KEY) return secureConfigRequired(res, ["STRIPE_SECRET_KEY"]);
    try {
      const schema = z.object({ quantity: z.number().int().min(1).max(1000), note: z.string().max(500).optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "A positive integer quantity is required" });

      const addOn = await store.getI9AddOn(pstr(req.params.addOnId));
      if (!addOn) return res.status(404).json({ error: "Add-on not found" });
      const subscription = await store.getLatestI9SubscriptionForCompany(pstr(req.params.id));
      if (!subscription) return res.status(400).json({ error: "This company has no subscription on file." });
      const attached = await store.getI9SubscriptionAddOn(subscription.id, addOn.id);
      if (!attached) return res.status(400).json({ error: "This add-on isn't attached to the company's subscription yet." });
      if (!subscription.stripeCustomerId) return res.status(400).json({ error: "This subscription has no Stripe customer on file." });

      const stripe = await getUncachableStripeClient();
      await stripe.billing.meterEvents.create({
        event_name: `i9-addon-usage-${addOn.slug}`,
        payload: { stripe_customer_id: subscription.stripeCustomerId, value: String(parsed.data.quantity) },
      });
      await store.logI9Audit({
        actorUserId: req.i9User!.id,
        actorRole: req.i9User!.role,
        action: "billing.addon_usage_recorded",
        entityType: "SubscriptionAddOn",
        entityId: attached.id,
        clientCompanyId: pstr(req.params.id),
        details: { addOnId: addOn.id, addOnName: addOn.name, quantity: parsed.data.quantity, note: parsed.data.note },
        ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("i9 add-on usage error:", err.message);
      res.status(500).json({ error: "Failed to record usage" });
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

      await establishI9Session(req, res, user.id, "client_authorized_signer", company.id);
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

      if (user.mfaEnabled) {
        // Password is correct, but no session is established yet — only a
        // short-lived challenge token proving this much, redeemable at
        // /auth/mfa/verify with a valid TOTP code.
        const mfaToken = signMfaChallengeToken(user.id, Date.now() + 5 * 60 * 1000);
        await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.password_verified_awaiting_mfa", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
        return res.json({ success: true, mfaRequired: true, mfaToken });
      }

      await establishI9Session(req, res, user.id, user.role as I9Role, user.clientCompanyId);
      await store.touchI9ClientUserLogin(user.id);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.login", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, clientCompanyId: user.clientCompanyId } });
    } catch (err: any) {
      console.error("i9 login error:", err.message);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/i9/auth/mfa/verify", i9RateLimit("i9-mfa-verify", 10, 15 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    try {
      const { mfaToken, code } = req.body as { mfaToken?: string; code?: string };
      if (!mfaToken || !code) return res.status(400).json({ error: "mfaToken and code are required" });
      const challenge = verifyMfaChallengeToken(mfaToken);
      if (!challenge.valid || !challenge.userId) return res.status(401).json({ error: "This login attempt has expired. Please sign in again." });

      const user = await store.getI9ClientUserById(challenge.userId);
      if (!user || !user.isActive || !user.mfaEnabled || !user.mfaSecretEncrypted) {
        return res.status(401).json({ error: "This login attempt has expired. Please sign in again." });
      }
      const secret = decryptFromColumn(user.mfaSecretEncrypted);
      const matchedStep = matchTotpCodeStep(secret, code);
      if (matchedStep === null || (user.mfaLastUsedStep != null && matchedStep <= user.mfaLastUsedStep)) {
        await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.mfa_failed", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
        return res.status(401).json({ error: "Invalid authentication code." });
      }
      await store.setI9ClientUserMfaLastUsedStep(user.id, matchedStep);

      await establishI9Session(req, res, user.id, user.role as I9Role, user.clientCompanyId);
      await store.touchI9ClientUserLogin(user.id);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.login", clientCompanyId: user.clientCompanyId ?? undefined, details: { mfa: true }, ipAddress: req.ip });
      res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, clientCompanyId: user.clientCompanyId } });
    } catch (err: any) {
      console.error("i9 mfa verify error:", err.message);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // ── MFA enrollment/management (authenticated) ────────────────────────────

  app.post("/api/i9/auth/mfa/enroll/start", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    if (!isProtectedDataEncryptionConfigured()) return secureConfigRequired(res, ["PROTECTED_DATA_ENCRYPTION_KEY"]);
    try {
      const secret = generateTotpSecret();
      await store.setI9ClientUserMfaPendingSecret(req.i9User!.id, encryptToColumn(secret));
      res.json({ success: true, secret, otpauthUrl: totpProvisioningUri(secret, req.i9User!.email) });
    } catch (err: any) {
      console.error("i9 mfa enroll/start error:", err.message);
      res.status(500).json({ error: "Failed to start MFA enrollment" });
    }
  });

  app.post("/api/i9/auth/mfa/enroll/confirm", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ error: "code is required" });
      const user = await store.getI9ClientUserById(req.i9User!.id);
      if (!user?.mfaPendingSecretEncrypted) return res.status(400).json({ error: "No MFA enrollment is in progress. Start enrollment first." });
      const pendingSecret = decryptFromColumn(user.mfaPendingSecretEncrypted);
      const matchedStep = matchTotpCodeStep(pendingSecret, code);
      if (matchedStep === null) return res.status(400).json({ error: "That code didn't match. Check your authenticator app and try again." });

      await store.confirmI9ClientUserMfaEnrollment(user.id, user.mfaPendingSecretEncrypted);
      // Marks the confirming code as already-used, so it can't also be
      // replayed for a subsequent login attempt within its validity window.
      await store.setI9ClientUserMfaLastUsedStep(user.id, matchedStep);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.mfa_enrolled", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("i9 mfa enroll/confirm error:", err.message);
      res.status(500).json({ error: "Failed to confirm MFA enrollment" });
    }
  });

  app.post("/api/i9/auth/mfa/disable", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    try {
      const { code } = req.body as { code?: string };
      const user = await store.getI9ClientUserById(req.i9User!.id);
      if (!user?.mfaEnabled || !user.mfaSecretEncrypted) return res.status(400).json({ error: "MFA is not enabled on this account." });
      if (!code || !verifyTotpCode(decryptFromColumn(user.mfaSecretEncrypted), code)) {
        return res.status(400).json({ error: "A valid current authentication code is required to disable MFA." });
      }
      await store.disableI9ClientUserMfa(user.id);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.mfa_disabled", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("i9 mfa disable error:", err.message);
      res.status(500).json({ error: "Failed to disable MFA" });
    }
  });

  /** Always returns the same generic success response whether or not the
   *  email matches an account — an attacker probing this endpoint can't use
   *  the response to learn which emails have accounts. If a match is found,
   *  a single-use, 1-hour reset link is emailed; nothing else happens. */
  app.post("/api/i9/auth/request-password-reset", i9RateLimit("i9-request-reset", 8, 60 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    try {
      const { email } = req.body as { email?: string };
      const parsed = z.string().email().max(200).safeParse(email);
      if (!parsed.success) return res.status(400).json({ error: "A valid email is required" });

      const user = await store.getI9ClientUserByEmail(parsed.data);
      if (user && user.isActive) {
        const token = generatePasswordResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await store.setI9PasswordResetToken(user.id, hashPasswordResetToken(token), expiresAt);
        const resetUrl = `${process.env.PUBLIC_SITE_URL || "https://www.lbs4.com"}/employer-services/new-hire-verification/portal/reset-password?token=${token}`;
        await sendI9PasswordResetEmail({ to: user.email, recipientName: user.fullName, resetUrl });
        await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.password_reset_requested", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      }
      res.json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
    } catch (err: any) {
      console.error("i9 request-password-reset error:", err.message);
      // Still respond generically even on an internal error, for the same
      // account-enumeration reason as above.
      res.json({ success: true, message: "If an account exists with that email, a reset link has been sent." });
    }
  });

  app.post("/api/i9/auth/reset-password", i9RateLimit("i9-reset-password", 10, 60 * 60 * 1000), async (req: Request, res: Response) => {
    if (!process.env.DATABASE_URL) return secureConfigRequired(res, ["DATABASE_URL"]);
    try {
      const schema = z.object({ token: z.string().min(1), newPassword: z.string().min(12) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "A valid token and a password of at least 12 characters are required" });

      const user = await store.getI9ClientUserByResetTokenHash(hashPasswordResetToken(parsed.data.token));
      if (!user || !user.isActive) return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });

      await store.resetI9ClientUserPassword(user.id, parsed.data.newPassword);
      await store.logI9Audit({ actorUserId: user.id, actorRole: user.role, action: "auth.password_reset_completed", clientCompanyId: user.clientCompanyId ?? undefined, ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("i9 reset-password error:", err.message);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  app.post("/api/i9/auth/logout", requireI9Auth, requireI9Csrf, (req: I9AuthedRequest, res: Response) => {
    destroyI9Session(req, res, () => res.json({ success: true }));
  });

  app.get("/api/i9/auth/me", requireI9Auth, (req: I9AuthedRequest, res: Response) => {
    res.json({ user: req.i9User });
  });

  app.get("/api/i9/auth/mfa/status", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    const user = await store.getI9ClientUserById(req.i9User!.id);
    res.json({ mfaEnabled: !!user?.mfaEnabled });
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

      await store.createI9Notification({
        clientCompanyId: pstr(req.params.id),
        event: "client_activated",
        relatedEntityType: "ClientCompany",
        relatedEntityId: pstr(req.params.id),
        inPortalMessage: `Your account status changed to "${status.replace(/_/g, " ")}".`,
      });
      if (status === "active" && company.authorizedSignerEmail) {
        await sendI9NotificationEmail({ to: company.authorizedSignerEmail, recipientName: company.authorizedSignerName || "there", companyName: company.legalBusinessName, event: "client_activated" });
      }
      res.json({ success: true, status });
    } catch {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CLIENT AGREEMENT — no e-signature provider is configured (see
  // deliverables doc). This generates document text for download/print and
  // records a reference to a signed copy uploaded separately via
  // /api/i9/documents/upload — it never simulates or fakes a signature
  // capture. The E-Verify MOU is a completely separate document, executed
  // by the client directly with DHS/SSA outside this website — see the
  // everify-enrollment route below, which only records status afterward.
  // ═══════════════════════════════════════════════════════════════════════

  app.post("/api/i9/companies/:id/agreement/generate", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const company = await store.getI9ClientCompany(pstr(req.params.id));
      if (!company) return res.status(404).json({ error: "Company not found" });
      const html = renderI9AgreementHtml(company);
      const agreement = await store.createI9ClientAgreement(pstr(req.params.id), "0.1-draft", html);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "agreement.generate", entityType: "ClientCompany", entityId: pstr(req.params.id), clientCompanyId: pstr(req.params.id), ipAddress: req.ip });
      res.json({ success: true, agreement });
    } catch (err: any) {
      console.error("agreement generate error:", err.message);
      res.status(500).json({ error: "Failed to generate agreement" });
    }
  });

  app.get("/api/i9/companies/:id/agreement", requireI9Auth, requireI9TenantMatch((req) => pstr(req.params.id)), async (req: I9AuthedRequest, res: Response) => {
    const agreement = await store.getLatestI9ClientAgreement(pstr(req.params.id));
    res.json({ agreement });
  });

  app.post("/api/i9/companies/:id/agreement/record-signed-copy", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const { secureDocumentId, signedByName } = req.body as { secureDocumentId?: string; signedByName?: string };
      if (!secureDocumentId || !signedByName) return res.status(400).json({ error: "secureDocumentId and signedByName are required" });
      const doc = await store.getI9SecureDocument(secureDocumentId);
      if (!doc || doc.clientCompanyId !== pstr(req.params.id)) return res.status(404).json({ error: "Secure document not found for this company" });
      const agreement = await store.getLatestI9ClientAgreement(pstr(req.params.id));
      if (!agreement) return res.status(404).json({ error: "No agreement has been generated for this company yet" });
      await store.recordI9AgreementSignedCopy(agreement.id, { secureDocumentId, signedByName });
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "agreement.record_signed_copy", entityType: "ClientCompany", entityId: pstr(req.params.id), clientCompanyId: pstr(req.params.id), ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("agreement record-signed-copy error:", err.message);
      res.status(500).json({ error: "Failed to record signed copy" });
    }
  });

  app.post("/api/i9/companies/:id/everify-enrollment", requireI9Auth, requireI9Csrf, requireI9Role("lbs_program_admin", "lbs_intake_billing"), async (req: I9AuthedRequest, res: Response) => {
    try {
      const schema = z.object({
        everifyCompanyId: z.string().max(100).optional(),
        mouSignerName: z.string().max(200).optional(),
        mouSignedDate: z.string().max(20).optional(),
        mouSecureReference: z.string().max(300).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      const company = await store.getI9ClientCompany(pstr(req.params.id));
      if (!company) return res.status(404).json({ error: "Company not found" });
      await store.recordI9EverifyEnrollment(pstr(req.params.id), parsed.data);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "company.everify_enrollment_recorded", entityType: "ClientCompany", entityId: pstr(req.params.id), clientCompanyId: pstr(req.params.id), ipAddress: req.ip });
      res.json({ success: true });
    } catch (err: any) {
      console.error("everify-enrollment error:", err.message);
      res.status(500).json({ error: "Failed to record E-Verify enrollment" });
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

  /** Edit a request while it's still a draft — e.g. to finish filling in
   *  attestations before submitting. Once submitted, LBS may already be
   *  acting on the case, so further changes go through status-transition
   *  notes / case-result recording instead of a silent edit. */
  app.patch("/api/i9/new-hire-requests/:id", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    try {
      const forbidden = rejectForbiddenFields(req.body);
      if (forbidden) return res.status(400).json({ error: forbidden });

      const request = await store.getI9NewHireRequest(pstr(req.params.id));
      if (!request) return res.status(404).json({ error: "Not found" });
      const isInternal = req.i9User!.role.startsWith("lbs_");
      if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });
      if (request.status !== "draft") return res.status(400).json({ error: "Only a request that is still in draft status can be edited." });

      const parsed = insertI9NewHireRequestSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });

      await store.updateI9NewHireRequest(pstr(req.params.id), parsed.data);
      await store.logI9Audit({ actorUserId: req.i9User!.id, actorRole: req.i9User!.role, action: "new_hire_request.edit_draft", entityType: "NewHireRequest", entityId: request.id, clientCompanyId: request.clientCompanyId, ipAddress: req.ip });
      const updated = await store.getI9NewHireRequest(pstr(req.params.id));
      res.json({ success: true, request: updated });
    } catch (err: any) {
      console.error("update new-hire request error:", err.message);
      res.status(500).json({ error: "Failed to update request" });
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

      // Client-visible notification for the transitions clients actually
      // need to act on or be aware of — never includes employee data, just
      // a generic pointer back to the secure portal (per the brief: every
      // notification stays PII-free and directs the reader to log in).
      const NOTIFY_EVENT_FOR_STATUS: Record<string, I9NotificationEvent> = {
        deficient_client_action_required: "deficiency_requires_client_action",
        employment_authorized: "case_result_available",
        needs_more_time: "case_result_available",
        mismatch_employee_decision_pending: "mismatch_notice_review_pending",
        case_in_continuance: "case_result_available",
        final_nonconfirmation: "case_result_available",
      };
      const notifyEvent = NOTIFY_EVENT_FOR_STATUS[status];
      if (notifyEvent) {
        await store.createI9Notification({
          clientCompanyId: request.clientCompanyId,
          event: notifyEvent,
          relatedEntityType: "NewHireRequest",
          relatedEntityId: request.id,
          inPortalMessage: `An update is available for request ${request.internalRequestNumber}. Log in to the secure portal to view it.`,
        });
        // Email is a nudge on top of the in-portal notification above, not a
        // replacement for it — same generic, PII-free template every other
        // I-9 email uses. A missing/failed email never blocks the status
        // change itself; the in-portal notification always lands regardless.
        const company = await store.getI9ClientCompany(request.clientCompanyId);
        if (company?.authorizedSignerEmail) {
          await sendI9NotificationEmail({
            to: company.authorizedSignerEmail,
            recipientName: company.authorizedSignerName || "there",
            companyName: company.legalBusinessName,
            event: notifyEvent,
          }).catch((err) => console.error("i9 status-change notification email failed:", err?.message));
        }
      }
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
    // Same cross-tenant check every sibling new-hire-request route applies
    // (see GET /:id above) — this was missing here, letting any authenticated
    // client user read another company's case activity log by request ID.
    const request = await store.getI9NewHireRequest(pstr(req.params.id));
    if (!request) return res.status(404).json({ error: "Not found" });
    const isInternal = req.i9User!.role.startsWith("lbs_");
    if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });
    res.json({ activity: await store.listI9CaseActivity(pstr(req.params.id)) });
  });

  app.get("/api/i9/new-hire-requests/:id/deadlines", requireI9Auth, async (req: I9AuthedRequest, res: Response) => {
    // Same cross-tenant check as above — was missing here too.
    const request = await store.getI9NewHireRequest(pstr(req.params.id));
    if (!request) return res.status(404).json({ error: "Not found" });
    const isInternal = req.i9User!.role.startsWith("lbs_");
    if (!isInternal && request.clientCompanyId !== req.i9User!.clientCompanyId) return res.status(403).json({ error: "Access denied" });
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
      if (!magicBytesMatchMimeType(buffer, parsed.data.mimeType)) {
        return res.status(400).json({ error: "File content does not match the declared file type." });
      }

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
    res.json({ notifications: await store.listI9NotificationsForUser(req.i9User!.id, req.i9User!.clientCompanyId) });
  });

  app.patch("/api/i9/notifications/:id/read", requireI9Auth, requireI9Csrf, async (req: I9AuthedRequest, res: Response) => {
    await store.markI9NotificationRead(pstr(req.params.id));
    res.json({ success: true });
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
