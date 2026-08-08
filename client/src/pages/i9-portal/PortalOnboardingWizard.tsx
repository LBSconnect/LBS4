// ─────────────────────────────────────────────────────────────────────────────
// Single guided onboarding flow for newly-registered client companies —
// consolidates the three self-service onboarding steps (business intake,
// plan selection, hiring sites) that previously only existed as separate
// nav pages a new client had to discover on their own.
//
// This does NOT replace those pages — Business Intake, Billing, and Hiring
// Sites remain reachable directly from the nav for anyone who wants to edit
// a single section later, and this wizard reuses their exact form
// components (BusinessIntakeForm / PlanCatalog / HiringSitesList) rather
// than duplicating any logic, so there's a single source of truth for each
// step's behavior.
//
// "Saved progress" is deliberately not a separate wizard-state column —
// completion of each step is derived from the real underlying data (does
// the company have its core fields filled? is there an active/pending
// subscription? is there at least one hiring site?) every time the page
// loads. That means a client who leaves mid-flow and comes back — from any
// device, any session — resumes exactly where their actual data left off,
// with nothing to get out of sync.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, LayoutDashboard, FileSignature, Download, ExternalLink } from "lucide-react";
import {
  i9Api,
  isI9ServiceUnavailable,
  I9ApiError,
  PORTAL_ROUTES,
  type I9ClientCompany,
  type I9Subscription,
  type I9HiringSite,
  type I9ClientAgreement,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ServiceGateBanner, ErrorBanner, useUnauthRedirect, NAVY } from "./_shared";
import { BusinessIntakeForm, type BusinessIntakeFormHandle } from "./PortalBusinessIntake";
import { PlanCatalog } from "./PortalBilling";
import { HiringSitesList } from "./PortalHiringSites";
import { AGREEMENT_VERSION } from "@/pages/employer/ServiceAgreement";

const AGREEMENT_PAGE_ROUTE = "/employer-services/new-hire-verification/agreement";

type StepKey = "business" | "billing" | "agreement" | "sites";

interface StepDef {
  key: StepKey;
  label: string;
  description: string;
}

const STEPS: StepDef[] = [
  { key: "business", label: "Business Info", description: "Company details and authorized signer" },
  { key: "billing", label: "Choose a Plan", description: "Select a service plan to activate your account" },
  { key: "agreement", label: "Service Agreement", description: "Review and accept the LBS service agreement" },
  { key: "sites", label: "Hiring Sites", description: "Add the locations where you'll hire employees" },
];

/** Self-contained step: fetches and mutates its own agreement state, same
 *  pattern as PlanCatalog/HiringSitesList/BusinessIntakeForm above — no
 *  parent-passed state, so this works standalone if ever surfaced outside
 *  the wizard too. Auto-generates the current version's text on first view
 *  (the server does this transparently on accept as well; fetching it here
 *  first just lets the signer read it before committing). */
function AgreementAcceptStep({ companyId, onAccepted }: { companyId: string; onAccepted: () => void }) {
  const onUnauth = useUnauthRedirect();
  const [agreement, setAgreement] = useState<I9ClientAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    i9Api<{ agreement: I9ClientAgreement | null }>(`/api/i9/companies/${companyId}/agreement`)
      .then((r) => setAgreement(r.agreement))
      .catch(onUnauth)
      .finally(() => setLoading(false));
  }, [companyId, onUnauth]);

  useEffect(() => { load(); }, [load]);

  function downloadCopy() {
    if (!agreement?.generatedDocumentHtml) return;
    const blob = new Blob([agreement.generatedDocumentHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LBS-Agreement-v${agreement.documentVersion}-${companyId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function accept() {
    setError("");
    setSubmitting(true);
    try {
      const r = await i9Api<{ agreement: I9ClientAgreement }>(`/api/i9/companies/${companyId}/agreement/accept`, {
        method: "POST",
        body: JSON.stringify({ acknowledged: true }),
      });
      setAgreement(r.agreement);
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record your acceptance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading agreement...</p>;

  if (agreement?.status === "signed") {
    return (
      <PortalCard title="Service Agreement">
        <div className="flex items-start gap-2.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Accepted{agreement.signedByName ? ` by ${agreement.signedByName}` : ""} — Agreement Version {agreement.documentVersion}.
            {agreement.signedAt && ` (${new Date(agreement.signedAt).toLocaleDateString()})`}
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          <Link href={AGREEMENT_PAGE_ROUTE} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> View Agreement</Button>
          </Link>
          {agreement.generatedDocumentHtml && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={downloadCopy}><Download className="w-3.5 h-3.5" /> Download Copy</Button>
          )}
        </div>
      </PortalCard>
    );
  }

  return (
    <PortalCard title="Service Agreement">
      <p className="text-sm text-muted-foreground">
        Before your account can be activated, please review and accept LBS's New-Hire Verification &amp; Form I-9
        Support Services Agreement (Version {AGREEMENT_VERSION}).
      </p>
      <Link href={AGREEMENT_PAGE_ROUTE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: NAVY }}>
        <ExternalLink className="w-3.5 h-3.5" /> Read the full Agreement
      </Link>
      <div className="flex items-start gap-2.5 border-t border-border/50 pt-4 mt-1">
        <Checkbox
          id="agreement-acknowledge"
          checked={acknowledged}
          onCheckedChange={(v) => setAcknowledged(v === true)}
          className="mt-0.5"
          data-testid="checkbox-agreement-acknowledge"
        />
        <label htmlFor="agreement-acknowledge" className="text-sm leading-snug cursor-pointer">
          <span className="text-red-500 mr-0.5">*</span>
          I certify that I am authorized to bind the company identified above and that I have read and agree to the
          New-Hire Verification &amp; Form I-9 Support Services Agreement.
        </label>
      </div>
      {error && <ErrorBanner message={error} />}
      <Button
        type="button"
        onClick={accept}
        disabled={!acknowledged || submitting}
        className="text-white gap-1.5"
        style={{ backgroundColor: NAVY }}
        data-testid="button-accept-agreement"
      >
        <FileSignature className="w-4 h-4" /> {submitting ? "Submitting..." : "Accept Agreement"}
      </Button>
    </PortalCard>
  );
}

/** A company is "business info complete" once the fields that actually
 *  matter for LBS to start reviewing the account are filled — not every
 *  optional field. Matches the fields the acknowledgement checkbox on the
 *  Business Intake page sits alongside. */
function isBusinessInfoComplete(company: I9ClientCompany): boolean {
  return !!(
    company.legalBusinessName &&
    company.authorizedSignerName &&
    company.authorizedSignerEmail &&
    company.acknowledgedResponsibilities
  );
}

function OnboardingWizardContent({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [company, setCompany] = useState<I9ClientCompany | null>(null);
  const [subscription, setSubscription] = useState<I9Subscription | null>(null);
  const [siteCount, setSiteCount] = useState(0);
  const [agreementStatus, setAgreementStatus] = useState<I9ClientAgreement["status"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [active, setActive] = useState<StepKey>("business");
  const [hasPickedStep, setHasPickedStep] = useState(false);
  const businessFormRef = useRef<BusinessIntakeFormHandle>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<"success" | "cancelled" | null>(null);

  // Stripe redirects back here (server/i9Routes.ts's checkout route) after
  // the client pays — show a quick confirmation and drop the query param so
  // a page refresh doesn't keep re-showing it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success" || checkout === "cancelled") {
      setCheckoutNotice(checkout);
      params.delete("checkout");
      const rest = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
    }
  }, []);

  const load = useCallback(() => {
    return Promise.all([
      i9Api<{ company: I9ClientCompany }>(`/api/i9/companies/${companyId}`),
      i9Api<{ subscription: I9Subscription | null }>(`/api/i9/companies/${companyId}/subscription`).catch(() => ({ subscription: null })),
      i9Api<{ sites: I9HiringSite[] }>(`/api/i9/companies/${companyId}/hiring-sites`).catch(() => ({ sites: [] })),
      i9Api<{ agreement: I9ClientAgreement | null }>(`/api/i9/companies/${companyId}/agreement`).catch(() => ({ agreement: null })),
    ]).then(([c, s, sites, a]) => {
      setCompany(c.company);
      setSubscription(s.subscription);
      setSiteCount(sites.sites.length);
      setAgreementStatus(a.agreement?.status ?? null);
      return c.company;
    });
  }, [companyId]);

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((err) => {
        if (cancelled) return;
        if (isI9ServiceUnavailable(err) && err instanceof I9ApiError) {
          setGateMissing((err.details as { missing?: string[] } | undefined)?.missing ?? []);
        } else {
          onUnauth(err);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const complete: Record<StepKey, boolean> = {
    business: company ? isBusinessInfoComplete(company) : false,
    billing: subscription?.status === "active" || subscription?.status === "pending",
    agreement: agreementStatus === "signed",
    sites: siteCount > 0,
  };

  // Clients can freely revisit any step up through the first incomplete one,
  // but can't jump ahead of it — required fields on the current step must be
  // completed before moving to the next page.
  const firstIncompleteIndex = STEPS.findIndex((s) => !complete[s.key]);
  const maxReachableIndex = firstIncompleteIndex === -1 ? STEPS.length - 1 : firstIncompleteIndex;

  // Land on the first incomplete step by default, but only before the user
  // has manually picked one — otherwise clicking backward to review an
  // earlier, already-complete step would keep bouncing them forward.
  useEffect(() => {
    if (hasPickedStep || loading) return;
    const firstIncomplete = STEPS.find((s) => !complete[s.key]);
    if (firstIncomplete) setActive(firstIncomplete.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, company, subscription, siteCount, agreementStatus]);

  function goTo(key: StepKey) {
    setHasPickedStep(true);
    setActive(key);
  }

  async function refreshAndAdvance() {
    // Persist whatever's currently in the active step's form before moving
    // on — previously "Next" only re-fetched from the server, so anything
    // typed but not explicitly saved was silently discarded and gone when
    // the client came back via "Back". Best-effort: a failed save (e.g. an
    // encryption-config issue on the EIN) shouldn't block navigation.
    if (active === "business") {
      await businessFormRef.current?.saveProgress().catch(() => false);
    }
    await load().catch(() => {});
    const idx = STEPS.findIndex((s) => s.key === active);
    const next = STEPS[idx + 1];
    if (next) goTo(next.key);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading onboarding...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (!company) return <p className="text-sm text-muted-foreground">Company record not found.</p>;

  const allComplete = STEPS.every((s) => complete[s.key]);
  const activeIndex = STEPS.findIndex((s) => s.key === active);

  return (
    <div className="space-y-6">
      {checkoutNotice === "success" && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Payment received — your plan is active. A confirmation email is on its way. Continue below to finish onboarding.
        </div>
      )}
      {checkoutNotice === "cancelled" && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          Checkout was cancelled — no charge was made. You can pick a plan below whenever you're ready.
        </div>
      )}

      {/* Stepper header */}
      <PortalCard>
        <ol className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex-1 flex items-center gap-3 sm:gap-2">
              <button
                type="button"
                disabled={i > maxReachableIndex}
                onClick={async () => {
                  if (active === "business" && s.key !== "business") {
                    await businessFormRef.current?.saveProgress().catch(() => false);
                  }
                  goTo(s.key);
                }}
                className="flex items-center gap-2.5 text-left disabled:opacity-40 disabled:cursor-not-allowed"
                aria-current={active === s.key ? "step" : undefined}
              >
                {complete[s.key] ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600" />
                ) : (
                  <Circle className={`w-6 h-6 shrink-0 ${active === s.key ? "" : "text-gray-300"}`} style={active === s.key ? { color: NAVY } : undefined} />
                )}
                <div>
                  <p className={`text-sm font-semibold ${active === s.key ? "" : "text-muted-foreground"}`} style={active === s.key ? { color: NAVY } : undefined}>
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{s.description}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && <div className="hidden sm:block flex-1 h-px bg-border mx-3" />}
            </li>
          ))}
        </ol>
      </PortalCard>

      {allComplete && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Onboarding is complete. An LBS representative will review your account and move it forward.</span>
          <Link href={PORTAL_ROUTES.dashboard}>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0"><LayoutDashboard className="w-3.5 h-3.5" /> Go to Dashboard</Button>
          </Link>
        </div>
      )}

      {/* Active step panel */}
      {active === "business" && (
        <BusinessIntakeForm
          ref={businessFormRef}
          companyId={companyId}
          onSaved={() => load().catch(() => {})}
        />
      )}
      {active === "billing" && <PlanCatalog companyId={companyId} />}
      {active === "agreement" && <AgreementAcceptStep companyId={companyId} onAccepted={refreshAndAdvance} />}
      {active === "sites" && <HiringSitesList companyId={companyId} />}

      {/* Step navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={activeIndex === 0}
          onClick={() => goTo(STEPS[activeIndex - 1].key)}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {activeIndex < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={refreshAndAdvance}
            disabled={!complete[active]}
            title={!complete[active] ? "Finish the required fields on this step before continuing" : undefined}
            className="text-white gap-1.5"
            style={{ backgroundColor: NAVY }}
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Link href={PORTAL_ROUTES.dashboard}>
            <Button type="button" className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PortalOnboardingWizard() {
  return (
    <PortalGuard roles={["client_authorized_signer"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Employer Onboarding">
          {user.clientCompanyId ? (
            <OnboardingWizardContent companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">This page is for client company accounts.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
