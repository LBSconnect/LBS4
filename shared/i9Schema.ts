// ─────────────────────────────────────────────────────────────────────────────
// LBS New-Hire Verification & Form I-9 Support — data model
//
// Kept in its own file (separate from shared/schema.ts) because of its size
// and because it has materially stricter access rules than the rest of the
// site's schema — several of these tables (i9_protected_employee_data,
// i9_secure_documents) hold data that must never be duplicated, logged, or
// exposed outside the narrow "reveal" flow described in server/i9Security.ts.
//
// All tables are prefixed i9_ to keep this domain clearly separated from the
// unrelated "corporate" (notary subscription) tables already in schema.ts.
// Runtime table creation is idempotent raw SQL in server/i9Storage.ts,
// matching the pattern corporateStorage.ts already uses — these Drizzle
// pgTable defs exist for query building + compile-time type inference.
// ─────────────────────────────────────────────────────────────────────────────

import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { z } from "zod";

const uuidPk = (name = "id") => varchar(name).primaryKey().default(sql`gen_random_uuid()`);

// Canonical version of the public New-Hire Verification & Form I-9 Support
// Services Agreement (client/src/pages/employer/ServiceAgreement.tsx). Bump
// this whenever that page's substantive terms change; never edit an
// already-accepted i9_client_agreements row to match a later version. The
// client bundle keeps its own copy of this same string (see that file) —
// this table can't be imported client-side without pulling in
// drizzle-orm/pg-core (same reason the SSN-pattern guard below is
// duplicated rather than imported).
export const AGREEMENT_VERSION = "1.0";

// ─────────────────────────────────────────────────────────────────────────────
// Roles (shared enum used across ClientUser and RBAC middleware)
// ─────────────────────────────────────────────────────────────────────────────

export const I9_ROLES = [
  "lbs_program_admin",
  "lbs_case_processor",
  "lbs_intake_billing",
  "client_authorized_signer",
  "client_limited_user",
] as const;
export type I9Role = (typeof I9_ROLES)[number];

export const LBS_INTERNAL_ROLES: I9Role[] = ["lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"];
export const CLIENT_ROLES: I9Role[] = ["client_authorized_signer", "client_limited_user"];

/** Catches an SSN typed into a free-text field (client notes, late-reason
 *  explanations, lead messages) — the FORBIDDEN_SENSITIVE_FIELD_NAMES check
 *  below only rejects a *field name* like `ssn`, which does nothing to stop
 *  someone typing "employee SSN is 123-45-6789" into a `message` or
 *  `clientNotes` textarea. Matches the standard XXX-XX-XXXX format with
 *  optional separators, plus a bare 9-digit run — deliberately simple and
 *  over-inclusive (a phone+extension or an order number could false-positive)
 *  because the cost of a false positive (re-word one sentence) is far lower
 *  than the cost of a false negative (an SSN persisted in a notes field). */
const SSN_LIKE_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/;
export function containsLikelySensitivePattern(text: string): boolean {
  return SSN_LIKE_PATTERN.test(text);
}
const sensitiveFreeTextRefinement = (val: string | undefined) => !val || !containsLikelySensitivePattern(val);
const SENSITIVE_FREE_TEXT_MESSAGE =
  "This looks like it may contain a Social Security number or similar identifier. Remove it — do not enter employee SSNs or document numbers in free-text fields.";

/** Password strength for every I-9 portal account (client registration, LBS-staff
 *  admin user creation, password reset, and the admin-bootstrap route). The
 *  12-character minimum alone previously let straight-through passwords like
 *  "aaaaaaaaaaaa" or "111111111111" through — this portal holds business
 *  billing/contact data and gates access to case-management workflows, so it
 *  gets the same floor most account-security guidance recommends: a length
 *  minimum plus a basic character-variety + no-trivial-repetition check
 *  (deliberately not a full entropy/zxcvbn scorer — that's a bigger dependency
 *  than this gap needs). */
const PASSWORD_MIN_LENGTH = 12;
function isStrongPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  if (/^(.)\1*$/.test(password)) return false; // e.g. "aaaaaaaaaaaa"
  if (/^\d+$/.test(password)) return false; // e.g. "111111111111"
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length;
  return classes >= 2;
}
const PASSWORD_STRENGTH_MESSAGE =
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include at least two of: lowercase letters, uppercase letters, numbers, symbols. Repeated-character or all-digit passwords aren't allowed.`;
export const passwordSchema = z.string().min(PASSWORD_MIN_LENGTH, PASSWORD_STRENGTH_MESSAGE).refine(isStrongPassword, PASSWORD_STRENGTH_MESSAGE);

// ─────────────────────────────────────────────────────────────────────────────
// 1. EmployerLead — public lead capture, business-level fields only
// ─────────────────────────────────────────────────────────────────────────────

export const i9EmployerLeads = pgTable("i9_employer_leads", {
  id: uuidPk(),
  contactName: varchar("contact_name", { length: 200 }).notNull(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  businessEmail: varchar("business_email", { length: 200 }).notNull(),
  businessPhone: varchar("business_phone", { length: 40 }).notNull(),
  companyAddress: varchar("company_address", { length: 300 }).notNull(),
  industry: varchar("industry", { length: 150 }).notNull(),
  employeeCount: varchar("employee_count", { length: 50 }).notNull(),
  monthlyHires: varchar("monthly_hires", { length: 50 }).notNull(),
  hiringLocations: varchar("hiring_locations", { length: 50 }).notNull(),
  alreadyEnrolledInEverify: varchar("already_enrolled_in_everify", { length: 20 }).notNull(), // yes | no | not_sure
  usesAnotherEmployerAgent: varchar("uses_another_employer_agent", { length: 20 }).notNull(), // yes | no | not_sure
  federalContractorStatus: varchar("federal_contractor_status", { length: 20 }).notNull(), // yes | no | not_sure
  desiredService: varchar("desired_service", { length: 100 }).notNull(),
  preferredConsultationMethod: varchar("preferred_consultation_method", { length: 30 }).notNull(),
  message: text("message"),
  consentToContact: boolean("consent_to_contact").notNull(),
  convertedToClientCompanyId: varchar("converted_to_client_company_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertI9EmployerLeadSchema = z.object({
  contactName: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  businessEmail: z.string().email().max(200),
  businessPhone: z.string().min(1).max(40),
  companyAddress: z.string().min(1).max(300),
  industry: z.string().min(1).max(150),
  employeeCount: z.string().min(1).max(50),
  monthlyHires: z.string().min(1).max(50),
  hiringLocations: z.string().min(1).max(50),
  alreadyEnrolledInEverify: z.enum(["yes", "no", "not_sure"]),
  usesAnotherEmployerAgent: z.enum(["yes", "no", "not_sure"]),
  federalContractorStatus: z.enum(["yes", "no", "not_sure"]),
  desiredService: z.string().min(1).max(100),
  preferredConsultationMethod: z.enum(["Phone", "Email", "Video Call", "In-Person"]),
  message: z.string().max(4000).refine(sensitiveFreeTextRefinement, SENSITIVE_FREE_TEXT_MESSAGE).optional().or(z.literal("")),
  consentToContact: z.boolean().refine((v) => v === true, { message: "Consent is required" }),
  captchaToken: z.string().optional(),
});
export type InsertI9EmployerLead = z.infer<typeof insertI9EmployerLeadSchema>;
export type I9EmployerLead = typeof i9EmployerLeads.$inferSelect;

/** Field names that must never appear on a public-facing or business-metadata
 *  form. Zod's default object parsing already *silently drops* any of these
 *  before they reach storage/email (that's the actual security property —
 *  the fields would never be stored regardless). This list is used
 *  separately, against the raw request body, to turn that into a visible
 *  400 instead of a silent no-op — see server/i9Routes.ts rejectForbiddenFields. */
export const FORBIDDEN_SENSITIVE_FIELD_NAMES = [
  "ssn",
  "socialSecurityNumber",
  "social_security_number",
  "dateOfBirth",
  "dob",
  "date_of_birth",
  "documentNumber",
  "document_number",
  "alienNumber",
  "alien_number",
  "passportNumber",
  "passport_number",
  "driversLicenseNumber",
  "drivers_license_number",
  "i9DocumentNumber",
  "immigrationStatus",
  "immigration_status",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. ClientCompany
// ─────────────────────────────────────────────────────────────────────────────

export const i9ClientCompanies = pgTable("i9_client_companies", {
  id: uuidPk(),
  legalBusinessName: varchar("legal_business_name", { length: 200 }).notNull(),
  dba: varchar("dba", { length: 200 }),
  einEncrypted: text("ein_encrypted"), // encrypted column (see server/i9Security.ts); masked display only
  entityType: varchar("entity_type", { length: 100 }),
  physicalAddress: text("physical_address"),
  mailingAddress: text("mailing_address"),
  website: varchar("website", { length: 300 }),
  industry: varchar("industry", { length: 150 }),
  naicsSector: varchar("naics_sector", { length: 3 }),
  totalEmployeeCount: integer("total_employee_count"),
  averageMonthlyHires: integer("average_monthly_hires"),
  federalContractorStatus: varchar("federal_contractor_status", { length: 20 }), // yes | no | not_sure
  alreadyEnrolledInEverify: varchar("already_enrolled_in_everify", { length: 20 }),
  currentEmployerAgent: varchar("current_employer_agent", { length: 200 }),
  authorizedSignerName: varchar("authorized_signer_name", { length: 200 }),
  authorizedSignerTitle: varchar("authorized_signer_title", { length: 150 }),
  authorizedSignerEmail: varchar("authorized_signer_email", { length: 200 }),
  authorizedSignerPhone: varchar("authorized_signer_phone", { length: 40 }),
  billingContactName: varchar("billing_contact_name", { length: 200 }),
  billingContactEmail: varchar("billing_contact_email", { length: 200 }),
  selectedPlanId: varchar("selected_plan_id", { length: 100 }),
  requestedAddOns: jsonb("requested_add_ons").default([]),
  preferredStartDate: varchar("preferred_start_date", { length: 20 }),
  formI9WorkflowSelection: varchar("form_i9_workflow_selection", { length: 50 }), // client_self_serve | lbs_administrative_review | lbs_in_person_examination
  acknowledgedResponsibilities: boolean("acknowledged_responsibilities").notNull().default(false),
  status: varchar("status", { length: 40 }).notNull().default("lead_qualified"),
  // Onboarding-stage-specific fields (kept flat rather than a second table —
  // one company has exactly one onboarding record's worth of this data)
  everifyCompanyId: varchar("everify_company_id", { length: 100 }),
  mouSignerName: varchar("mou_signer_name", { length: 200 }),
  mouSignedDate: varchar("mou_signed_date", { length: 20 }),
  mouSecureReference: varchar("mou_secure_reference", { length: 300 }), // pointer to a SecureDocument, not the file itself
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const I9_CLIENT_COMPANY_STATUSES = [
  "lead_qualified",
  "plan_selected",
  "lbs_agreement_pending",
  "lbs_agreement_signed",
  "setup_payment_pending",
  "business_intake_pending",
  "ready_for_everify_enrollment",
  "everify_enrollment_entered_by_lbs",
  "mou_signature_pending",
  "mou_signed",
  "hiring_sites_confirmed",
  "workflow_training_pending",
  "active",
  "suspended",
  "offboarding",
  "terminated",
] as const;
export type I9ClientCompanyStatus = (typeof I9_CLIENT_COMPANY_STATUSES)[number];

export const insertI9ClientCompanySchema = z.object({
  legalBusinessName: z.string().min(1).max(200),
  dba: z.string().max(200).optional(),
  ein: z.string().length(9).regex(/^\d{9}$/).optional(), // 9 digits, no dash; plaintext in, encrypted before storage — never persisted as-is
  entityType: z.string().max(100).optional(),
  physicalAddress: z.string().max(500).optional(),
  mailingAddress: z.string().max(500).optional(),
  website: z.string().max(300).optional(),
  industry: z.string().max(150).optional(),
  naicsSector: z.string().length(3).regex(/^\d{3}$/).optional(),
  // Upper bound well within Postgres's `integer` column range (max ~2.1B) —
  // without it, a stray extra digit (or a copy/paste glitch) overflows the
  // column and the DB throws, which previously surfaced as an opaque
  // "Failed to update business intake" 500 instead of a normal validation
  // error. 10,000,000 is far beyond any real client's headcount/hiring rate.
  totalEmployeeCount: z.number().int().nonnegative().max(10_000_000).optional(),
  averageMonthlyHires: z.number().int().nonnegative().max(10_000_000).optional(),
  federalContractorStatus: z.enum(["yes", "no", "not_sure"]).optional(),
  alreadyEnrolledInEverify: z.enum(["yes", "no", "not_sure"]).optional(),
  currentEmployerAgent: z.string().max(200).optional(),
  authorizedSignerName: z.string().max(200).optional(),
  authorizedSignerTitle: z.string().max(150).optional(),
  authorizedSignerEmail: z.string().email().max(200).optional(),
  authorizedSignerPhone: z.string().max(40).optional(),
  billingContactName: z.string().max(200).optional(),
  billingContactEmail: z.string().email().max(200).optional(),
  selectedPlanId: z.string().max(100).optional(),
  requestedAddOns: z.array(z.string()).max(20).optional(),
  preferredStartDate: z.string().max(20).optional(),
  formI9WorkflowSelection: z.enum(["client_self_serve", "lbs_administrative_review", "lbs_in_person_examination"]).optional(),
  acknowledgedResponsibilities: z.boolean().optional(),
});
export type InsertI9ClientCompany = z.infer<typeof insertI9ClientCompanySchema>;
export type I9ClientCompany = typeof i9ClientCompanies.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 3. ClientUser — both LBS internal staff and client-side users, tenant-scoped
// ─────────────────────────────────────────────────────────────────────────────

export const i9ClientUsers = pgTable("i9_client_users", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }), // null for LBS internal staff
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  role: varchar("role", { length: 40 }).notNull(), // one of I9_ROLES
  assignedHiringSiteIds: jsonb("assigned_hiring_site_ids").default([]), // for client_limited_user scoping
  isActive: boolean("is_active").notNull().default(true),
  // Set on admin-issued accounts (bootstrap-admin, or an admin creating
  // another user) that were handed a known temporary password — every
  // portal route except the change-password action itself and logout is
  // blocked (requireI9Auth in server/i9Auth.ts) until this is cleared,
  // which happens automatically the moment a real password is set.
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  // Both encrypted at rest via the same AES-256-GCM column encryption used
  // for protected employee data (encryptToColumn/decryptFromColumn in
  // i9Security.ts) — an MFA secret is as sensitive as a password.
  // mfaSecretEncrypted is the active, in-use secret (set once enrollment is
  // confirmed); mfaPendingSecretEncrypted holds a secret mid-enrollment,
  // before the user has proven they can generate a valid code with it.
  mfaSecretEncrypted: text("mfa_secret_encrypted"),
  mfaPendingSecretEncrypted: text("mfa_pending_secret_encrypted"),
  // The 30-second time-step of the last code this user successfully
  // redeemed — rejecting a repeat of that same step (or anything earlier)
  // closes the narrow window where a valid TOTP code could otherwise be
  // replayed for a second login/disable within its own validity period.
  mfaLastUsedStep: integer("mfa_last_used_step"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // Password reset — only a HASH of the token is stored (never the raw token,
  // which exists solely in the emailed link and briefly in memory), and it's
  // single-use: cleared the moment it's redeemed or a new one is requested.
  passwordResetTokenHash: text("password_reset_token_hash"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
});

export const insertI9ClientUserSchema = z.object({
  clientCompanyId: z.string().optional(),
  email: z.string().email().max(200),
  password: z.string().min(12, "Password must be at least 12 characters"),
  fullName: z.string().min(1).max(200),
  role: z.enum(I9_ROLES),
  assignedHiringSiteIds: z.array(z.string()).optional(),
  mustChangePassword: z.boolean().optional(),
});
export type InsertI9ClientUser = z.infer<typeof insertI9ClientUserSchema>;
export type I9ClientUser = typeof i9ClientUsers.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 4. HiringSite
// ─────────────────────────────────────────────────────────────────────────────

export const i9HiringSites = pgTable("i9_hiring_sites", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address").notNull(),
  managerName: varchar("manager_name", { length: 200 }),
  managerEmail: varchar("manager_email", { length: 200 }),
  participationStatus: varchar("participation_status", { length: 20 }).notNull().default("pending"), // pending | confirmed | not_participating
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertI9HiringSiteSchema = z.object({
  clientCompanyId: z.string().min(1),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  managerName: z.string().max(200).optional(),
  managerEmail: z.string().email().max(200).optional(),
  participationStatus: z.enum(["pending", "confirmed", "not_participating"]).default("pending"),
  isActive: z.boolean().default(true),
});
export type InsertI9HiringSite = z.infer<typeof insertI9HiringSiteSchema>;
export type I9HiringSite = typeof i9HiringSites.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 5. ServicePlan — configurable products (backed by the existing Stripe
//    products/prices sync already used by the site's checkout flow)
// ─────────────────────────────────────────────────────────────────────────────

export const i9ServicePlans = pgTable("i9_service_plans", {
  id: uuidPk(),
  slug: varchar("slug", { length: 60 }).notNull().unique(), // essential | business | high_volume
  name: varchar("name", { length: 100 }).notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull(),
  setupFeeCents: integer("setup_fee_cents").notNull().default(0),
  includedCasesPerMonth: integer("included_cases_per_month").notNull(),
  additionalCaseCents: integer("additional_case_cents").notNull(),
  features: jsonb("features").notNull().default([]),
  stripeProductId: varchar("stripe_product_id", { length: 100 }),
  stripeMonthlyPriceId: varchar("stripe_monthly_price_id", { length: 100 }),
  stripeSetupPriceId: varchar("stripe_setup_price_id", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
export type I9ServicePlan = typeof i9ServicePlans.$inferSelect;

export const i9AddOns = pgTable("i9_add_ons", {
  id: uuidPk(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  startingPriceCents: integer("starting_price_cents").notNull(),
  priceUnit: varchar("price_unit", { length: 50 }).notNull().default("flat"), // flat | per_case | per_employee | per_form
  stripeProductId: varchar("stripe_product_id", { length: 100 }),
  stripePriceId: varchar("stripe_price_id", { length: 100 }),
  // Only set for priceUnit != "flat" — a Stripe Billing Meter backs the
  // metered recurring price above, aggregating usage events reported via
  // event_name `i9-addon-usage-${slug}` (see i9StripeSync.ts / i9Routes.ts).
  stripeMeterId: varchar("stripe_meter_id", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
});
export type I9AddOn = typeof i9AddOns.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 6. Subscription — Stripe-backed
// ─────────────────────────────────────────────────────────────────────────────

export const i9Subscriptions = pgTable("i9_subscriptions", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  servicePlanId: varchar("service_plan_id", { length: 100 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | active | past_due | canceled
  setupFeePaid: boolean("setup_fee_paid").notNull().default(false),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  discountApprovedByUserId: varchar("discount_approved_by_user_id", { length: 100 }),
  discountPercent: integer("discount_percent"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9Subscription = typeof i9Subscriptions.$inferSelect;

// Add-ons attached to a subscription for metered/per-unit billing. LBS staff
// attach an add-on once (creating the Stripe subscription item), then record
// usage as they actually perform the service — the exact moment "1 unit" is
// consumed (e.g. per case vs. per employee) is a staff judgment call, not
// something inferred automatically from case-workflow events, so there is no
// silent auto-billing trigger anywhere in the case workflow.
export const i9SubscriptionAddOns = pgTable("i9_subscription_add_ons", {
  id: uuidPk(),
  subscriptionId: varchar("subscription_id", { length: 100 }).notNull(),
  addOnId: varchar("add_on_id", { length: 100 }).notNull(),
  stripeSubscriptionItemId: varchar("stripe_subscription_item_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9SubscriptionAddOn = typeof i9SubscriptionAddOns.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 7. ClientAgreement — the LBS commercial agreement (separate from the
//    E-Verify MOU, which is executed outside this website — see ClientCompany
//    .everifyCompanyId / .mouSignedDate above)
// ─────────────────────────────────────────────────────────────────────────────

export const i9ClientAgreements = pgTable("i9_client_agreements", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  documentVersion: varchar("document_version", { length: 20 }).notNull().default("0.1-draft"),
  status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | generated | awaiting_signature | signed | e_signature_not_configured
  generatedDocumentHtml: text("generated_document_html"), // the filled-in agreement text, not a signature
  signedDocumentSecureDocumentId: varchar("signed_document_secure_document_id", { length: 100 }), // uploaded signed copy, from the LBS-staff-assisted wet-ink path
  signedByName: varchar("signed_by_name", { length: 200 }),
  // Populated only by the client's own self-service electronic acceptance
  // (POST /api/i9/companies/:id/agreement/accept) — null for the
  // staff-assisted uploaded-copy path above, where there's no request to
  // capture this from. Together with signedByName/signedAt/documentVersion,
  // this is the acceptance evidence for that self-service path.
  signerEmail: varchar("signer_email", { length: 200 }),
  signerIpAddress: varchar("signer_ip_address", { length: 45 }),
  signerUserAgent: text("signer_user_agent"),
  signedAt: timestamp("signed_at"),
  // "self_hosted_acknowledgment" for the electronic-acceptance path above;
  // null for the staff-assisted uploaded-copy path; reserved for a real
  // third-party value (DocuSign, etc.) if one is ever integrated.
  eSignatureProvider: varchar("e_signature_provider", { length: 50 }),
  eSignatureEnvelopeId: varchar("e_signature_envelope_id", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9ClientAgreement = typeof i9ClientAgreements.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 8. AuthorizedRepresentativeDesignation
// ─────────────────────────────────────────────────────────────────────────────

export const i9AuthorizedRepDesignations = pgTable("i9_authorized_rep_designations", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  employerLegalName: varchar("employer_legal_name", { length: 200 }).notNull(),
  employeeNameOrClass: varchar("employee_name_or_class", { length: 300 }).notNull(), // named employee OR a defined class, e.g. "all new hires at Site X, MM/DD-MM/DD"
  designatedLbsRepresentativeName: varchar("designated_lbs_representative_name", { length: 200 }).notNull(),
  scopeOfAuthorization: text("scope_of_authorization").notNull(),
  appointmentType: varchar("appointment_type", { length: 30 }).notNull(), // in_office | mobile
  location: varchar("location", { length: 300 }).notNull(),
  effectiveDate: varchar("effective_date", { length: 20 }).notNull(),
  employerAcknowledgedResponsibility: boolean("employer_acknowledged_responsibility").notNull().default(false),
  signedByName: varchar("signed_by_name", { length: 200 }),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9AuthorizedRepDesignation = typeof i9AuthorizedRepDesignations.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 9. ClientEnrollment — E-Verify enrollment status tracked separately from the
//    company's overall onboarding stage (ClientCompany.status), since the MOU
//    is executed by the client outside this site.
// ─────────────────────────────────────────────────────────────────────────────

export const i9ClientEnrollments = pgTable("i9_client_enrollments", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull().unique(),
  everifyCompanyId: varchar("everify_company_id", { length: 100 }),
  mouStatus: varchar("mou_status", { length: 30 }).notNull().default("not_started"), // not_started | client_instructed | pending_signature | signed
  mouInstructionsSentAt: timestamp("mou_instructions_sent_at"),
  mouSignerName: varchar("mou_signer_name", { length: 200 }),
  mouSignedDate: varchar("mou_signed_date", { length: 20 }),
  mouSecureDocumentId: varchar("mou_secure_document_id", { length: 100 }), // reference only, not the file
  enteredByUserId: varchar("entered_by_user_id", { length: 100 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type I9ClientEnrollment = typeof i9ClientEnrollments.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 10. NewHireRequest — business/case metadata ONLY. No SSN, no document data.
// ─────────────────────────────────────────────────────────────────────────────

export const I9_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "deficient_client_action_required",
  "ready_for_case_creation",
  "assigned",
  "case_created",
  "employment_authorized",
  "needs_more_time",
  "mismatch_employee_decision_pending",
  "mismatch_employee_taking_action",
  "mismatch_employee_not_taking_action",
  "referred_to_dhs",
  "referred_to_ssa",
  "referred_to_dhs_and_ssa",
  "case_in_continuance",
  "final_nonconfirmation",
  "close_and_resubmit",
  "closed",
  "cancelled_duplicate",
] as const;
export type I9RequestStatus = (typeof I9_REQUEST_STATUSES)[number];

export const i9NewHireRequests = pgTable("i9_new_hire_requests", {
  id: uuidPk(),
  internalRequestNumber: varchar("internal_request_number", { length: 30 }).notNull().unique(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  hiringSiteId: varchar("hiring_site_id", { length: 100 }).notNull(),
  clientSubmitterUserId: varchar("client_submitter_user_id", { length: 100 }),
  assignedLbsProcessorUserId: varchar("assigned_lbs_processor_user_id", { length: 100 }),
  serviceRequested: varchar("service_requested", { length: 100 }).notNull(),
  firstDayOfEmploymentForPay: varchar("first_day_of_employment_for_pay", { length: 20 }).notNull(),
  formI9Section1CompletedDate: varchar("form_i9_section1_completed_date", { length: 20 }),
  formI9Section2CompletedDate: varchar("form_i9_section2_completed_date", { length: 20 }),
  section2LateReason: text("section2_late_reason"),
  // Required attestations — all must be true before status can move past `submitted`
  attestJobOfferAccepted: boolean("attest_job_offer_accepted").notNull().default(false),
  attestNotPreScreening: boolean("attest_not_pre_screening").notNull().default(false),
  attestEmployeeChoseDocuments: boolean("attest_employee_chose_documents").notNull().default(false),
  attestListBHasPhoto: boolean("attest_list_b_has_photo"), // null = not applicable (no List B document used)
  attestInformationAccurate: boolean("attest_information_accurate").notNull().default(false),
  attestParticipatingHiringSite: boolean("attest_participating_hiring_site").notNull().default(false),
  clientNotes: text("client_notes"), // client-authored; UI + validation both block obviously-sensitive content
  status: varchar("status", { length: 40 }).notNull().default("draft"),
  everifyCaseNumber: varchar("everify_case_number", { length: 60 }),
  everifyCaseCreatedAt: timestamp("everify_case_created_at"),
  everifyInitialResult: varchar("everify_initial_result", { length: 60 }),
  caseNumberRecordedOnI9: boolean("case_number_recorded_on_i9"),
  caseDetailsPageDelivered: boolean("case_details_page_delivered"),
  linkedPriorRequestId: varchar("linked_prior_request_id", { length: 100 }), // for close_and_resubmit chains
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertI9NewHireRequestSchema = z.object({
  clientCompanyId: z.string().min(1),
  hiringSiteId: z.string().min(1),
  serviceRequested: z.string().min(1).max(100),
  firstDayOfEmploymentForPay: z.string().min(1).max(20),
  formI9Section1CompletedDate: z.string().max(20).optional(),
  formI9Section2CompletedDate: z.string().max(20).optional(),
  section2LateReason: z.string().max(2000).refine(sensitiveFreeTextRefinement, SENSITIVE_FREE_TEXT_MESSAGE).optional(),
  attestJobOfferAccepted: z.boolean(),
  attestNotPreScreening: z.boolean(),
  attestEmployeeChoseDocuments: z.boolean(),
  attestListBHasPhoto: z.boolean().nullable().optional(),
  attestInformationAccurate: z.boolean(),
  attestParticipatingHiringSite: z.boolean(),
  clientNotes: z.string().max(4000).refine(sensitiveFreeTextRefinement, SENSITIVE_FREE_TEXT_MESSAGE).optional(),
});
export type InsertI9NewHireRequest = z.infer<typeof insertI9NewHireRequestSchema>;
export type I9NewHireRequest = typeof i9NewHireRequests.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 11. ProtectedEmployeeData — separate table, stricter access, encrypted
//     columns. Never joined into ordinary list/report queries.
// ─────────────────────────────────────────────────────────────────────────────

export const i9ProtectedEmployeeData = pgTable("i9_protected_employee_data", {
  id: uuidPk(),
  newHireRequestId: varchar("new_hire_request_id", { length: 100 }).notNull().unique(),
  employeeNameEncrypted: text("employee_name_encrypted").notNull(),
  employeeContactEncrypted: text("employee_contact_encrypted"),
  ssnEncrypted: text("ssn_encrypted"),
  documentInfoEncrypted: text("document_info_encrypted"), // JSON blob of I-9 List A/B/C fields needed for the work packet
  ssnLastFour: varchar("ssn_last_four", { length: 4 }), // derived at write time, safe to show in masked form
  createdByUserId: varchar("created_by_user_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export type I9ProtectedEmployeeData = typeof i9ProtectedEmployeeData.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 12. CaseActivity — status-transition / activity feed per request
// ─────────────────────────────────────────────────────────────────────────────

export const i9CaseActivity = pgTable("i9_case_activity", {
  id: uuidPk(),
  newHireRequestId: varchar("new_hire_request_id", { length: 100 }).notNull(),
  fromStatus: varchar("from_status", { length: 40 }),
  toStatus: varchar("to_status", { length: 40 }).notNull(),
  actorUserId: varchar("actor_user_id", { length: 100 }),
  note: text("note"), // never contains sensitive employee data — enforced by construction in i9Routes.ts
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9CaseActivity = typeof i9CaseActivity.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 13. CaseDeadline — every deadline stored here is either entered verbatim
//     from what E-Verify displayed, or explicitly marked "informational,
//     noncontrolling" (see server/i9Routes.ts businessDayTarget helper).
// ─────────────────────────────────────────────────────────────────────────────

export const i9CaseDeadlines = pgTable("i9_case_deadlines", {
  id: uuidPk(),
  newHireRequestId: varchar("new_hire_request_id", { length: 100 }).notNull(),
  deadlineType: varchar("deadline_type", { length: 60 }).notNull(), // case_creation_target | employee_decision | referral | monitoring_check
  deadlineDate: varchar("deadline_date", { length: 20 }).notNull(),
  source: varchar("source", { length: 30 }).notNull(), // everify_displayed | informational_calculator
  enteredByUserId: varchar("entered_by_user_id", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9CaseDeadline = typeof i9CaseDeadlines.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 14. SecureDocument — file metadata; bytes live in a private, non-public
//     directory outside client/public, served only via a short-lived signed
//     token (server/i9Security.ts). See i9Routes.ts for upload/download.
// ─────────────────────────────────────────────────────────────────────────────

export const I9_SECURE_DOCUMENT_TYPES = [
  "signed_lbs_agreement",
  "everify_mou_copy",
  "further_action_notice",
  "authorized_rep_designation",
  "case_related_upload",
] as const;

export const i9SecureDocuments = pgTable("i9_secure_documents", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  relatedNewHireRequestId: varchar("related_new_hire_request_id", { length: 100 }),
  documentType: varchar("document_type", { length: 40 }).notNull(),
  originalFilename: varchar("original_filename", { length: 300 }).notNull(),
  storagePath: text("storage_path").notNull(), // path on private disk, never exposed to the client
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  uploadedByUserId: varchar("uploaded_by_user_id", { length: 100 }).notNull(),
  malwareScanStatus: varchar("malware_scan_status", { length: 30 }).notNull().default("not_scanned"), // not_scanned | clean | infected — see deliverables: no scanner configured
  retentionDeleteAfter: timestamp("retention_delete_after"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9SecureDocument = typeof i9SecureDocuments.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 15. Appointment — I-9-specific fields, linked to the existing generic
//     `appointments` table (shared/schema.ts) which continues to own
//     scheduling/slot logic. This table adds the authorized-representative
//     gate and I-9-specific notes, kept separate from notary appointment data.
// ─────────────────────────────────────────────────────────────────────────────

export const i9Appointments = pgTable("i9_appointments", {
  id: uuidPk(),
  linkedAppointmentId: varchar("linked_appointment_id", { length: 100 }), // -> appointments.id
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  hiringSiteId: varchar("hiring_site_id", { length: 100 }),
  appointmentType: varchar("appointment_type", { length: 30 }).notNull(), // in_office_examination | mobile_examination | hiring_event
  authorizedRepDesignationId: varchar("authorized_rep_designation_id", { length: 100 }), // required before status can be completed
  status: varchar("status", { length: 30 }).notNull().default("requested"), // requested | confirmed | completed | cancelled
  employeeCountEstimate: integer("employee_count_estimate"),
  i9Notes: text("i9_notes"), // kept separate from notary appointment notes
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9Appointment = typeof i9Appointments.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 16. UsageRecord — monthly case usage per company, requires admin approval
//     before it's finalized into billing.
// ─────────────────────────────────────────────────────────────────────────────

export const i9UsageRecords = pgTable("i9_usage_records", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // "2026-08"
  casesIncluded: integer("cases_included").notNull(),
  casesUsed: integer("cases_used").notNull().default(0),
  additionalCases: integer("additional_cases").notNull().default(0),
  additionalCaseChargeCents: integer("additional_case_charge_cents").notNull().default(0),
  approvalStatus: varchar("approval_status", { length: 20 }).notNull().default("pending_review"), // pending_review | approved | disputed
  approvedByUserId: varchar("approved_by_user_id", { length: 100 }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9UsageRecord = typeof i9UsageRecords.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 17. InvoiceReference — pointer to the Stripe invoice; no sensitive data
// ─────────────────────────────────────────────────────────────────────────────

export const i9InvoiceReferences = pgTable("i9_invoice_references", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }),
  invoiceType: varchar("invoice_type", { length: 30 }).notNull(), // setup_fee | monthly_subscription | usage_addon | add_on_service
  amountCents: integer("amount_cents").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("open"), // open | paid | failed | void
  usageRecordId: varchar("usage_record_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9InvoiceReference = typeof i9InvoiceReferences.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 18. Notification — in-portal + a record of the (PII-free) email sent
// ─────────────────────────────────────────────────────────────────────────────

export const I9_NOTIFICATION_EVENTS = [
  "consultation_requested",
  "agreement_pending",
  "agreement_accepted",
  "setup_payment_pending",
  "business_intake_incomplete",
  "everify_enrollment_ready_for_lbs_action",
  "mou_signature_pending",
  "client_activated",
  "new_hire_request_submitted",
  "deficiency_requires_client_action",
  "three_business_day_target_approaching",
  "case_result_available",
  "mismatch_notice_review_pending",
  "employee_decision_deadline_approaching",
  "referral_deadline_approaching",
  "case_monitoring_due",
  "monthly_report_ready",
  "invoice_ready",
  "payment_failed",
] as const;
export type I9NotificationEvent = (typeof I9_NOTIFICATION_EVENTS)[number];

export const i9Notifications = pgTable("i9_notifications", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }),
  recipientUserId: varchar("recipient_user_id", { length: 100 }),
  event: varchar("event", { length: 60 }).notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 40 }),
  relatedEntityId: varchar("related_entity_id", { length: 100 }),
  inPortalMessage: text("in_portal_message").notNull(), // generic, safe for a list view
  emailSent: boolean("email_sent").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9Notification = typeof i9Notifications.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 19. AuditEvent — append-only. Every sensitive-data access and every status
//     change is recorded here in addition to any domain-specific table (e.g.
//     CaseActivity). Rows are never updated or deleted by application code.
// ─────────────────────────────────────────────────────────────────────────────

export const i9AuditEvents = pgTable("i9_audit_events", {
  id: uuidPk(),
  actorUserId: varchar("actor_user_id", { length: 100 }),
  actorRole: varchar("actor_role", { length: 40 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "protected_data.reveal", "new_hire_request.status_change"
  entityType: varchar("entity_type", { length: 60 }),
  entityId: varchar("entity_id", { length: 100 }),
  clientCompanyId: varchar("client_company_id", { length: 100 }),
  details: jsonb("details").default({}), // never contains raw protected values
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9AuditEvent = typeof i9AuditEvents.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 20. RetentionAction — deletion/retention audit trail
// ─────────────────────────────────────────────────────────────────────────────

export const i9RetentionActions = pgTable("i9_retention_actions", {
  id: uuidPk(),
  clientCompanyId: varchar("client_company_id", { length: 100 }).notNull(),
  actionType: varchar("action_type", { length: 40 }).notNull(), // export | delete | legal_hold_applied | legal_hold_released
  targetEntityType: varchar("target_entity_type", { length: 60 }),
  targetEntityId: varchar("target_entity_id", { length: 100 }),
  performedByUserId: varchar("performed_by_user_id", { length: 100 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9RetentionAction = typeof i9RetentionActions.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// 21. SecurityIncident — for Program Administrator review
// ─────────────────────────────────────────────────────────────────────────────

export const i9SecurityIncidents = pgTable("i9_security_incidents", {
  id: uuidPk(),
  category: varchar("category", { length: 60 }).notNull(), // failed_login_threshold | invalid_token_use | unauthorized_access_attempt | other
  severity: varchar("severity", { length: 20 }).notNull().default("low"), // low | medium | high
  description: text("description").notNull(),
  relatedUserId: varchar("related_user_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open | reviewed | resolved
  reviewedByUserId: varchar("reviewed_by_user_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});
export type I9SecurityIncident = typeof i9SecurityIncidents.$inferSelect;
