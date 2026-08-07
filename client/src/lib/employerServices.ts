// Shared content for the LBS New-Hire Verification & Form I-9 Support employer-services
// offering. Centralized here so pricing/copy stays consistent across the landing page,
// the print-friendly pricing sheet, and the service-agreement draft.

export const EMPLOYER_BASE_ROUTE = "/employer-services/new-hire-verification";
export const EMPLOYER_AGREEMENT_ROUTE = "/employer-services/new-hire-verification/agreement";
export const EMPLOYER_INTAKE_ROUTE = "/employer-services/new-hire-verification/intake";
export const EMPLOYER_PRICING_SHEET_ROUTE = "/employer-services/new-hire-verification/pricing-sheet";

export const EVERIFY_AGENT_DESCRIPTION =
  "LBS is enrolled as an E-Verify Employer Agent and provides E-Verify case-management and Form I-9 administrative support for participating employers.";

export const EVERIFY_FOOTER_DISCLAIMER =
  "Linton Business Solutions LLC is an independent private company and is not affiliated with, certified by, endorsed by, or acting on behalf of the U.S. Department of Homeland Security, U.S. Citizenship and Immigration Services, or E-Verify. LBS provides administrative employer-support services and does not provide immigration legal advice.";

export const NO_LEGAL_ADVICE_NOTE =
  "This information is provided for general administrative guidance. Employers remain responsible for their Form I-9 and E-Verify obligations and should consult qualified legal counsel regarding specific legal questions.";

export const CONSENT_TEXT =
  "I agree that Linton Business Solutions LLC may contact me regarding employer-support services. Submitting this form does not enroll my company in E-Verify or establish a client relationship.";

export const SENSITIVE_DATA_WARNING =
  "Do not submit employee Form I-9 information, Social Security numbers, identity documents, immigration records, or other sensitive employee information through this form.";

export const DESIRED_SERVICE_OPTIONS = [
  "Monthly E-Verify case management",
  "Form I-9 administrative support",
  "In-office document examination",
  "Mobile document examination",
  "Hiring-event support",
  "Form I-9 file review",
  "Manager training",
  "Not sure yet",
] as const;

export const CONSULTATION_METHOD_OPTIONS = ["Phone", "Email", "Video Call", "In-Person"] as const;

export const EMPLOYEE_COUNT_OPTIONS = ["1–5", "6–20", "21–50", "51–100", "101–250", "250+"] as const;

export const NEW_HIRES_PER_MONTH_OPTIONS = ["1–5", "6–15", "16–30", "31–60", "60+"] as const;

export const HIRING_LOCATIONS_OPTIONS = ["1", "2–3", "4–10", "11+"] as const;

export interface EmployerManagedItem {
  title: string;
  copy: string;
  icon: string; // lucide-react icon name, resolved by the consuming page
  disclaimer?: string;
}

export const managedServices: EmployerManagedItem[] = [
  {
    title: "Client Company Enrollment",
    icon: "ClipboardCheck",
    copy: "We help enroll your business under LBS's E-Verify Employer Agent account and coordinate the information and agreements required to activate your company.",
  },
  {
    title: "E-Verify Case Creation",
    icon: "FilePlus2",
    copy: "LBS creates cases using information provided from the employee's completed Form I-9 and tracks each case through the appropriate result.",
  },
  {
    title: "Case Monitoring and Deadlines",
    icon: "CalendarClock",
    copy: "We monitor case statuses, action dates, referral periods, and follow-up requirements so important case activity does not get overlooked.",
  },
  {
    title: "Case Documentation",
    icon: "FolderCheck",
    copy: "Your company receives organized case-number documentation and records to support its Form I-9 and onboarding files.",
  },
  {
    title: "Mismatch Notice Administration",
    icon: "AlertTriangle",
    copy: "LBS assists with the administrative process for Further Action Notices, referral paperwork, status tracking, and required employee communication steps.",
    disclaimer: "LBS does not determine immigration status or provide immigration legal advice.",
  },
  {
    title: "Form I-9 Administrative Support",
    icon: "FileCheck2",
    copy: "We help employers maintain an organized Form I-9 workflow, review forms for administrative completeness, and identify missing or inconsistent entries.",
  },
  {
    title: "In-Person Document Examination",
    icon: "UserCheck",
    copy: "When designated by the employer as its authorized representative, trained LBS personnel can meet with a new employee to physically examine acceptable Form I-9 documents and complete the employer-authorized examination process.",
    disclaimer: "The employer remains responsible for Form I-9 compliance and for the actions of its designated authorized representative.",
  },
  {
    title: "Mobile Employer Services",
    icon: "Car",
    copy: "LBS can travel to an employer's location for scheduled document-examination appointments, onboarding sessions, or hiring events.",
  },
  {
    title: "Monthly Employer Reporting",
    icon: "BarChart3",
    copy: "Receive a clear monthly summary of cases processed, case statuses, additional case activity, and services performed for your company.",
  },
  {
    title: "Manager Training",
    icon: "GraduationCap",
    copy: "LBS provides administrative training on consistent Form I-9 workflows, E-Verify timing, documentation, mismatches, privacy, and prohibited practices.",
  },
];

export interface MonthlyPlan {
  id: "essential" | "business" | "highVolume";
  name: string;
  badge?: string;
  price: string;
  setupNote: string;
  caseLimit: string;
  features: string[];
  additionalCase: string;
  cta: string;
}

export const monthlyPlans: MonthlyPlan[] = [
  {
    id: "essential",
    name: "Essential",
    price: "$49",
    setupNote: "One-time setup fee applies",
    caseLimit: "Up to 3 E-Verify cases monthly",
    features: [
      "Up to 3 E-Verify cases monthly",
      "Client account management",
      "Case-status monitoring",
      "Case-number documentation",
    ],
    additionalCase: "Additional cases: $15 each",
    cta: "Choose Essential",
  },
  {
    id: "business",
    name: "Business",
    badge: "Most Popular",
    price: "$99",
    setupNote: "$99 one-time setup fee",
    caseLimit: "Up to 10 E-Verify cases monthly",
    features: [
      "Up to 10 E-Verify cases monthly",
      "Client account management",
      "Case-status monitoring",
      "Case-number documentation",
      "Mismatch-notice administration",
      "Monthly activity report",
      "Email support",
    ],
    additionalCase: "Additional cases: $12 each",
    cta: "Choose Business",
  },
  {
    id: "highVolume",
    name: "High-Volume",
    price: "$199",
    setupNote: "One-time setup fee applies",
    caseLimit: "Up to 30 E-Verify cases monthly",
    features: [
      "Up to 30 E-Verify cases monthly",
      "Priority case processing",
      "Client account management",
      "Case monitoring",
      "Monthly compliance activity report",
      "Manager support",
    ],
    additionalCase: "Additional cases: $9 each",
    cta: "Choose High-Volume",
  },
];

export const featuredPackage = {
  name: "LBS Employee Onboarding Compliance",
  price: "$99",
  priceSuffix: "per month",
  setupNote: "Plus a one-time $99 client setup fee.",
  includes: [
    "Client-company E-Verify enrollment assistance",
    "Up to 10 E-Verify cases per month",
    "Case-status monitoring",
    "Case-number documentation",
    "Mismatch-notice administration",
    "Monthly employer activity report",
    "Email support",
    "Additional cases for $12 each",
  ],
};

export const monthlyPlansNote =
  "Monthly plans cover administrative services provided by LBS. Government systems and E-Verify enrollment are provided without charge by the federal government. LBS fees cover client setup, case administration, monitoring, documentation, reporting, and support.";

export interface PayAsYouGoItem {
  label: string;
  price: string;
}

export const payAsYouGoServices: PayAsYouGoItem[] = [
  { label: "New client enrollment and setup", price: "Starting at $99" },
  { label: "E-Verify case processing", price: "Starting at $20 per case" },
  { label: "Form I-9 administrative review plus E-Verify case", price: "Starting at $45" },
  { label: "In-office document examination", price: "$39 per employee" },
  { label: "Mobile document-examination appointment", price: "Starting at $95, plus applicable travel" },
  { label: "Mismatch administration", price: "Starting at $49" },
  { label: "Hiring-event support", price: "Starting at $350" },
  { label: "Administrative Form I-9 file review", price: "Starting at $25 per form" },
];

export const payAsYouGoNote =
  "Final pricing may depend on hiring volume, number of locations, service urgency, travel, record condition, and the level of administrative support requested.";

export interface HowItWorksStep {
  step: number;
  title: string;
  copy: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  { step: 1, title: "Choose a Service Plan", copy: "Select a monthly plan or request pay-as-you-go support based on your hiring volume." },
  { step: 2, title: "Complete Client Enrollment", copy: "LBS collects the company information required to enroll your business as a participating client and coordinates the applicable E-Verify agreement." },
  { step: 3, title: "Establish Your Workflow", copy: "Choose whether your company will complete its own Form I-9 process, use LBS for administrative review, or designate LBS personnel for approved in-person document examination." },
  { step: 4, title: "Process and Monitor Cases", copy: "LBS creates and monitors cases, provides case documentation, assists with administrative notices, and sends employer reports." },
];

export const industriesServed: string[] = [
  "Home-health and personal-care agencies",
  "Staffing and recruiting companies",
  "Trucking and transportation companies",
  "Construction contractors",
  "Janitorial and security companies",
  "Restaurants and hospitality businesses",
  "Childcare centers",
  "Auto dealerships",
  "Warehouses and logistics companies",
  "Small federal contractors",
  "Apartment-management companies",
  "Temporary and seasonal employers",
];

export interface CompliancePoint {
  text: string;
}

export const compliancePoints: string[] = [
  "E-Verify is used only after a job offer has been accepted and Form I-9 has been completed.",
  "It may not be used to pre-screen applicants.",
  "Employers must apply the process consistently.",
  "Employees may not be selected for verification based on citizenship, immigration status, national origin, name, language, or appearance.",
  "A mismatch does not automatically mean an employee is unauthorized to work.",
  "No adverse action may be taken solely because a mismatch is pending.",
  "Employee information must be handled privately and securely.",
  "LBS provides administrative support and does not provide immigration legal advice.",
];

export interface EmployerFaq {
  q: string;
  a: string;
}

export const employerFaqs: EmployerFaq[] = [
  {
    q: "Is LBS part of DHS or USCIS?",
    a: "No. Linton Business Solutions LLC is an independent private company. LBS is enrolled as an E-Verify Employer Agent and provides administrative case-management services to participating employers. LBS is not endorsed or certified by DHS, USCIS, or E-Verify.",
  },
  {
    q: "Does E-Verify replace Form I-9?",
    a: "No. Employers must first complete Form I-9. E-Verify uses information from the completed form to create the case.",
  },
  {
    q: "Can LBS verify job applicants before they are hired?",
    a: "No. E-Verify may not be used to pre-screen job applicants. The employee must first accept an offer of employment and complete Form I-9.",
  },
  {
    q: "Can LBS examine an employee's documents?",
    a: "An employer may designate an LBS representative as its authorized representative for the physical document-examination process. The employer remains responsible for Form I-9 compliance.",
  },
  {
    q: "Is Form I-9 examination a notarial service?",
    a: "No. Form I-9 document examination is an employer-authorized administrative function, not a notarization.",
  },
  {
    q: "What happens if an employee receives a mismatch?",
    a: "LBS can assist with the required administrative notices, documentation, referrals, deadline tracking, and status monitoring. A mismatch does not automatically mean the employee is unauthorized to work.",
  },
  {
    q: "Does LBS provide immigration legal advice?",
    a: "No. LBS provides administrative employer support and does not offer immigration legal advice or determine an employee's immigration status.",
  },
  {
    q: "Can LBS serve companies with multiple locations?",
    a: "Yes. LBS can discuss account structures, hiring locations, monthly case volumes, mobile services, and reporting requirements during the consultation.",
  },
  {
    q: "How quickly must an E-Verify case be created?",
    a: "Cases are generally created no later than the third business day after the employee begins work for pay, based on the completed Form I-9. The employer remains responsible for providing accurate information to LBS on time.",
  },
  {
    q: "Can LBS handle hiring events?",
    a: "Yes. LBS can provide scheduled onsite administrative support, document-examination services when properly designated, case processing, and post-event reporting.",
  },
];

export const FEDERAL_CONTRACTOR_OPTIONS = ["Yes", "No", "Not sure"] as const;

export const INTAKE_PLAN_OPTIONS = [
  { id: "essential", label: "Essential — $49/month" },
  { id: "business", label: "Business — $99/month (Most Popular)" },
  { id: "highVolume", label: "High-Volume — $199/month" },
  { id: "payAsYouGo", label: "Pay-as-you-go (no monthly plan)" },
  { id: "notSure", label: "Not sure yet" },
] as const;

export const ADD_ON_OPTIONS = [
  "In-office document examination",
  "Mobile document examination",
  "Hiring-event support",
  "Form I-9 file review",
  "Manager training",
] as const;

// ── Sales-funnel content (landing page) ──────────────────────────────────
// Added for the conversion-focused funnel rebuild: pain points, the
// "E-Verify is free, your time isn't" transparency section, the DIY-vs-LBS
// comparison table, and the post-enrollment timeline. Kept as data here,
// consistent with the rest of this file, so copy stays centralized and easy
// to revise without touching the page component.

export interface PainPoint {
  title: string;
  copy: string;
  icon: string;
}

export const employerPainPoints: PainPoint[] = [
  { title: "Employer Enrollment", icon: "ClipboardCheck", copy: "Getting a company set up correctly as an E-Verify participant takes time your team doesn't always have." },
  { title: "Creating E-Verify Cases", icon: "FilePlus2", copy: "Cases have to be created accurately and on time for every eligible new hire, every month." },
  { title: "Tracking Case Status", icon: "CalendarClock", copy: "Cases requiring additional action need to be caught and followed up on before deadlines pass." },
  { title: "Verification Documentation", icon: "FolderCheck", copy: "Keeping organized records for your Form I-9 and onboarding files takes ongoing administrative attention." },
];

export interface WhatLbsHandlesCard {
  title: string;
  copy: string;
  icon: string;
}

export const whatLbsHandlesCards: WhatLbsHandlesCard[] = [
  { title: "Employer Enrollment", icon: "ClipboardCheck", copy: "LBS helps guide your business through the employer-agent enrollment process and required setup." },
  { title: "New-Hire Case Processing", icon: "FilePlus2", copy: "Submit eligible new-hire information through the LBS workflow and LBS handles the applicable E-Verify case-processing steps." },
  { title: "Case Tracking", icon: "CalendarClock", copy: "LBS monitors case status, identifies cases requiring additional action, and keeps the employer informed." },
  { title: "Verification Records", icon: "FolderCheck", copy: "Receive organized case documentation and verification records for your employment files." },
];

export interface GettingStartedStep {
  step: string;
  title: string;
  copy: string;
}

export const gettingStartedSteps: GettingStartedStep[] = [
  { step: "01", title: "Enroll Your Company", copy: "Complete the employer enrollment process and applicable service agreement." },
  { step: "02", title: "Submit Your New Hires", copy: "Submit eligible new-hire verification requests securely through the LBS employer workflow." },
  { step: "03", title: "LBS Handles the Case", copy: "LBS processes the applicable E-Verify case, tracks the status, and provides verification documentation." },
];

// What a business handles on its own today, vs. what LBS's administrative
// workflow takes over. The final row is deliberately the same on both
// sides — the employer's legal responsibility never transfers to LBS, and
// the comparison table should say so plainly rather than imply otherwise.
export interface DiyComparisonRow {
  task: string;
  diy: string;
  lbs: string;
}

export const diyComparisonRows: DiyComparisonRow[] = [
  { task: "Employer enrollment administration", diy: "Your staff", lbs: "LBS assists" },
  { task: "Case creation", diy: "Your staff", lbs: "LBS" },
  { task: "Case tracking", diy: "Your staff", lbs: "LBS" },
  { task: "Workflow support when action is required", diy: "Your staff", lbs: "LBS provides case support/instructions" },
  { task: "Verification documentation", diy: "Your staff organizes it", lbs: "Organized case documentation" },
  { task: "Staff administrative time", diy: "Higher", lbs: "Reduced" },
  { task: "Employer retains legal responsibility", diy: "Yes", lbs: "Yes" },
];

export const whyPayHeadlinePoints: string[] = [
  "Employer enrollment administration",
  "Staff familiarity with E-Verify procedures",
  "Case creation",
  "Case deadlines",
  "Case-status tracking",
  "Mismatch workflow",
  "Employee notices",
  "Verification records",
  "Ongoing administrative processing",
];

export interface TimelineStep {
  label: string;
  copy: string;
}

export const postEnrollmentTimeline: TimelineStep[] = [
  { label: "Today", copy: "Submit your employer enrollment." },
  { label: "Next", copy: "LBS reviews the enrollment and begins the applicable employer-agent setup process." },
  { label: "Activation", copy: "Complete applicable E-Verify enrollment and MOU requirements." },
  { label: "Ready", copy: "Begin submitting eligible new-hire verification requests through LBS." },
];

export const employersServedCards: { title: string; copy: string; icon: string }[] = [
  { title: "Staffing Agencies", icon: "ClipboardCheck", copy: "Support frequent new-hire processing without adding another administrative burden to your internal staff." },
  { title: "Home-Health Agencies", icon: "UserCheck", copy: "Keep caregiver onboarding moving while your team focuses on clients and operations." },
  { title: "Trucking & Transportation Companies", icon: "Car", copy: "Simplify recurring verification tasks for drivers and operational employees." },
  { title: "Contractors & Service Companies", icon: "FileCheck2", copy: "Maintain an organized new-hire verification process as your workforce grows." },
  { title: "Small Businesses", icon: "Building2", copy: "Get professional administrative support without maintaining a dedicated HR verification team." },
  { title: "Multi-Location Employers", icon: "FolderCheck", copy: "Centralize verification requests through one structured workflow." },
];

export const securityTrustPoints: { title: string; copy: string; icon: string }[] = [
  { title: "Secure Submission", icon: "ShieldCheck", copy: "Sensitive verification information should be submitted through the appropriate secure LBS workflow rather than ordinary unsecured communications whenever supported." },
  { title: "Controlled Access", icon: "FolderCheck", copy: "Access to verification information is limited according to business and operational requirements." },
  { title: "Confidential Handling", icon: "FileCheck2", copy: "Verification information is used for providing contracted services and legitimate operational/legal requirements." },
  { title: "Human Support", icon: "UserCheck", copy: "Employers have access to real support when case questions arise." },
];

export const onboardingChecklist: string[] = [
  "Legal business name",
  "DBA (if applicable)",
  "EIN",
  "Physical and mailing address",
  "Hiring locations",
  "Employee count",
  "NAICS category",
  "Federal-contractor status",
  "Authorized signer information",
  "E-Verify Memorandum of Understanding",
  "Signed LBS service agreement",
];
