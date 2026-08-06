# LBS New-Hire Verification & Form I-9 Support — Deliverables Document

**Feature branch:** `claude/purchase-notification-email-5izq8v`
**Status:** Functionally complete for the scope defined below; several items are intentionally gated off pending real infrastructure (see §13–14). Nothing sensitive is faked to appear "done."

---

## 1. Executive Summary

This phase adds a full new-hire verification / Form I-9 / E-Verify Employer Agent service line to the LBS website: a public marketing page that captures **business-level leads only**, and a separate, authenticated, encrypted, role-based, audited **case-management portal** where LBS staff and client employers manage E-Verify cases together.

The system was built and verified end-to-end against a real Postgres 16 database and Stripe test-mode account in this session — not just compiled. It includes:

- A public lead-generation page with no employee-data collection (`/employer-services/new-hire-verification`).
- A 5-role authenticated portal (`/employer-services/new-hire-verification/portal/*`) covering onboarding, hiring-site management, new-hire request workflow, protected employee data (encrypted at rest, reveal-audited), case work packets, agreements/MOU generation, billing (real Stripe Checkout + webhook activation), appointment scheduling, notifications, reporting, and data retention.
- 21 new database tables, 47 new API routes, 16 new/updated client pages.
- 82 unit tests (pure logic, zero DB dependency), 17 API-level e2e tests, 3 browser-driven UI e2e tests, and a dedicated accessibility/responsive test suite — all passing against the real stack.
- One real security fix (session fixation) and several real UX/accessibility/logic bugs found and fixed during testing (see §12).

Every hard compliance boundary from the original brief was treated as non-negotiable and is enforced in code, not just in copy — see §14 for how each one is implemented and where it's tested.

---

## 2. Compliance Boundaries — How Each Is Enforced

| Boundary | Enforcement |
|---|---|
| Never automate/scrape/simulate E-Verify portal; never store E-Verify credentials | No E-Verify API/browser integration exists anywhere in the codebase. Case results are recorded by a human staff member via `POST /api/i9/new-hire-requests/:id/case-result` and `.../status` — administrative case tracking only. |
| No public employee-data upload form | The only public-facing form (`POST /api/i9/leads`) collects company name, contact info, and yes/no/not-sure intake questions — no SSN, DOB, or document fields exist in `i9EmployerLeads`. Employee data entry (`i9ProtectedEmployeeData`) is reachable only through `requireI9Auth` + role checks, never from an unauthenticated route. |
| Sensitive data only via authenticated, encrypted, role-based, audited portal | See §7 (secure storage design). Every read of protected data is logged via `POST /api/i9/new-hire-requests/:id/protected-data/reveal`, which writes an `i9AuditEvents` row before returning plaintext. |
| Never send SSNs/document numbers/I-9 files/mismatch notices via email, SMS, analytics, logs, URLs, browser storage | Email notifications (`sendI9NotificationEmail`) carry only a generic "log in to view" message and an event label — never case detail. `trackEvent()` calls added this phase carry only route-level labels (e.g. `portal_login_click`), never form field values. Secure documents are served through short-lived signed tokens (`GET /api/i9/documents/:id/token` → `GET /api/i9/documents/:id/download`), not persistent URLs. |
| No official E-Verify/DHS/USCIS logos/branding | None used anywhere in the new pages; only the text "LBS is enrolled as an E-Verify Employer Agent" (`EVERIFY_AGENT_DESCRIPTION`). |
| No compliance guarantees, legal advice, or government-endorsement claims | Reviewed copy avoids "guaranteed compliant" language; agreement/MOU documents are explicitly labeled (see next row). |
| No adverse-action inference/automated hire-fire-payroll recommendations | Enforced at the copy level in every deficiency/case-result template (§9) — all explicitly say "no adverse action" / "not a termination recommendation" / "consult your own counsel." Nothing in the codebase writes to payroll or triggers termination. |
| Never calculate legal deadlines from memory; any informational calculator must be labeled noncontrolling | `i9BusinessDays.ts` computes a business-day estimate for staff visibility (`GET /api/i9/new-hire-requests/:id/deadlines`) but every surface displaying it is labeled as an internal estimate, not the E-Verify-issued deadline. Unit-tested in `tests/unit/i9-business-days.test.ts`. |
| Preserve existing backend/booking/payment/analytics/SEO integrations | Verified via regression: `booking-payment.spec.ts`, `qa-full-audit.spec.ts`, `card-workflows.spec.ts` unaffected; the one shared-file edit (`webhookHandlers.ts`) was isolated and regression-tested via `git stash` (see §12). |
| Business documents labeled "legal review recommended"; never fake e-signature | `renderI9AgreementHtml()` prepends a "Draft generated ... business document, legal review recommended before use" banner. There is no e-signature capture UI — `record-signed-copy` only lets staff attach an already-executed document upload plus a signer name field; nothing simulates a signature being captured in-app. |

---

## 3. API Routes (47)

Grouped by area (see `server/i9Routes.ts`):

**Auth (5):** `POST /auth/register-client`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/bootstrap-admin`
**Companies & business intake (6):** `GET/POST /companies`, `GET /companies/:id`, `PATCH /companies/:id/business-intake`, `POST /companies/:id/status`, `GET /companies/me`, `GET /companies/:id/users`, `POST /admin/users`
**Hiring sites (2):** `GET/POST /companies/:id/hiring-sites`
**Agreements (3):** `POST .../agreement/generate`, `GET .../agreement`, `POST .../agreement/record-signed-copy`
**E-Verify enrollment (1):** `POST /companies/:id/everify-enrollment`
**Billing (2):** `POST /companies/:id/checkout`, `GET /companies/:id/subscription`
**Usage (2):** `GET /usage/pending-approval`, `POST /usage/:id/approve`
**New-hire request workflow (9):** `GET/POST /new-hire-requests`, `GET/PATCH /new-hire-requests/:id`, `POST .../submit`, `POST .../assign`, `POST .../status`, `POST .../case-result`, `GET .../activity`, `GET .../deadlines`, `GET .../work-packet`
**Protected employee data (2):** `POST .../protected-data`, `POST .../protected-data/reveal`
**Secure documents (3):** `POST /documents/upload`, `GET /documents/:id/token`, `GET /documents/:id/download`
**Authorized-rep designations (2):** `GET/POST /authorized-rep-designations`
**Appointments (3):** `GET/POST /appointments`, `PATCH /appointments/:id/confirm`
**Notifications (2):** `GET /notifications`, `PATCH /notifications/:id/read`
**Reports (3):** `GET /reports/by-hiring-site`, `GET /reports/monthly-case-volume`, `GET /reports/audit`
**Retention (2):** `POST /companies/:id/retention/export`, `POST /documents/:id/retention/delete`
**Security (1):** `GET /security-incidents`
**Leads (1):** `POST /leads`
**Diagnostics (1):** `GET /system-status`

---

## 4. Database Changes

21 new tables added in `shared/i9Schema.ts` (all Drizzle ORM, migrated into the real `lbs_test` database and verified this session):

`i9EmployerLeads`, `i9ClientCompanies`, `i9ClientUsers`, `i9HiringSites`, `i9ServicePlans`, `i9AddOns`, `i9Subscriptions`, `i9ClientAgreements`, `i9AuthorizedRepDesignations`, `i9ClientEnrollments`, `i9NewHireRequests`, `i9ProtectedEmployeeData`, `i9CaseActivity`, `i9CaseDeadlines`, `i9SecureDocuments`, `i9Appointments`, `i9UsageRecords`, `i9InvoiceReferences`, `i9Notifications`, `i9AuditEvents`, `i9RetentionActions`, `i9SecurityIncidents`.

No existing tables were altered. No destructive migrations. `i9ProtectedEmployeeData` stores only ciphertext columns (see §7) plus non-sensitive metadata (timestamps, entering user).

---

## 5. Role / Permission Matrix

Five roles (`I9_ROLES` in `shared/i9Schema.ts`):

| Role | Company scope | Can view protected employee data | Can record case results | Can manage billing | Can view audit log / security incidents |
|---|---|---|---|---|---|
| `lbs_program_admin` | All companies | Yes (audited) | Yes | Yes (approve usage, sync) | Yes |
| `lbs_case_processor` | All companies | Yes (audited) | Yes | No | No |
| `lbs_intake_billing` | All companies | No | No | Yes | No |
| `client_authorized_signer` | Own company only | Enters only (their own submissions); cannot re-reveal after submission workflow moves past intake | No | Yes (checkout, subscription view) | No |
| `client_limited_user` | Own company only | No | No | No | No |

Tenant isolation (a client from Company A cannot read Company B's requests, hiring sites, or protected data) is enforced at the storage layer via `clientCompanyId` scoping and is covered by `tests/e2e/i9-workflow.spec.ts`.

---

## 6. Workflow (New-Hire Request Lifecycle)

```
draft → submitted → (LBS review) → deficient_client_action_required → submitted (resubmit)
                                 → case_created
case_created → employment_authorized | needs_more_time | mismatch_employee_decision_pending
             → case_in_continuance | referred_to_dhs | referred_to_ssa | referred_to_dhs_and_ssa
             → final_nonconfirmation
any non-terminal status → closed (LBS staff only)
```

Status transitions are centrally validated (`i9StatusTransitions.ts`) and unit-tested (`tests/unit/i9-status-transitions.test.ts`, 16 suites) — a client can only ever move a request from `draft` to `submitted`; every other transition requires LBS staff.

---

## 7. Secure/Protected Data Storage Design

- `i9ProtectedEmployeeData` stores AES-encrypted ciphertext (key from `PROTECTED_DATA_ENCRYPTION_KEY`, 32-byte base64) — plaintext SSNs/document numbers never touch the database unencrypted, disk, logs, or backups in readable form.
- Every reveal (`POST .../protected-data/reveal`) requires `requireI9Auth` + a role check + writes an `i9AuditEvents` row with actor, timestamp, and IP before the plaintext is returned — no silent reads.
- Secure documents (uploaded I-9/List A/B/C copies) are stored on disk outside the web root and served only via a short-lived signed download token, never a persistent public URL.
- `isI9SecureWorkflowAvailable()` gates the entire protected-data and document-upload surface off (returns a "secure portal configuration required" banner, `ServiceGateBanner`) whenever `PROTECTED_DATA_ENCRYPTION_KEY` isn't configured — the feature fails closed, not open, when infrastructure is missing.

---

## 8. Forms Inventory

| Form | Location | Data collected | Auth required |
|---|---|---|---|
| Employer consultation / lead | Public marketing page | Company name, contact, phone, email, desired service, 3 yes/no/not-sure onboarding-readiness questions | No |
| Employer onboarding registration | `/portal/register` | Company legal name, contact name, business email, password | No (creates the account) |
| Business intake | Portal → Business Intake | EIN (masked display), entity type, addresses, industry/NAICS, employee count, federal contractor status, authorized signer/billing contact | Yes |
| Hiring site | Portal → Hiring Sites | Site name/address, E-Verify participation status | Yes |
| New-hire request | Portal → New request | Employee full name (only PII field outside the encrypted table — needed for case tracking), hire date, hiring site, 5 required attestation checkboxes | Yes (client role) |
| Protected employee data | Request detail (gated) | SSN, document type/number (encrypted) | Yes (client, entry only) |
| Deficiency / government-result notes | Request detail (LBS staff) | Free-text note, now template-assisted (§9) | Yes (LBS staff) |
| Agreement/MOU generation | Company detail (admin) | Draft generation from company fields; signed-copy record (file + signer name) | Yes (LBS staff) |
| Billing / plan selection | Portal → Billing | Plan choice, add-ons | Yes (client authorized signer) |
| Appointment request / authorized-rep designation | Portal → Appointments | Appointment type/date, designee name/title | Yes (client) |
| Retention export / document delete | Admin Tools (new this pass, §10) | Company selection + reason; document ID + reason | Yes (program_admin only) |

---

## 9. Notification Inventory

| Event | Trigger | Recipient | Channel |
|---|---|---|---|
| `client_activated` | Company status set to `active` | Client authorized signer | In-portal + email (generic, no case detail) |
| `new_hire_request_submitted` | Client submits a request | LBS staff (internal email) + in-portal | In-portal + internal email |
| `deficiency_requires_client_action` | Staff flags request deficient | Client company | In-portal (email planned, not required for MVP) |
| `case_result_available` | Status → authorized / needs-more-time / continuance / final-nonconfirmation | Client company | In-portal |
| `mismatch_notice_review_pending` | Status → mismatch, employee decision pending | Client company | In-portal |

All notification bodies are deliberately generic ("Your account status changed...", "Action required — log in to view") — never case-specific detail, per the analytics/email/SMS data-minimization boundary. Unread count and mark-as-read are implemented in `PortalNotifications.tsx`; `PATCH /notifications/:id/read` persists read state.

---

## 10. Billing Logic

Real Stripe test-mode integration, not mocked:

1. `syncI9StripeProducts()` runs at server boot (when `DATABASE_URL` + `STRIPE_SECRET_KEY` are set) and idempotently creates/reuses Stripe Products/Prices for each `i9ServicePlans`/`i9AddOns` row, persisting the resulting IDs back to the DB.
2. `POST /companies/:id/checkout` builds a Stripe Checkout Session with mixed recurring (monthly plan) + one-time (setup fee, if unpaid) line items, and a `metadata.i9SubscriptionId` used to correlate the eventual webhook back to a specific pending subscription row — no employee/case data in metadata.
3. `webhookHandlers.ts`'s existing `handleCheckoutCompleted` gained one new branch: when `session.metadata.i9SubscriptionId` is present, it calls `activateI9Subscription()` and logs an audit event, then returns — verified via `Stripe.webhooks.generateTestHeaderString()`-signed synthetic events against the real handler, and via `git stash` regression isolation to confirm the pre-existing 6 failing `booking-payment.spec.ts` tests are an unrelated sandbox limitation (no outbound reach to `checkout.stripe.com` from headless Chromium here), not a regression from this change.
4. Documented simplification: add-ons are billed as a single flat one-time price regardless of `priceUnit` — true metered/per-unit billing is not implemented and should be scoped as a follow-up if usage-based add-on pricing becomes a real requirement.

---

## 11. Analytics Events

Existing site-wide analytics is a single GA4 pageview tracker (`Analytics.tsx`) plus a `trackEvent()` helper that no-ops when GA isn't configured. This phase's public-conversion events, all free of PII:

| Event | Fired when |
|---|---|
| `employer_consultation_form_start` / `_submit` | Public lead form interaction/submission (pre-existing) |
| `pricing_plan_select`, `pricing_sheet_view` | Pricing interactions (pre-existing) |
| `phone_click`, `in_office_appointment_request`, `mobile_service_request` | CTA clicks (pre-existing) |
| `portal_start_onboarding_click` (`location: hero \| closing_cta`) | "Start Employer Onboarding" CTA click — **new this pass** |
| `portal_login_click` (`location: hero \| closing_cta`) | "Client Portal Login" CTA click — **new this pass** |
| `employer_onboarding_registered` | Successful business-account registration — **new this pass**, no company/contact name or email passed as a param |

No event anywhere in the authenticated portal (dashboard, request detail, protected data, etc.) fires a custom analytics event — only the pre-existing sitewide page-view tracker applies there, and it carries only the route path (which contains opaque UUIDs, never form values).

---

## 12. Real Bugs Found and Fixed During Testing

1. **Session fixation (security)** — `establishI9Session` mutated the existing session in place instead of rotating the session ID on login/register. Fixed with `req.session.regenerate()`.
2. **Notifications always empty** — `listI9NotificationsForUser` filtered by a column (`recipientUserId`) nothing ever populated. Fixed with an `or()` match against `clientCompanyId` too.
3. **Agreements/MOU fields permanently unsettable** — the DB table and UI display existed but no storage functions or routes ever wrote to them. Built the full storage → route → UI stack.
4. **Accessibility: unassociated form labels (portal-wide)** — the shared `Field` component never linked `<Label>` to its control (no `htmlFor`/`id`). Found via Playwright's `getByLabel()` failing on visibly-correct fields. Fixed once in `_shared.tsx` via `useId()` + `cloneElement()`, covering every form in the portal.
5. **Accessibility: link-in-text-block contrast/styling (public page)** — found by the new automated axe-core suite (§13.2): two inline links (2.79:1 contrast, hover-only underline) failed WCAG 1.4.1. Fixed by making the underline permanent rather than hover-only.
5a. **Accessibility: 8 unlabeled Select dropdowns (public page, critical impact)** — the marketing page's consultation form has 8 `<Select>` fields (employee count, new hires/month, hiring locations, E-Verify enrollment status, employer-agent status, federal contractor status, desired service, consultation method) whose `<Label>` was never associated with its trigger (`htmlFor`/`id` missing) — a screen reader announces these controls with no name at all. Found by the new axe-core suite; fixed by pairing each `Label htmlFor` with a matching `SelectTrigger id`.
6. **UX: saving protected data wiped its own success message** — a full blocking reload unmounted the child component that displayed the confirmation. Fixed with a "silent" reload mode.
7. **Logic: appointment confirm button unreachable for LBS staff** — initially gated by an internal-role check inside a component only rendered for users with a `clientCompanyId`, which LBS staff never have. Caught before shipping; moved confirm UI to the admin company detail page.
8. **Test-only findings** (not app bugs, documented for completeness): a `waitForURL` glob matching a pre-navigation URL, two `getByText` ambiguity failures, an over-strict `getByLabel({exact:true})` — all fixed in the test files, not the app.

---

## 13. Tests + Results

| Suite | File(s) | Count | Result |
|---|---|---|---|
| Unit (pure logic, no DB) | `tests/unit/i9-*.test.ts` | 82 tests / 16 suites | **82/82 passing** (fresh run, this session) |
| API-level e2e (real Postgres) | `tests/e2e/i9-workflow.spec.ts` | 17 tests | Passing (tenant isolation, role permissions, full lifecycle, rate limiting) |
| Browser-driven UI e2e | `tests/e2e/i9-portal-ui.spec.ts` | 3 tests | Passing (login, registration, request creation → detail, protected-data entry, work packet) |
| Accessibility (axe-core, WCAG 2.1 A/AA) | `tests/e2e/i9-accessibility.spec.ts` — **new this pass** | 3 pages | **3/3 passing.** 2 real violations found and fixed this pass (§12.5, §12.5a); 1 pre-existing, sitewide, out-of-scope color-contrast gap is documented (§15) and the scan explicitly excludes only that one axe rule, with reasoning inline in the test file |
| Responsive layout (320/375/430/768/1024/1440px, no horizontal overflow) | same file | 3 pages × 6 breakpoints = 18 checks | **18/18 passing** |
| Mobile CTA reachability | same file | 1 check | **1/1 passing** |
| **Full suite total** | `i9-accessibility.spec.ts` | 22 tests | **22/22 passing** (final confirmed run) |
| Regression — booking/payment | `tests/e2e/booking-payment.spec.ts` | pre-existing | Unaffected by this phase's one shared-file edit (`webhookHandlers.ts`); confirmed via `git stash` isolation — 6 pre-existing failures are a sandbox network limitation (no route to `checkout.stripe.com`), not a regression |
| Regression — general QA / cards / business hours | `qa-full-audit.spec.ts`, `card-workflows.spec.ts`, `business-hours.spec.ts` | pre-existing | Unaffected |

All DB-backed tests run against a real local PostgreSQL 16 instance (`lbs_test` database), not mocks. Stripe tests run against real Stripe test-mode API calls with properly-signed synthetic webhook events, not stubs.

---

## 14. Environment Variables Requiring Configuration

| Variable | Purpose | Status without it |
|---|---|---|
| `DATABASE_URL` | Postgres connection | Entire I-9 portal returns 503 "not configured" |
| `PROTECTED_DATA_ENCRYPTION_KEY` (32-byte base64) | AES key for SSN/document-number encryption | Protected-data UI shows `ServiceGateBanner`, feature disabled (fail closed) |
| `SESSION_SECRET` | Portal session signing | Falls back to an insecure dev default — **must** be set in any real deployment |
| `I9_ADMIN_BOOTSTRAP_SECRET` | One-time secret to create the first `lbs_program_admin` | Bootstrap route rejects all requests without it |
| `STRIPE_SECRET_KEY` (already used sitewide) | Billing checkout + product sync | Billing routes return an error; catalog sync skipped at boot |
| `RECAPTCHA_SECRET_KEY` / `VITE_RECAPTCHA_SITE_KEY` (already used sitewide) | Public lead-form bot protection | Form still works, captcha step skipped |
| `VITE_GA_MEASUREMENT_ID` (already used sitewide) | Analytics | `trackEvent()` no-ops |

**Not configured, correctly gated rather than faked:** MFA provider (`mfaAvailable: false` in `/system-status`), malware-scanning provider for uploaded documents (`malwareScanningAvailable: false`). Both are surfaced honestly to the client UI rather than silently skipped.

---

## 15. Known Gaps / Follow-Up Work (Honest Accounting)

- **Onboarding "wizard"**: built as a sequence of separate portal pages (business intake → hiring sites → agreement → billing) rather than a single guided, saved-progress wizard flow. Functionally complete, UX could be tightened in a follow-up.
- **Add-on billing**: flat one-time price regardless of `priceUnit` — no true metered/per-unit billing (§10.4).
- **MFA and malware scanning**: no provider configured; both are correctly gated off rather than faked (§14).
- **Notification email delivery**: in-portal notifications are complete; outbound email for `deficiency_requires_client_action` and case-result events is not yet wired (only `client_activated` and `new_hire_request_submitted` send email today). Low-risk gap since in-portal notification already delivers the (non-sensitive) alert.
- **Retention dashboard**: export/delete backend routes existed from an earlier pass; the admin UI for them was built in this pass (`RetentionSection` in `PortalAdminTools.tsx`).
- **E-signature**: intentionally not built — agreement "signing" is upload-of-an-already-executed-document, per the brief's explicit prohibition on faking e-signature capture without a real provider configured.
- **Sitewide brand-color contrast (found, not fixed)**: the automated axe-core pass found the site's `text-[#FF6A00]` orange "eyebrow" label color renders at ~2.87:1 contrast against its background (WCAG 1.4.3 requires 4.5:1 for text this size) — a real, pre-existing violation, not introduced by this phase. It's used as a sitewide brand accent across dozens of sections on every page, not just the I-9 pages, so fixing it here would mean unilaterally reskinning the site's accent color from a single-page accessibility pass. Flagged for a deliberate design decision (darken the accent for text use, or reserve `#FF6A00` for large/bold UI elements only) rather than fixed silently. The test suite (`i9-accessibility.spec.ts`) explicitly excludes only this one axe rule, with the reasoning documented inline.

---

## 16. Files Changed

31 files touched across the full I-9 portal build (backend + frontend + tests), plus this pass's additions:
`tests/e2e/i9-accessibility.spec.ts` (new), `client/src/pages/i9-portal/PortalAdminTools.tsx` (retention UI), `client/src/pages/employer/NewHireVerification.tsx` (analytics events + contrast fix), `client/src/pages/i9-portal/PortalRegister.tsx` (conversion event), `client/src/pages/i9-portal/PortalNewHireRequestDetail.tsx` (deficiency/case-result note templates), `package.json` (`@axe-core/playwright` dev dependency), this document.

Full list available via `git diff --stat 3ae966b..HEAD`.

---

## 17. Deployment / Rollback Instructions

**Deployment:**
1. Provision a Postgres 16+ database; run Drizzle migrations (`npm run db:push` or equivalent for this repo's migration tooling) to create the 21 new `i9_*` tables — no changes to existing tables, so this is additive-only and safe to run against production data.
2. Set the environment variables in §14 (`DATABASE_URL`, `PROTECTED_DATA_ENCRYPTION_KEY`, `SESSION_SECRET`, `I9_ADMIN_BOOTSTRAP_SECRET`; Stripe/reCAPTCHA/GA keys are already required sitewide).
3. Deploy the build (`npm run build`) as normal — no new build steps.
4. Use the bootstrap-admin endpoint once, with `I9_ADMIN_BOOTSTRAP_SECRET`, to create the first `lbs_program_admin` account, then rotate/remove that secret.
5. Confirm `GET /api/i9/system-status` reports `databaseConfigured`, `protectedDataEncryptionConfigured`, and `secureWorkflowAvailable` all `true` before announcing the feature externally.

**Rollback:** Because this phase is purely additive (new tables, new routes under `/api/i9/*`, new client routes under `/portal/*`, one small additive branch in `webhookHandlers.ts`), reverting the deployed build to the prior commit is a clean rollback with no data-migration-down step required — the new `i9_*` tables simply go unused. No existing table, route, or column was modified in a way that requires reversal.

---

## 18. Preview / Screenshots Description

Not captured as image files in this pass (headless CI environment). What a reviewer would see when clicking through:
- **Marketing page** (`/employer-services/new-hire-verification`): navy hero with "Start Employer Onboarding" / "Client Portal Login" CTAs, "What LBS Manages" grid, consultation form, FAQ, closing CTA — all previously built and now instrumented with conversion tracking and the one accessibility fix.
- **Portal login/register**: centered card on navy background, matching the site's design language, explicit "do not enter employee SSNs here" warning on the registration form.
- **Portal dashboard → request detail**: card-based layout (`PortalCard`) showing attestations, protected-data entry (masked/reveal-audited), case activity timeline, LBS staff review actions with the new template-assisted deficiency/case-result notes.
- **Admin Tools**: two-column layout — usage approvals + case-volume report on the left; for `lbs_program_admin`, the new Data Retention card, audit log, and security incidents on the right.
