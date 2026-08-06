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

import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, LayoutDashboard } from "lucide-react";
import {
  i9Api,
  isI9ServiceUnavailable,
  I9ApiError,
  PORTAL_ROUTES,
  type I9ClientCompany,
  type I9Subscription,
  type I9HiringSite,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";
import { BusinessIntakeForm } from "./PortalBusinessIntake";
import { PlanCatalog } from "./PortalBilling";
import { HiringSitesList } from "./PortalHiringSites";

type StepKey = "business" | "billing" | "sites";

interface StepDef {
  key: StepKey;
  label: string;
  description: string;
}

const STEPS: StepDef[] = [
  { key: "business", label: "Business Info", description: "Company details and authorized signer" },
  { key: "billing", label: "Choose a Plan", description: "Select a service plan to activate your account" },
  { key: "sites", label: "Hiring Sites", description: "Add the locations where you'll hire employees" },
];

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
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [active, setActive] = useState<StepKey>("business");
  const [hasPickedStep, setHasPickedStep] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      i9Api<{ company: I9ClientCompany }>(`/api/i9/companies/${companyId}`),
      i9Api<{ subscription: I9Subscription | null }>(`/api/i9/companies/${companyId}/subscription`).catch(() => ({ subscription: null })),
      i9Api<{ sites: I9HiringSite[] }>(`/api/i9/companies/${companyId}/hiring-sites`).catch(() => ({ sites: [] })),
    ]).then(([c, s, sites]) => {
      setCompany(c.company);
      setSubscription(s.subscription);
      setSiteCount(sites.sites.length);
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
    sites: siteCount > 0,
  };

  // Land on the first incomplete step by default, but only before the user
  // has manually picked one — otherwise clicking backward to review an
  // earlier, already-complete step would keep bouncing them forward.
  useEffect(() => {
    if (hasPickedStep || loading) return;
    const firstIncomplete = STEPS.find((s) => !complete[s.key]);
    if (firstIncomplete) setActive(firstIncomplete.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, company, subscription, siteCount]);

  function goTo(key: StepKey) {
    setHasPickedStep(true);
    setActive(key);
  }

  async function refreshAndAdvance() {
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
      {/* Stepper header */}
      <PortalCard>
        <ol className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex-1 flex items-center gap-3 sm:gap-2">
              <button
                type="button"
                onClick={() => goTo(s.key)}
                className="flex items-center gap-2.5 text-left"
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
      {active === "business" && <BusinessIntakeForm companyId={companyId} />}
      {active === "billing" && <PlanCatalog companyId={companyId} />}
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
          <Button type="button" onClick={refreshAndAdvance} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
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
