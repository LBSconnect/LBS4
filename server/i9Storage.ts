// ─────────────────────────────────────────────────────────────────────────────
// Data access layer for the New-Hire Verification & Form I-9 Support portal.
//
// Follows the same pattern as server/corporateStorage.ts: idempotent raw-SQL
// migrations run on server boot, a dedicated connection pool, and plain async
// functions rather than a repository class. Encryption of protected fields
// happens here (not in routes) so there is exactly one place that can produce
// a ProtectedEmployeeData row, and it always encrypts.
// ─────────────────────────────────────────────────────────────────────────────

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, or, desc, sql as dsql } from "drizzle-orm";
import {
  i9EmployerLeads,
  i9ClientCompanies,
  i9ClientUsers,
  i9HiringSites,
  i9ServicePlans,
  i9AddOns,
  i9Subscriptions,
  i9SubscriptionAddOns,
  i9ClientAgreements,
  i9AuthorizedRepDesignations,
  i9ClientEnrollments,
  i9NewHireRequests,
  i9ProtectedEmployeeData,
  i9CaseActivity,
  i9CaseDeadlines,
  i9SecureDocuments,
  i9Appointments,
  i9UsageRecords,
  i9InvoiceReferences,
  i9Notifications,
  i9AuditEvents,
  i9RetentionActions,
  i9SecurityIncidents,
  I9_REQUEST_STATUSES,
  type InsertI9EmployerLead,
  type InsertI9ClientCompany,
  type InsertI9ClientUser,
  type InsertI9HiringSite,
  type InsertI9NewHireRequest,
  type I9ClientCompany,
  type I9ClientUser,
  type I9NewHireRequest,
  type I9Role,
} from "@shared/i9Schema";
import { encryptToColumn, decryptFromColumn, hashPassword, isProtectedDataEncryptionConfigured } from "./i9Security";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
    pool = pool || new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool);
  }
  return db;
}

/** Exposed for i9Routes.ts handlers that need direct query access beyond the
 *  functions in this file (e.g. one-off updates on tables that don't yet have
 *  a dedicated helper). Prefer adding a named function above when a query is
 *  used more than once. */
export function getI9Db() {
  return getDb();
}

/** True only when both a database and a protected-data encryption key are
 *  configured. Routes gate ProtectedEmployeeData / SecureDocument writes on
 *  this rather than assuming either is present — see the security-gate
 *  responses in i9Routes.ts. */
export function isI9SecureWorkflowAvailable(): boolean {
  return !!process.env.DATABASE_URL && isProtectedDataEncryptionConfigured();
}

// ─────────────────────────────────────────────────────────────────────────────
// Migrations (idempotent — safe to run on every boot)
// ─────────────────────────────────────────────────────────────────────────────

export async function runI9Migrations(): Promise<void> {
  if (!process.env.DATABASE_URL) return; // graceful no-op, matches existing site convention
  getDb();
  const pg = pool!;

  await pg.query(`
    CREATE TABLE IF NOT EXISTS i9_employer_leads (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      contact_name VARCHAR(200) NOT NULL,
      company_name VARCHAR(200) NOT NULL,
      business_email VARCHAR(200) NOT NULL,
      business_phone VARCHAR(40) NOT NULL,
      company_address VARCHAR(300) NOT NULL,
      industry VARCHAR(150) NOT NULL,
      employee_count VARCHAR(50) NOT NULL,
      monthly_hires VARCHAR(50) NOT NULL,
      hiring_locations VARCHAR(50) NOT NULL,
      already_enrolled_in_everify VARCHAR(20) NOT NULL,
      uses_another_employer_agent VARCHAR(20) NOT NULL,
      federal_contractor_status VARCHAR(20) NOT NULL,
      desired_service VARCHAR(100) NOT NULL,
      preferred_consultation_method VARCHAR(30) NOT NULL,
      message TEXT,
      consent_to_contact BOOLEAN NOT NULL,
      converted_to_client_company_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_client_companies (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      legal_business_name VARCHAR(200) NOT NULL,
      dba VARCHAR(200),
      ein_encrypted TEXT,
      entity_type VARCHAR(100),
      physical_address TEXT,
      mailing_address TEXT,
      website VARCHAR(300),
      industry VARCHAR(150),
      naics_sector VARCHAR(3),
      total_employee_count INTEGER,
      average_monthly_hires INTEGER,
      federal_contractor_status VARCHAR(20),
      already_enrolled_in_everify VARCHAR(20),
      current_employer_agent VARCHAR(200),
      authorized_signer_name VARCHAR(200),
      authorized_signer_title VARCHAR(150),
      authorized_signer_email VARCHAR(200),
      authorized_signer_phone VARCHAR(40),
      billing_contact_name VARCHAR(200),
      billing_contact_email VARCHAR(200),
      selected_plan_id VARCHAR(100),
      requested_add_ons JSONB DEFAULT '[]',
      preferred_start_date VARCHAR(20),
      form_i9_workflow_selection VARCHAR(50),
      acknowledged_responsibilities BOOLEAN NOT NULL DEFAULT false,
      status VARCHAR(40) NOT NULL DEFAULT 'lead_qualified',
      everify_company_id VARCHAR(100),
      mou_signer_name VARCHAR(200),
      mou_signed_date VARCHAR(20),
      mou_secure_reference VARCHAR(300),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_client_users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100),
      email VARCHAR(200) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name VARCHAR(200) NOT NULL,
      role VARCHAR(40) NOT NULL,
      assigned_hiring_site_ids JSONB DEFAULT '[]',
      is_active BOOLEAN NOT NULL DEFAULT true,
      mfa_enabled BOOLEAN NOT NULL DEFAULT false,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_hiring_sites (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      name VARCHAR(200) NOT NULL,
      address TEXT NOT NULL,
      manager_name VARCHAR(200),
      manager_email VARCHAR(200),
      participation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_service_plans (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug VARCHAR(60) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      monthly_price_cents INTEGER NOT NULL,
      setup_fee_cents INTEGER NOT NULL DEFAULT 0,
      included_cases_per_month INTEGER NOT NULL,
      additional_case_cents INTEGER NOT NULL,
      features JSONB NOT NULL DEFAULT '[]',
      stripe_product_id VARCHAR(100),
      stripe_monthly_price_id VARCHAR(100),
      stripe_setup_price_id VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS i9_add_ons (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug VARCHAR(60) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      starting_price_cents INTEGER NOT NULL,
      price_unit VARCHAR(50) NOT NULL DEFAULT 'flat',
      stripe_product_id VARCHAR(100),
      stripe_price_id VARCHAR(100),
      stripe_meter_id VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS i9_subscriptions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      service_plan_id VARCHAR(100) NOT NULL,
      stripe_customer_id VARCHAR(100),
      stripe_subscription_id VARCHAR(100),
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      setup_fee_paid BOOLEAN NOT NULL DEFAULT false,
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      discount_approved_by_user_id VARCHAR(100),
      discount_percent INTEGER,
      cancelled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_client_agreements (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      document_version VARCHAR(20) NOT NULL DEFAULT '0.1-draft',
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      generated_document_html TEXT,
      signed_document_secure_document_id VARCHAR(100),
      signed_by_name VARCHAR(200),
      signed_at TIMESTAMP,
      e_signature_provider VARCHAR(50),
      e_signature_envelope_id VARCHAR(200),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_authorized_rep_designations (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      employer_legal_name VARCHAR(200) NOT NULL,
      employee_name_or_class VARCHAR(300) NOT NULL,
      designated_lbs_representative_name VARCHAR(200) NOT NULL,
      scope_of_authorization TEXT NOT NULL,
      appointment_type VARCHAR(30) NOT NULL,
      location VARCHAR(300) NOT NULL,
      effective_date VARCHAR(20) NOT NULL,
      employer_acknowledged_responsibility BOOLEAN NOT NULL DEFAULT false,
      signed_by_name VARCHAR(200),
      signed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_client_enrollments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL UNIQUE,
      everify_company_id VARCHAR(100),
      mou_status VARCHAR(30) NOT NULL DEFAULT 'not_started',
      mou_instructions_sent_at TIMESTAMP,
      mou_signer_name VARCHAR(200),
      mou_signed_date VARCHAR(20),
      mou_secure_document_id VARCHAR(100),
      entered_by_user_id VARCHAR(100),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_new_hire_requests (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      internal_request_number VARCHAR(30) NOT NULL UNIQUE,
      client_company_id VARCHAR(100) NOT NULL,
      hiring_site_id VARCHAR(100) NOT NULL,
      client_submitter_user_id VARCHAR(100),
      assigned_lbs_processor_user_id VARCHAR(100),
      service_requested VARCHAR(100) NOT NULL,
      first_day_of_employment_for_pay VARCHAR(20) NOT NULL,
      form_i9_section1_completed_date VARCHAR(20),
      form_i9_section2_completed_date VARCHAR(20),
      section2_late_reason TEXT,
      attest_job_offer_accepted BOOLEAN NOT NULL DEFAULT false,
      attest_not_pre_screening BOOLEAN NOT NULL DEFAULT false,
      attest_employee_chose_documents BOOLEAN NOT NULL DEFAULT false,
      attest_list_b_has_photo BOOLEAN,
      attest_information_accurate BOOLEAN NOT NULL DEFAULT false,
      attest_participating_hiring_site BOOLEAN NOT NULL DEFAULT false,
      client_notes TEXT,
      status VARCHAR(40) NOT NULL DEFAULT 'draft',
      everify_case_number VARCHAR(60),
      everify_case_created_at TIMESTAMP,
      everify_initial_result VARCHAR(60),
      case_number_recorded_on_i9 BOOLEAN,
      case_details_page_delivered BOOLEAN,
      linked_prior_request_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_i9_nhr_company ON i9_new_hire_requests(client_company_id);
    CREATE INDEX IF NOT EXISTS idx_i9_nhr_status ON i9_new_hire_requests(status);

    CREATE TABLE IF NOT EXISTS i9_protected_employee_data (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      new_hire_request_id VARCHAR(100) NOT NULL UNIQUE,
      employee_name_encrypted TEXT NOT NULL,
      employee_contact_encrypted TEXT,
      ssn_encrypted TEXT,
      document_info_encrypted TEXT,
      ssn_last_four VARCHAR(4),
      created_by_user_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_case_activity (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      new_hire_request_id VARCHAR(100) NOT NULL,
      from_status VARCHAR(40),
      to_status VARCHAR(40) NOT NULL,
      actor_user_id VARCHAR(100),
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_i9_activity_request ON i9_case_activity(new_hire_request_id);

    CREATE TABLE IF NOT EXISTS i9_case_deadlines (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      new_hire_request_id VARCHAR(100) NOT NULL,
      deadline_type VARCHAR(60) NOT NULL,
      deadline_date VARCHAR(20) NOT NULL,
      source VARCHAR(30) NOT NULL,
      entered_by_user_id VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_secure_documents (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      related_new_hire_request_id VARCHAR(100),
      document_type VARCHAR(40) NOT NULL,
      original_filename VARCHAR(300) NOT NULL,
      storage_path TEXT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      uploaded_by_user_id VARCHAR(100) NOT NULL,
      malware_scan_status VARCHAR(30) NOT NULL DEFAULT 'not_scanned',
      retention_delete_after TIMESTAMP,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_appointments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      linked_appointment_id VARCHAR(100),
      client_company_id VARCHAR(100) NOT NULL,
      hiring_site_id VARCHAR(100),
      appointment_type VARCHAR(30) NOT NULL,
      authorized_rep_designation_id VARCHAR(100),
      status VARCHAR(30) NOT NULL DEFAULT 'requested',
      employee_count_estimate INTEGER,
      i9_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_usage_records (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      month_year VARCHAR(7) NOT NULL,
      cases_included INTEGER NOT NULL,
      cases_used INTEGER NOT NULL DEFAULT 0,
      additional_cases INTEGER NOT NULL DEFAULT 0,
      additional_case_charge_cents INTEGER NOT NULL DEFAULT 0,
      approval_status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
      approved_by_user_id VARCHAR(100),
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(client_company_id, month_year)
    );

    CREATE TABLE IF NOT EXISTS i9_invoice_references (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      stripe_invoice_id VARCHAR(100),
      invoice_type VARCHAR(30) NOT NULL,
      amount_cents INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'open',
      usage_record_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_notifications (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100),
      recipient_user_id VARCHAR(100),
      event VARCHAR(60) NOT NULL,
      related_entity_type VARCHAR(40),
      related_entity_id VARCHAR(100),
      in_portal_message TEXT NOT NULL,
      email_sent BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_i9_notifications_recipient ON i9_notifications(recipient_user_id);

    CREATE TABLE IF NOT EXISTS i9_audit_events (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      actor_user_id VARCHAR(100),
      actor_role VARCHAR(40),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(60),
      entity_id VARCHAR(100),
      client_company_id VARCHAR(100),
      details JSONB DEFAULT '{}',
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_i9_audit_entity ON i9_audit_events(entity_type, entity_id);

    CREATE TABLE IF NOT EXISTS i9_retention_actions (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      client_company_id VARCHAR(100) NOT NULL,
      action_type VARCHAR(40) NOT NULL,
      target_entity_type VARCHAR(60),
      target_entity_id VARCHAR(100),
      performed_by_user_id VARCHAR(100) NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS i9_security_incidents (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
      category VARCHAR(60) NOT NULL,
      severity VARCHAR(20) NOT NULL DEFAULT 'low',
      description TEXT NOT NULL,
      related_user_id VARCHAR(100),
      ip_address VARCHAR(45),
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      reviewed_by_user_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add columns if not present (safe on existing deployments where the
  // table above was already created before this column was introduced).
  await pg.query(`
    ALTER TABLE i9_add_ons
    ADD COLUMN IF NOT EXISTS stripe_meter_id VARCHAR(100);
  `);
}

/** Seeds the 3 monthly plans + 8 add-ons if the table is empty. Prices match
 *  the public marketing page (client/src/lib/employerServices.ts) exactly —
 *  keep both in sync if pricing changes. */
export async function seedI9Catalog(): Promise<void> {
  const database = getDb();
  const existingPlans = await database.select().from(i9ServicePlans);
  if (existingPlans.length === 0) {
    await database.insert(i9ServicePlans).values([
      {
        slug: "essential",
        name: "Essential",
        monthlyPriceCents: 4900,
        setupFeeCents: 9900,
        includedCasesPerMonth: 3,
        additionalCaseCents: 1500,
        features: ["Up to 3 E-Verify cases monthly", "Client account management", "Case-status monitoring", "Case-number documentation"],
        sortOrder: 1,
      },
      {
        slug: "business",
        name: "Business",
        monthlyPriceCents: 9900,
        setupFeeCents: 9900,
        includedCasesPerMonth: 10,
        additionalCaseCents: 1200,
        features: ["Up to 10 E-Verify cases monthly", "Client account management", "Case-status monitoring", "Case-number documentation", "Mismatch-notice administration", "Monthly activity report", "Email support"],
        sortOrder: 2,
      },
      {
        slug: "high_volume",
        name: "High-Volume",
        monthlyPriceCents: 19900,
        setupFeeCents: 9900,
        includedCasesPerMonth: 30,
        additionalCaseCents: 900,
        features: ["Up to 30 E-Verify cases monthly", "Priority case processing", "Client account management", "Case monitoring", "Monthly compliance activity report", "Manager support"],
        sortOrder: 3,
      },
    ] as any);
  }

  const existingAddOns = await database.select().from(i9AddOns);
  if (existingAddOns.length === 0) {
    await database.insert(i9AddOns).values([
      { slug: "new_client_setup", name: "New client enrollment and setup", startingPriceCents: 9900, priceUnit: "flat" },
      { slug: "case_processing", name: "E-Verify case processing", startingPriceCents: 2000, priceUnit: "per_case" },
      { slug: "i9_review_plus_case", name: "Form I-9 administrative review plus E-Verify case", startingPriceCents: 4500, priceUnit: "flat" },
      { slug: "in_office_examination", name: "In-office document examination", startingPriceCents: 3900, priceUnit: "per_employee" },
      { slug: "mobile_examination", name: "Mobile document-examination appointment", startingPriceCents: 9500, priceUnit: "flat" },
      { slug: "mismatch_administration", name: "Mismatch administration", startingPriceCents: 4900, priceUnit: "flat" },
      { slug: "hiring_event_support", name: "Hiring-event support", startingPriceCents: 35000, priceUnit: "flat" },
      { slug: "i9_file_review", name: "Administrative Form I-9 file review", startingPriceCents: 2500, priceUnit: "per_form" },
    ] as any);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployerLead
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9EmployerLead(data: InsertI9EmployerLead) {
  const database = getDb();
  const { captchaToken, ...rest } = data as any;
  const [row] = await database.insert(i9EmployerLeads).values(rest).returning();
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientCompany
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9ClientCompany(data: InsertI9ClientCompany): Promise<I9ClientCompany> {
  const database = getDb();
  const { ein, ...rest } = data;
  const [row] = await database
    .insert(i9ClientCompanies)
    .values({ ...rest, einEncrypted: ein ? encryptToColumn(ein) : null } as any)
    .returning();
  return row as I9ClientCompany;
}

export async function getI9ClientCompany(id: string): Promise<I9ClientCompany | null> {
  const database = getDb();
  const rows = await database.select().from(i9ClientCompanies).where(eq(i9ClientCompanies.id, id));
  return rows[0] ?? null;
}

export async function listI9ClientCompanies(): Promise<I9ClientCompany[]> {
  const database = getDb();
  return database.select().from(i9ClientCompanies).orderBy(desc(i9ClientCompanies.createdAt));
}

/** Masked EIN for display — last 4 digits only, never the full value. */
export function maskedEin(company: I9ClientCompany): string | null {
  if (!company.einEncrypted) return null;
  try {
    const plain = decryptFromColumn(company.einEncrypted);
    const digits = plain.replace(/\D/g, "");
    return digits.length >= 4 ? `**-***${digits.slice(-4)}` : "**-*******";
  } catch {
    return "**-*******";
  }
}

export async function updateI9ClientCompanyStatus(id: string, status: string): Promise<void> {
  const database = getDb();
  await database.update(i9ClientCompanies).set({ status, updatedAt: new Date() } as any).where(eq(i9ClientCompanies.id, id));
}

export async function updateI9ClientCompany(id: string, patch: Partial<InsertI9ClientCompany>): Promise<void> {
  const database = getDb();
  const { ein, ...rest } = patch as any;
  const values: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (ein) values.einEncrypted = encryptToColumn(ein);
  await database.update(i9ClientCompanies).set(values as any).where(eq(i9ClientCompanies.id, id));
}

/** Separate from updateI9ClientCompany because these fields are LBS-recorded
 *  (never client-editable — a client cannot self-report their own E-Verify
 *  company ID or MOU signature) and aren't part of insertI9ClientCompanySchema
 *  at all. The MOU itself is executed by the client directly with DHS/SSA,
 *  outside this website; this only records status/reference info after the
 *  fact — see server/i9Routes.ts's everify-enrollment route. */
export async function recordI9EverifyEnrollment(
  id: string,
  data: { everifyCompanyId?: string; mouSignerName?: string; mouSignedDate?: string; mouSecureReference?: string }
): Promise<void> {
  const database = getDb();
  await database.update(i9ClientCompanies).set({ ...data, updatedAt: new Date() } as any).where(eq(i9ClientCompanies.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientUser (auth)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ClientAgreement — the LBS commercial agreement (separate from the E-Verify
// MOU, which is executed by the client directly with DHS/SSA — see
// recordI9EverifyEnrollment above). No e-signature provider is configured
// (see server/i9Routes.ts's agreement routes), so this only ever generates
// document text for download/print and records a reference to an uploaded
// signed copy — it never simulates or fakes a signature capture.
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9ClientAgreement(clientCompanyId: string, documentVersion: string, generatedDocumentHtml: string) {
  const database = getDb();
  const [row] = await database
    .insert(i9ClientAgreements)
    .values({ clientCompanyId, documentVersion, generatedDocumentHtml, status: "generated" } as any)
    .returning();
  return row;
}

export async function getLatestI9ClientAgreement(clientCompanyId: string) {
  const database = getDb();
  const rows = await database
    .select()
    .from(i9ClientAgreements)
    .where(eq(i9ClientAgreements.clientCompanyId, clientCompanyId))
    .orderBy(desc(i9ClientAgreements.createdAt));
  return rows[0] ?? null;
}

export async function recordI9AgreementSignedCopy(id: string, data: { secureDocumentId: string; signedByName: string }) {
  const database = getDb();
  await database
    .update(i9ClientAgreements)
    .set({ status: "signed", signedByName: data.signedByName, signedDocumentSecureDocumentId: data.secureDocumentId, signedAt: new Date() } as any)
    .where(eq(i9ClientAgreements.id, id));
}

export async function createI9ClientUser(data: InsertI9ClientUser): Promise<I9ClientUser> {
  const database = getDb();
  const { password, ...rest } = data;
  const [row] = await database
    .insert(i9ClientUsers)
    .values({ ...rest, passwordHash: hashPassword(password) } as any)
    .returning();
  return row as I9ClientUser;
}

export async function getI9ClientUserByEmail(email: string): Promise<I9ClientUser | null> {
  const database = getDb();
  const rows = await database.select().from(i9ClientUsers).where(eq(i9ClientUsers.email, email.toLowerCase()));
  return rows[0] ?? null;
}

export async function getI9ClientUserById(id: string): Promise<I9ClientUser | null> {
  const database = getDb();
  const rows = await database.select().from(i9ClientUsers).where(eq(i9ClientUsers.id, id));
  return rows[0] ?? null;
}

export async function listI9ClientUsersForCompany(clientCompanyId: string): Promise<I9ClientUser[]> {
  const database = getDb();
  return database.select().from(i9ClientUsers).where(eq(i9ClientUsers.clientCompanyId, clientCompanyId));
}

/** Sets a fresh, single-use password reset token for a user (only a hash is
 *  ever persisted — see i9Security.ts). Overwrites any prior token, so
 *  requesting a new reset link silently invalidates an earlier unused one. */
export async function setI9PasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  const database = getDb();
  await database
    .update(i9ClientUsers)
    .set({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt } as any)
    .where(eq(i9ClientUsers.id, userId));
}

/** Looks up a user by a reset-token hash, but only returns them if the token
 *  hasn't expired — an expired-but-still-present token hash is treated the
 *  same as no match, so callers never need to separately check the date. */
export async function getI9ClientUserByResetTokenHash(tokenHash: string): Promise<I9ClientUser | null> {
  const database = getDb();
  const rows = await database.select().from(i9ClientUsers).where(eq(i9ClientUsers.passwordResetTokenHash, tokenHash));
  const user = rows[0];
  if (!user || !user.passwordResetExpiresAt) return null;
  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) return null;
  return user;
}

/** Sets a new password and atomically invalidates the reset token that was
 *  used to authorize it, so the same emailed link can't be replayed. */
export async function resetI9ClientUserPassword(userId: string, newPassword: string): Promise<void> {
  const database = getDb();
  await database
    .update(i9ClientUsers)
    .set({ passwordHash: hashPassword(newPassword), passwordResetTokenHash: null, passwordResetExpiresAt: null } as any)
    .where(eq(i9ClientUsers.id, userId));
}

export async function touchI9ClientUserLogin(id: string): Promise<void> {
  const database = getDb();
  await database.update(i9ClientUsers).set({ lastLoginAt: new Date() } as any).where(eq(i9ClientUsers.id, id));
}

/** Stores a freshly-generated TOTP secret as *pending* — not yet trusted for
 *  login, until the user proves they can generate a matching code. */
export async function setI9ClientUserMfaPendingSecret(id: string, encryptedSecret: string): Promise<void> {
  const database = getDb();
  await database.update(i9ClientUsers).set({ mfaPendingSecretEncrypted: encryptedSecret } as any).where(eq(i9ClientUsers.id, id));
}

/** Promotes the pending secret to active and flips mfaEnabled on — called
 *  only after the enrolling user has submitted one valid code. */
export async function confirmI9ClientUserMfaEnrollment(id: string, encryptedSecret: string): Promise<void> {
  const database = getDb();
  await database
    .update(i9ClientUsers)
    .set({ mfaEnabled: true, mfaSecretEncrypted: encryptedSecret, mfaPendingSecretEncrypted: null } as any)
    .where(eq(i9ClientUsers.id, id));
}

export async function setI9ClientUserMfaLastUsedStep(id: string, step: number): Promise<void> {
  const database = getDb();
  await database.update(i9ClientUsers).set({ mfaLastUsedStep: step } as any).where(eq(i9ClientUsers.id, id));
}

export async function disableI9ClientUserMfa(id: string): Promise<void> {
  const database = getDb();
  await database
    .update(i9ClientUsers)
    .set({ mfaEnabled: false, mfaSecretEncrypted: null, mfaPendingSecretEncrypted: null } as any)
    .where(eq(i9ClientUsers.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// HiringSite
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9HiringSite(data: InsertI9HiringSite) {
  const database = getDb();
  const [row] = await database.insert(i9HiringSites).values(data as any).returning();
  return row;
}

export async function listI9HiringSitesForCompany(clientCompanyId: string) {
  const database = getDb();
  return database.select().from(i9HiringSites).where(eq(i9HiringSites.clientCompanyId, clientCompanyId));
}

// ─────────────────────────────────────────────────────────────────────────────
// ServicePlan / AddOn (read-only from the app's perspective; managed by admin)
// ─────────────────────────────────────────────────────────────────────────────

export async function listI9ServicePlans() {
  const database = getDb();
  return database.select().from(i9ServicePlans).where(eq(i9ServicePlans.isActive, true)).orderBy(i9ServicePlans.sortOrder);
}
export async function listI9AddOns() {
  const database = getDb();
  return database.select().from(i9AddOns).where(eq(i9AddOns.isActive, true));
}
export async function getI9ServicePlan(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9ServicePlans).where(eq(i9ServicePlans.id, id));
  return rows[0] ?? null;
}
/** Used by server/i9StripeSync.ts to persist the Stripe product/price IDs it
 *  creates back onto the catalog row — the catalog itself is seeded once
 *  from static data (seedI9Catalog), but the Stripe-side IDs only exist
 *  once STRIPE_SECRET_KEY is configured and the sync has actually run. */
export async function setI9ServicePlanStripeIds(id: string, ids: { stripeProductId: string; stripeMonthlyPriceId?: string; stripeSetupPriceId?: string }) {
  const database = getDb();
  await database.update(i9ServicePlans).set(ids as any).where(eq(i9ServicePlans.id, id));
}
export async function setI9AddOnStripeIds(id: string, ids: { stripeProductId: string; stripePriceId: string; stripeMeterId?: string }) {
  const database = getDb();
  await database.update(i9AddOns).set(ids as any).where(eq(i9AddOns.id, id));
}
export async function getI9AddOn(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9AddOns).where(eq(i9AddOns.id, id));
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription add-ons — metered/per-unit billing. Attaching creates the
// Stripe subscription item once; usage is reported against it separately
// each time LBS staff actually perform the add-on service (see i9Routes.ts —
// there's no automatic trigger anywhere in the case workflow that reports
// usage on its own, by design).
// ─────────────────────────────────────────────────────────────────────────────

export async function attachI9SubscriptionAddOn(subscriptionId: string, addOnId: string, stripeSubscriptionItemId: string) {
  const database = getDb();
  const [row] = await database
    .insert(i9SubscriptionAddOns)
    .values({ subscriptionId, addOnId, stripeSubscriptionItemId } as any)
    .returning();
  return row;
}

export async function getI9SubscriptionAddOn(subscriptionId: string, addOnId: string) {
  const database = getDb();
  const rows = await database
    .select()
    .from(i9SubscriptionAddOns)
    .where(and(eq(i9SubscriptionAddOns.subscriptionId, subscriptionId), eq(i9SubscriptionAddOns.addOnId, addOnId)));
  return rows[0] ?? null;
}

export async function listI9SubscriptionAddOns(subscriptionId: string) {
  const database = getDb();
  return database.select().from(i9SubscriptionAddOns).where(eq(i9SubscriptionAddOns.subscriptionId, subscriptionId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription — Stripe-backed. Created `pending` when checkout starts,
// flipped to `active` by the checkout.session.completed webhook (see
// server/webhookHandlers.ts) — never by the client directly, since only
// Stripe confirming payment should ever mark a subscription active.
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9PendingSubscription(clientCompanyId: string, servicePlanId: string) {
  const database = getDb();
  const [row] = await database
    .insert(i9Subscriptions)
    .values({ clientCompanyId, servicePlanId, status: "pending" } as any)
    .returning();
  return row;
}

export async function activateI9Subscription(id: string, data: { stripeCustomerId: string; stripeSubscriptionId: string; setupFeePaid: boolean }) {
  const database = getDb();
  await database
    .update(i9Subscriptions)
    .set({ status: "active", stripeCustomerId: data.stripeCustomerId, stripeSubscriptionId: data.stripeSubscriptionId, setupFeePaid: data.setupFeePaid, currentPeriodStart: new Date() } as any)
    .where(eq(i9Subscriptions.id, id));
}

export async function getI9Subscription(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9Subscriptions).where(eq(i9Subscriptions.id, id));
  return rows[0] ?? null;
}

export async function getLatestI9SubscriptionForCompany(clientCompanyId: string) {
  const database = getDb();
  const rows = await database
    .select()
    .from(i9Subscriptions)
    .where(eq(i9Subscriptions.clientCompanyId, clientCompanyId))
    .orderBy(desc(i9Subscriptions.createdAt));
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NewHireRequest workflow
// ─────────────────────────────────────────────────────────────────────────────

export async function generateInternalRequestNumber(): Promise<string> {
  const database = getDb();
  const [{ count }] = await database.select({ count: dsql<number>`count(*)::int` }).from(i9NewHireRequests);
  return `NHR-${String((count ?? 0) + 1).padStart(6, "0")}`;
}

export async function createI9NewHireRequest(
  data: InsertI9NewHireRequest,
  clientSubmitterUserId: string
): Promise<I9NewHireRequest> {
  const database = getDb();
  const internalRequestNumber = await generateInternalRequestNumber();
  const [row] = await database
    .insert(i9NewHireRequests)
    .values({ ...data, internalRequestNumber, clientSubmitterUserId, status: "draft" } as any)
    .returning();
  return row as I9NewHireRequest;
}

/** Only ever called while a request is still `draft` (enforced in the route,
 *  not here, since the route also owns the tenant/role check) — once
 *  submitted, case metadata is amended through status-transition notes and
 *  case-result recording instead, so there's a durable trail of what changed
 *  and when rather than silent edits to a request LBS may already be acting on. */
export async function updateI9NewHireRequest(id: string, patch: Partial<InsertI9NewHireRequest>): Promise<void> {
  const database = getDb();
  await database.update(i9NewHireRequests).set({ ...patch, updatedAt: new Date() } as any).where(eq(i9NewHireRequests.id, id));
}

export async function getI9NewHireRequest(id: string): Promise<I9NewHireRequest | null> {
  const database = getDb();
  const rows = await database.select().from(i9NewHireRequests).where(eq(i9NewHireRequests.id, id));
  return rows[0] ?? null;
}

export async function listI9NewHireRequestsForCompany(clientCompanyId: string): Promise<I9NewHireRequest[]> {
  const database = getDb();
  return database
    .select()
    .from(i9NewHireRequests)
    .where(eq(i9NewHireRequests.clientCompanyId, clientCompanyId))
    .orderBy(desc(i9NewHireRequests.createdAt));
}

export async function listI9NewHireRequestsAssignedTo(processorUserId: string): Promise<I9NewHireRequest[]> {
  const database = getDb();
  return database
    .select()
    .from(i9NewHireRequests)
    .where(eq(i9NewHireRequests.assignedLbsProcessorUserId, processorUserId))
    .orderBy(desc(i9NewHireRequests.createdAt));
}

export async function listAllI9NewHireRequests(): Promise<I9NewHireRequest[]> {
  const database = getDb();
  return database.select().from(i9NewHireRequests).orderBy(desc(i9NewHireRequests.createdAt));
}

/** The single choke point every status change goes through. Encodes the
 *  workflow gates called out in the brief: attestations required before
 *  `submitted`, a second explicit confirmation before `ready_for_case_creation`,
 *  and only Case Processor/Program Admin can move a case through the
 *  government-result states (those require a human to have actually acted in
 *  E-Verify — this app never simulates or infers that). */
export function validateI9StatusTransition(
  request: I9NewHireRequest,
  nextStatus: string,
  actorRole: I9Role,
  opts: { secondReviewConfirmed?: boolean } = {}
): { ok: true } | { ok: false; reason: string } {
  if (!I9_REQUEST_STATUSES.includes(nextStatus as any)) {
    return { ok: false, reason: `Unknown status '${nextStatus}'.` };
  }

  const clientCanSubmit = actorRole === "client_authorized_signer" || actorRole === "client_limited_user";
  const lbsProcessorOrAdmin = actorRole === "lbs_case_processor" || actorRole === "lbs_program_admin";

  if (request.status === "draft" && nextStatus === "submitted") {
    if (!clientCanSubmit && !lbsProcessorOrAdmin) return { ok: false, reason: "Only a client user or LBS staff may submit a request." };
    if (!request.attestJobOfferAccepted) return { ok: false, reason: "Cannot submit: job-offer acceptance is not confirmed." };
    if (!request.attestNotPreScreening) return { ok: false, reason: "Cannot submit: this looks like pre-screening. E-Verify may only be used after a job offer is accepted." };
    if (!request.attestEmployeeChoseDocuments) return { ok: false, reason: "Cannot submit: confirmation that the employee chose their own documents is missing." };
    if (!request.attestInformationAccurate) return { ok: false, reason: "Cannot submit: accuracy attestation is missing." };
    if (!request.attestParticipatingHiringSite) return { ok: false, reason: "Cannot submit: hiring-site participation is not confirmed." };
    return { ok: true };
  }

  if (nextStatus === "ready_for_case_creation") {
    if (!lbsProcessorOrAdmin) return { ok: false, reason: "Only LBS staff may mark a case ready for creation." };
    if (!opts.secondReviewConfirmed) return { ok: false, reason: "A second reviewer confirmation is required before marking ready for case creation." };
    if (!["submitted", "deficient_client_action_required"].includes(request.status)) {
      return { ok: false, reason: `Cannot move to ready_for_case_creation from '${request.status}'.` };
    }
    return { ok: true };
  }

  const governmentResultStates = [
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
  ];
  if (governmentResultStates.includes(nextStatus) && !lbsProcessorOrAdmin) {
    return { ok: false, reason: "Only LBS staff who performed the government action may record this result." };
  }

  if (nextStatus === "deficient_client_action_required" && !lbsProcessorOrAdmin) {
    return { ok: false, reason: "Only LBS staff may flag a request as deficient." };
  }

  // Anything else (assigned, closed, cancelled_duplicate, close_and_resubmit) is
  // allowed for LBS staff by default; client-side transitions beyond `submitted`
  // are not permitted — clients act through attestations/acknowledgements, not
  // by directly setting case-result statuses.
  if (!lbsProcessorOrAdmin && nextStatus !== "submitted") {
    return { ok: false, reason: "This status change requires an LBS staff member." };
  }

  return { ok: true };
}

export async function updateI9NewHireRequestStatus(
  requestId: string,
  nextStatus: string,
  actorUserId: string,
  note?: string
): Promise<void> {
  const database = getDb();
  const request = await getI9NewHireRequest(requestId);
  if (!request) throw new Error("Request not found");
  await database
    .update(i9NewHireRequests)
    .set({ status: nextStatus, updatedAt: new Date() } as any)
    .where(eq(i9NewHireRequests.id, requestId));
  await database.insert(i9CaseActivity).values({
    newHireRequestId: requestId,
    fromStatus: request.status,
    toStatus: nextStatus,
    actorUserId,
    note: note?.slice(0, 2000),
  } as any);
}

export async function listI9CaseActivity(requestId: string) {
  const database = getDb();
  return database
    .select()
    .from(i9CaseActivity)
    .where(eq(i9CaseActivity.newHireRequestId, requestId))
    .orderBy(desc(i9CaseActivity.createdAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedEmployeeData — the only place raw employee values are written
// ─────────────────────────────────────────────────────────────────────────────

export interface ProtectedEmployeeInput {
  employeeName: string;
  employeeContact?: string;
  ssn?: string;
  documentInfo?: Record<string, unknown>;
}

export async function createOrUpdateI9ProtectedEmployeeData(
  requestId: string,
  input: ProtectedEmployeeInput,
  createdByUserId: string
): Promise<void> {
  if (!isProtectedDataEncryptionConfigured()) {
    throw new Error("SECURE_PORTAL_CONFIGURATION_REQUIRED: PROTECTED_DATA_ENCRYPTION_KEY is not set.");
  }
  const database = getDb();
  const existing = await database
    .select()
    .from(i9ProtectedEmployeeData)
    .where(eq(i9ProtectedEmployeeData.newHireRequestId, requestId));

  const values = {
    newHireRequestId: requestId,
    employeeNameEncrypted: encryptToColumn(input.employeeName),
    employeeContactEncrypted: input.employeeContact ? encryptToColumn(input.employeeContact) : null,
    ssnEncrypted: input.ssn ? encryptToColumn(input.ssn) : null,
    ssnLastFour: input.ssn ? input.ssn.replace(/\D/g, "").slice(-4) : null,
    documentInfoEncrypted: input.documentInfo ? encryptToColumn(JSON.stringify(input.documentInfo)) : null,
    createdByUserId,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await database.update(i9ProtectedEmployeeData).set(values as any).where(eq(i9ProtectedEmployeeData.id, existing[0].id));
  } else {
    await database.insert(i9ProtectedEmployeeData).values(values as any);
  }
}

/** Masked view — safe for list screens. Never returns SSN/document values. */
export async function getI9ProtectedEmployeeDataMasked(requestId: string) {
  const database = getDb();
  const rows = await database.select().from(i9ProtectedEmployeeData).where(eq(i9ProtectedEmployeeData.newHireRequestId, requestId));
  const row = rows[0];
  if (!row) return null;
  let employeeName = "(on file)";
  try {
    employeeName = decryptFromColumn(row.employeeNameEncrypted);
  } catch {
    /* leave placeholder if decryption fails */
  }
  return {
    hasData: true,
    employeeName,
    ssnMasked: row.ssnLastFour ? `***-**-${row.ssnLastFour}` : null,
    hasDocumentInfo: !!row.documentInfoEncrypted,
  };
}

/** Full reveal — MUST be called only from an audited, role-checked route. */
export async function revealI9ProtectedEmployeeData(requestId: string) {
  const database = getDb();
  const rows = await database.select().from(i9ProtectedEmployeeData).where(eq(i9ProtectedEmployeeData.newHireRequestId, requestId));
  const row = rows[0];
  if (!row) return null;
  return {
    employeeName: decryptFromColumn(row.employeeNameEncrypted),
    employeeContact: row.employeeContactEncrypted ? decryptFromColumn(row.employeeContactEncrypted) : null,
    ssn: row.ssnEncrypted ? decryptFromColumn(row.ssnEncrypted) : null,
    documentInfo: row.documentInfoEncrypted ? JSON.parse(decryptFromColumn(row.documentInfoEncrypted)) : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CaseDeadline
// ─────────────────────────────────────────────────────────────────────────────

export async function recordI9CaseDeadline(data: {
  newHireRequestId: string;
  deadlineType: string;
  deadlineDate: string;
  source: "everify_displayed" | "informational_calculator";
  enteredByUserId?: string;
  notes?: string;
}) {
  const database = getDb();
  const [row] = await database.insert(i9CaseDeadlines).values(data as any).returning();
  return row;
}
export async function listI9CaseDeadlines(requestId: string) {
  const database = getDb();
  return database.select().from(i9CaseDeadlines).where(eq(i9CaseDeadlines.newHireRequestId, requestId));
}

// ─────────────────────────────────────────────────────────────────────────────
// AuditEvent (append-only)
// ─────────────────────────────────────────────────────────────────────────────

export async function logI9Audit(entry: {
  actorUserId?: string;
  actorRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  clientCompanyId?: string;
  details?: object;
  ipAddress?: string;
}): Promise<void> {
  try {
    const database = getDb();
    await database.insert(i9AuditEvents).values({ ...entry, details: entry.details || {} } as any);
  } catch {
    // Audit logging must never block the primary action, but never throw here
    // silently in a way that hides a real outage either — surfaced via logs.
    console.error("i9 audit log write failed", entry.action);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9Notification(data: {
  clientCompanyId?: string;
  recipientUserId?: string;
  event: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  inPortalMessage: string;
  emailSent?: boolean;
}) {
  const database = getDb();
  const [row] = await database.insert(i9Notifications).values(data as any).returning();
  return row;
}
/** Notifications are created scoped to either a specific recipientUserId
 *  (rare — used when a notification is genuinely about one person) or a
 *  clientCompanyId (the common case — "your company's request was
 *  submitted" is relevant to every user at that company, not one). A user
 *  needs both matched: their own direct notifications, plus everything
 *  addressed to their company. LBS internal staff (no clientCompanyId) only
 *  ever see notifications addressed to them directly. */
export async function listI9NotificationsForUser(userId: string, clientCompanyId?: string | null) {
  const database = getDb();
  const condition = clientCompanyId
    ? or(eq(i9Notifications.recipientUserId, userId), eq(i9Notifications.clientCompanyId, clientCompanyId))
    : eq(i9Notifications.recipientUserId, userId);
  return database.select().from(i9Notifications).where(condition).orderBy(desc(i9Notifications.createdAt));
}

export async function markI9NotificationRead(id: string): Promise<void> {
  const database = getDb();
  await database.update(i9Notifications).set({ readAt: new Date() } as any).where(eq(i9Notifications.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// Usage / billing
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateI9UsageRecord(clientCompanyId: string, monthYear: string, casesIncluded: number) {
  const database = getDb();
  const existing = await database
    .select()
    .from(i9UsageRecords)
    .where(and(eq(i9UsageRecords.clientCompanyId, clientCompanyId), eq(i9UsageRecords.monthYear, monthYear)));
  if (existing[0]) return existing[0];
  const [row] = await database.insert(i9UsageRecords).values({ clientCompanyId, monthYear, casesIncluded } as any).returning();
  return row;
}

export async function incrementI9UsageOnCaseClose(clientCompanyId: string, monthYear: string, casesIncluded: number, additionalCaseCents: number) {
  const database = getDb();
  const record = await getOrCreateI9UsageRecord(clientCompanyId, monthYear, casesIncluded);
  const casesUsed = record.casesUsed + 1;
  const additionalCases = Math.max(0, casesUsed - record.casesIncluded);
  const additionalCharge = additionalCases > (record.additionalCases ?? 0) ? additionalCaseCents : 0;
  await database
    .update(i9UsageRecords)
    .set({
      casesUsed,
      additionalCases,
      additionalCaseChargeCents: (record.additionalCaseChargeCents ?? 0) + additionalCharge,
    } as any)
    .where(eq(i9UsageRecords.id, record.id));
}

export async function approveI9UsageRecord(id: string, approvedByUserId: string) {
  const database = getDb();
  await database
    .update(i9UsageRecords)
    .set({ approvalStatus: "approved", approvedByUserId, approvedAt: new Date() } as any)
    .where(eq(i9UsageRecords.id, id));
}

export async function listI9UsageRecordsPendingApproval() {
  const database = getDb();
  return database.select().from(i9UsageRecords).where(eq(i9UsageRecords.approvalStatus, "pending_review"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports (least-privilege: internal reference numbers only, never SSNs)
// ─────────────────────────────────────────────────────────────────────────────

export async function getI9MonthlyCaseVolumeReport(clientCompanyId?: string) {
  const database = getDb();
  const base = database
    .select({
      monthYear: dsql<string>`to_char(${i9NewHireRequests.createdAt}, 'YYYY-MM')`,
      status: i9NewHireRequests.status,
      count: dsql<number>`count(*)::int`,
    })
    .from(i9NewHireRequests)
    .groupBy(dsql`to_char(${i9NewHireRequests.createdAt}, 'YYYY-MM')`, i9NewHireRequests.status);
  return clientCompanyId ? base.where(eq(i9NewHireRequests.clientCompanyId, clientCompanyId)) : base;
}

// ─────────────────────────────────────────────────────────────────────────────
// Case result recording (dedicated helper, keeps the raw update out of routes)
// ─────────────────────────────────────────────────────────────────────────────

export async function recordI9CaseResult(
  requestId: string,
  data: { everifyCaseNumber: string; everifyInitialResult: string },
  actorUserId: string,
  note?: string
): Promise<void> {
  const database = getDb();
  await database
    .update(i9NewHireRequests)
    .set({
      everifyCaseNumber: data.everifyCaseNumber,
      everifyInitialResult: data.everifyInitialResult,
      everifyCaseCreatedAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .where(eq(i9NewHireRequests.id, requestId));
  await updateI9NewHireRequestStatus(requestId, "case_created", actorUserId, note);
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthorizedRepresentativeDesignation
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9AuthorizedRepDesignation(data: {
  clientCompanyId: string;
  employerLegalName: string;
  employeeNameOrClass: string;
  designatedLbsRepresentativeName: string;
  scopeOfAuthorization: string;
  appointmentType: "in_office" | "mobile";
  location: string;
  effectiveDate: string;
  employerAcknowledgedResponsibility: boolean;
  signedByName?: string;
}) {
  const database = getDb();
  const [row] = await database
    .insert(i9AuthorizedRepDesignations)
    .values({ ...data, signedAt: data.signedByName ? new Date() : null } as any)
    .returning();
  return row;
}

export async function listI9AuthorizedRepDesignationsForCompany(clientCompanyId: string) {
  const database = getDb();
  return database.select().from(i9AuthorizedRepDesignations).where(eq(i9AuthorizedRepDesignations.clientCompanyId, clientCompanyId));
}

export async function getI9AuthorizedRepDesignation(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9AuthorizedRepDesignations).where(eq(i9AuthorizedRepDesignations.id, id));
  return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment (I-9 specific)
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9Appointment(data: {
  clientCompanyId: string;
  hiringSiteId?: string;
  appointmentType: "in_office_examination" | "mobile_examination" | "hiring_event";
  authorizedRepDesignationId?: string;
  employeeCountEstimate?: number;
  i9Notes?: string;
}) {
  const database = getDb();
  const [row] = await database.insert(i9Appointments).values({ ...data, status: "requested" } as any).returning();
  return row;
}

export async function getI9Appointment(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9Appointments).where(eq(i9Appointments.id, id));
  return rows[0] ?? null;
}

export async function confirmI9Appointment(id: string): Promise<void> {
  const database = getDb();
  await database.update(i9Appointments).set({ status: "confirmed" } as any).where(eq(i9Appointments.id, id));
}

export async function listI9AppointmentsForCompany(clientCompanyId: string) {
  const database = getDb();
  return database.select().from(i9Appointments).where(eq(i9Appointments.clientCompanyId, clientCompanyId));
}

// ─────────────────────────────────────────────────────────────────────────────
// SecureDocument
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9SecureDocument(data: {
  id: string;
  clientCompanyId: string;
  relatedNewHireRequestId?: string;
  documentType: string;
  originalFilename: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
}) {
  const database = getDb();
  const [row] = await database.insert(i9SecureDocuments).values({ ...data, malwareScanStatus: "not_scanned" } as any).returning();
  return row;
}

export async function getI9SecureDocument(id: string) {
  const database = getDb();
  const rows = await database.select().from(i9SecureDocuments).where(eq(i9SecureDocuments.id, id));
  return rows[0] ?? null;
}

export async function softDeleteI9SecureDocument(id: string): Promise<void> {
  const database = getDb();
  await database.update(i9SecureDocuments).set({ deletedAt: new Date() } as any).where(eq(i9SecureDocuments.id, id));
}

// ─────────────────────────────────────────────────────────────────────────────
// RetentionAction
// ─────────────────────────────────────────────────────────────────────────────

export async function createI9RetentionAction(data: {
  clientCompanyId: string;
  actionType: "export" | "delete" | "legal_hold_applied" | "legal_hold_released";
  targetEntityType?: string;
  targetEntityId?: string;
  performedByUserId: string;
  reason?: string;
}) {
  const database = getDb();
  const [row] = await database.insert(i9RetentionActions).values(data as any).returning();
  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// AuditEvent / SecurityIncident listings (admin-only reports)
// ─────────────────────────────────────────────────────────────────────────────

export async function listI9AuditEvents(limit = 500) {
  const database = getDb();
  return database.select().from(i9AuditEvents).orderBy(desc(i9AuditEvents.createdAt)).limit(limit);
}

export async function listI9SecurityIncidents() {
  const database = getDb();
  return database.select().from(i9SecurityIncidents).orderBy(desc(i9SecurityIncidents.createdAt));
}

export async function recordI9SecurityIncident(data: {
  category: string;
  severity?: "low" | "medium" | "high";
  description: string;
  relatedUserId?: string;
  ipAddress?: string;
}) {
  const database = getDb();
  const [row] = await database.insert(i9SecurityIncidents).values(data as any).returning();
  return row;
}

export async function getI9RequestsByHiringSite(clientCompanyId: string) {
  const database = getDb();
  return database
    .select({
      hiringSiteId: i9NewHireRequests.hiringSiteId,
      status: i9NewHireRequests.status,
      count: dsql<number>`count(*)::int`,
    })
    .from(i9NewHireRequests)
    .where(eq(i9NewHireRequests.clientCompanyId, clientCompanyId))
    .groupBy(i9NewHireRequests.hiringSiteId, i9NewHireRequests.status);
}
