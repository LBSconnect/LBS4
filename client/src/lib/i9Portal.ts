// ─────────────────────────────────────────────────────────────────────────────
// Shared client-side library for the New-Hire Verification & Form I-9 Support
// secure portal: route constants, response types, and the fetch wrapper used
// by every portal page. Mirrors employerServices.ts's role as the single
// source of truth for this domain's client-side conventions.
//
// Auth model note: unlike the "corporate" division's Bearer-token-in-
// localStorage pattern, this portal uses httpOnly session cookies (set by
// server/i9Auth.ts) plus a separate, JS-readable CSRF cookie that must be
// echoed back on every mutating request. `credentials: "include"` is
// required on every call so the session cookie is sent.
// ─────────────────────────────────────────────────────────────────────────────

export const PORTAL_BASE = "/employer-services/new-hire-verification/portal";
export const PORTAL_ROUTES = {
  login: `${PORTAL_BASE}/login`,
  register: `${PORTAL_BASE}/register`,
  forgotPassword: `${PORTAL_BASE}/forgot-password`,
  resetPassword: `${PORTAL_BASE}/reset-password`,
  dashboard: PORTAL_BASE,
  businessIntake: `${PORTAL_BASE}/business-intake`,
  hiringSites: `${PORTAL_BASE}/hiring-sites`,
  billing: `${PORTAL_BASE}/billing`,
  appointments: `${PORTAL_BASE}/appointments`,
  notifications: `${PORTAL_BASE}/notifications`,
  adminTools: `${PORTAL_BASE}/admin/tools`,
  requests: `${PORTAL_BASE}/requests`,
  newRequest: `${PORTAL_BASE}/requests/new`,
  requestDetail: (id: string) => `${PORTAL_BASE}/requests/${id}`,
  adminCompanies: `${PORTAL_BASE}/admin/companies`,
  adminCompanyDetail: (id: string) => `${PORTAL_BASE}/admin/companies/${id}`,
} as const;

// ─── Roles & statuses (kept in sync with shared/i9Schema.ts by hand — this is
//     a client bundle and cannot import server-only Drizzle table defs) ─────

export type I9Role =
  | "lbs_program_admin"
  | "lbs_case_processor"
  | "lbs_intake_billing"
  | "client_authorized_signer"
  | "client_limited_user";

export const I9_INTERNAL_ROLES: I9Role[] = ["lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"];

export function isInternalRole(role: I9Role): boolean {
  return role.startsWith("lbs_");
}

export const ROLE_LABELS: Record<I9Role, string> = {
  lbs_program_admin: "LBS Program Administrator",
  lbs_case_processor: "LBS Case Processor",
  lbs_intake_billing: "LBS Intake / Billing",
  client_authorized_signer: "Authorized Signer",
  client_limited_user: "Limited User",
};

export type I9ClientCompanyStatus =
  | "lead_qualified"
  | "plan_selected"
  | "lbs_agreement_pending"
  | "lbs_agreement_signed"
  | "setup_payment_pending"
  | "business_intake_pending"
  | "ready_for_everify_enrollment"
  | "everify_enrollment_entered_by_lbs"
  | "mou_signature_pending"
  | "mou_signed"
  | "hiring_sites_confirmed"
  | "workflow_training_pending"
  | "active"
  | "suspended"
  | "offboarding"
  | "terminated";

export const COMPANY_STATUS_LABELS: Record<I9ClientCompanyStatus, string> = {
  lead_qualified: "Lead Qualified",
  plan_selected: "Plan Selected",
  lbs_agreement_pending: "LBS Agreement Pending",
  lbs_agreement_signed: "LBS Agreement Signed",
  setup_payment_pending: "Setup Payment Pending",
  business_intake_pending: "Business Intake Pending",
  ready_for_everify_enrollment: "Ready for E-Verify Enrollment",
  everify_enrollment_entered_by_lbs: "E-Verify Enrollment Entered by LBS",
  mou_signature_pending: "MOU Signature Pending",
  mou_signed: "MOU Signed",
  hiring_sites_confirmed: "Hiring Sites Confirmed",
  workflow_training_pending: "Workflow Training Pending",
  active: "Active",
  suspended: "Suspended",
  offboarding: "Offboarding",
  terminated: "Terminated",
};

/** Mirrors server/i9Routes.ts's ONBOARDING_TRANSITIONS exactly — the server is
 *  the actual gate (this file has no authority), but the client needs the
 *  same map to only ever offer a transition the server will accept, rather
 *  than showing every status and letting most attempts fail with a 400. */
export const COMPANY_ONBOARDING_TRANSITIONS: Record<I9ClientCompanyStatus, I9ClientCompanyStatus[]> = {
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

export const COMPANY_ONBOARDING_ORDER: I9ClientCompanyStatus[] = [
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
];

export type I9RequestStatus =
  | "draft"
  | "submitted"
  | "deficient_client_action_required"
  | "ready_for_case_creation"
  | "assigned"
  | "case_created"
  | "employment_authorized"
  | "needs_more_time"
  | "mismatch_employee_decision_pending"
  | "mismatch_employee_taking_action"
  | "mismatch_employee_not_taking_action"
  | "referred_to_dhs"
  | "referred_to_ssa"
  | "referred_to_dhs_and_ssa"
  | "case_in_continuance"
  | "final_nonconfirmation"
  | "close_and_resubmit"
  | "closed"
  | "cancelled_duplicate";

export const REQUEST_STATUS_LABELS: Record<I9RequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  deficient_client_action_required: "Action Required",
  ready_for_case_creation: "Ready for Case Creation",
  assigned: "Assigned",
  case_created: "Case Created",
  employment_authorized: "Employment Authorized",
  needs_more_time: "Needs More Time",
  mismatch_employee_decision_pending: "Mismatch — Employee Decision Pending",
  mismatch_employee_taking_action: "Mismatch — Employee Taking Action",
  mismatch_employee_not_taking_action: "Mismatch — Employee Not Taking Action",
  referred_to_dhs: "Referred to DHS",
  referred_to_ssa: "Referred to SSA",
  referred_to_dhs_and_ssa: "Referred to DHS & SSA",
  case_in_continuance: "Case in Continuance",
  final_nonconfirmation: "Final Nonconfirmation",
  close_and_resubmit: "Closed — Resubmit",
  closed: "Closed",
  cancelled_duplicate: "Cancelled (Duplicate)",
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  deficient_client_action_required: "bg-amber-100 text-amber-800 border-amber-200",
  ready_for_case_creation: "bg-indigo-100 text-indigo-700 border-indigo-200",
  assigned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  case_created: "bg-blue-100 text-blue-700 border-blue-200",
  employment_authorized: "bg-green-100 text-green-700 border-green-200",
  needs_more_time: "bg-amber-100 text-amber-800 border-amber-200",
  mismatch_employee_decision_pending: "bg-amber-100 text-amber-800 border-amber-200",
  mismatch_employee_taking_action: "bg-amber-100 text-amber-800 border-amber-200",
  mismatch_employee_not_taking_action: "bg-amber-100 text-amber-800 border-amber-200",
  referred_to_dhs: "bg-orange-100 text-orange-800 border-orange-200",
  referred_to_ssa: "bg-orange-100 text-orange-800 border-orange-200",
  referred_to_dhs_and_ssa: "bg-orange-100 text-orange-800 border-orange-200",
  case_in_continuance: "bg-blue-100 text-blue-700 border-blue-200",
  final_nonconfirmation: "bg-red-100 text-red-700 border-red-200",
  close_and_resubmit: "bg-gray-100 text-gray-700 border-gray-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
  cancelled_duplicate: "bg-gray-100 text-gray-700 border-gray-200",
};
export function statusBadgeClass(status: string): string {
  return STATUS_BADGE_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
}

// ─── Data types (client-facing subset of the server records) ───────────────

export interface I9User {
  id: string;
  email: string;
  fullName: string;
  role: I9Role;
  clientCompanyId: string | null;
}

export interface I9ClientCompany {
  id: string;
  legalBusinessName: string;
  dba: string | null;
  einMasked: string | null;
  entityType: string | null;
  physicalAddress: string | null;
  mailingAddress: string | null;
  website: string | null;
  industry: string | null;
  naicsSector: string | null;
  totalEmployeeCount: number | null;
  averageMonthlyHires: number | null;
  federalContractorStatus: string | null;
  alreadyEnrolledInEverify: string | null;
  currentEmployerAgent: string | null;
  authorizedSignerName: string | null;
  authorizedSignerTitle: string | null;
  authorizedSignerEmail: string | null;
  authorizedSignerPhone: string | null;
  billingContactName: string | null;
  billingContactEmail: string | null;
  selectedPlanId: string | null;
  requestedAddOns: string[] | null;
  preferredStartDate: string | null;
  formI9WorkflowSelection: string | null;
  acknowledgedResponsibilities: boolean;
  status: I9ClientCompanyStatus;
  everifyCompanyId: string | null;
  mouSignerName: string | null;
  mouSignedDate: string | null;
  mouSecureReference: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface I9HiringSite {
  id: string;
  clientCompanyId: string;
  name: string;
  address: string;
  managerName: string | null;
  managerEmail: string | null;
  participationStatus: "pending" | "confirmed" | "not_participating";
  isActive: boolean;
  createdAt: string | null;
}

export interface I9NewHireRequest {
  id: string;
  internalRequestNumber: string;
  clientCompanyId: string;
  hiringSiteId: string;
  clientSubmitterUserId: string | null;
  assignedLbsProcessorUserId: string | null;
  serviceRequested: string;
  firstDayOfEmploymentForPay: string;
  formI9Section1CompletedDate: string | null;
  formI9Section2CompletedDate: string | null;
  section2LateReason: string | null;
  attestJobOfferAccepted: boolean;
  attestNotPreScreening: boolean;
  attestEmployeeChoseDocuments: boolean;
  attestListBHasPhoto: boolean | null;
  attestInformationAccurate: boolean;
  attestParticipatingHiringSite: boolean;
  clientNotes: string | null;
  status: I9RequestStatus;
  everifyCaseNumber: string | null;
  everifyCaseCreatedAt: string | null;
  everifyInitialResult: string | null;
  caseNumberRecordedOnI9: boolean | null;
  caseDetailsPageDelivered: boolean | null;
  linkedPriorRequestId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface I9CaseActivity {
  id: string;
  newHireRequestId: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string | null;
  note: string | null;
  createdAt: string | null;
}

export interface I9ServicePlan {
  id: string;
  slug: string;
  name: string;
  monthlyPriceCents: number;
  setupFeeCents: number;
  includedCasesPerMonth: number;
  additionalCaseCents: number;
  features: string[];
  stripeMonthlyPriceId: string | null;
  isActive: boolean;
  sortOrder: number;
}
export interface I9AddOn {
  id: string;
  slug: string;
  name: string;
  startingPriceCents: number;
  priceUnit: string;
  isActive: boolean;
}
export interface I9Subscription {
  id: string;
  clientCompanyId: string;
  servicePlanId: string;
  status: "pending" | "active" | "past_due" | "canceled";
  setupFeePaid: boolean;
  createdAt: string | null;
}
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface I9Notification {
  id: string;
  clientCompanyId: string | null;
  recipientUserId: string | null;
  event: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  inPortalMessage: string;
  emailSent: boolean;
  readAt: string | null;
  createdAt: string | null;
}

export interface I9UsageRecord {
  id: string;
  clientCompanyId: string;
  monthYear: string;
  casesIncluded: number;
  casesUsed: number;
  additionalCases: number;
  additionalCaseChargeCents: number;
  approvalStatus: "pending_review" | "approved" | "disputed";
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string | null;
}

export interface I9AuditEvent {
  id: string;
  actorUserId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  clientCompanyId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string | null;
}

export interface I9SecurityIncident {
  id: string;
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
  relatedUserId: string | null;
  ipAddress: string | null;
  status: "open" | "reviewed" | "resolved";
  reviewedByUserId: string | null;
  createdAt: string | null;
}

export interface I9AuthorizedRepDesignation {
  id: string;
  clientCompanyId: string;
  employerLegalName: string;
  employeeNameOrClass: string;
  designatedLbsRepresentativeName: string;
  scopeOfAuthorization: string;
  appointmentType: "in_office" | "mobile";
  location: string;
  effectiveDate: string;
  employerAcknowledgedResponsibility: boolean;
  signedByName: string | null;
  createdAt: string | null;
}

export interface I9Appointment {
  id: string;
  clientCompanyId: string;
  hiringSiteId: string | null;
  appointmentType: "in_office_examination" | "mobile_examination" | "hiring_event";
  authorizedRepDesignationId: string | null;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  employeeCountEstimate: number | null;
  i9Notes: string | null;
  createdAt: string | null;
}

export interface I9ClientAgreement {
  id: string;
  clientCompanyId: string;
  documentVersion: string;
  status: "pending" | "generated" | "awaiting_signature" | "signed" | "e_signature_not_configured";
  generatedDocumentHtml: string | null;
  signedDocumentSecureDocumentId: string | null;
  signedByName: string | null;
  signedAt: string | null;
  eSignatureProvider: string | null;
  createdAt: string | null;
}

export const SECURE_DOCUMENT_TYPES = [
  "signed_lbs_agreement",
  "everify_mou_copy",
  "further_action_notice",
  "authorized_rep_designation",
  "case_related_upload",
] as const;
export type SecureDocumentType = (typeof SECURE_DOCUMENT_TYPES)[number];
export const UPLOAD_ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix FileReader.readAsDataURL adds.
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export interface I9SystemStatus {
  databaseConfigured: boolean;
  protectedDataEncryptionConfigured: boolean;
  secureWorkflowAvailable: boolean;
  mfaAvailable: boolean;
  malwareScanningAvailable: boolean;
  eSignatureAvailable: boolean;
}

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

const CSRF_COOKIE_NAME = "i9_csrf";

function readCsrfCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export class I9ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "I9ApiError";
    this.status = status;
    this.details = details;
  }
}

/** All portal API calls go through this. GET/HEAD never send a CSRF header
 *  (the server doesn't require one for them); every other method attaches
 *  the CSRF cookie's value as X-CSRF-Token, matching requireI9Csrf's
 *  double-submit check in server/i9Auth.ts. */
export async function i9Api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = readCsrfCookie();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(path, { ...options, headers, credentials: "include" });

  let json: any = {};
  try {
    json = await res.json();
  } catch {
    // No JSON body (e.g. some error responses) — fall through with {}.
  }

  if (!res.ok) {
    throw new I9ApiError(json?.error || `Request failed (HTTP ${res.status})`, res.status, json?.details);
  }
  return json as T;
}

export function isI9Unauthorized(err: unknown): boolean {
  return err instanceof I9ApiError && err.status === 401;
}

export function isI9ServiceUnavailable(err: unknown): boolean {
  return err instanceof I9ApiError && err.status === 503;
}

// ─── Client-side mirror of shared/i9Schema.ts's SSN-pattern guard ───────────
// Duplicated (rather than imported from @shared/i9Schema, which pulls in
// drizzle-orm/pg-core table builders never proven to bundle for the browser)
// so free-text fields can warn inline before the same check runs server-side.
const SSN_LIKE_PATTERN = /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/;
export function containsLikelySensitivePattern(text: string): boolean {
  return SSN_LIKE_PATTERN.test(text);
}
export const SENSITIVE_FREE_TEXT_WARNING =
  "This looks like it may contain a Social Security number or similar identifier. Remove it before submitting — do not enter employee SSNs or document numbers in free-text fields.";
