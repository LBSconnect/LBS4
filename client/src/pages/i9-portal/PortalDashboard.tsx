import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ClipboardList, Users, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  PORTAL_ROUTES,
  COMPANY_ONBOARDING_ORDER,
  COMPANY_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  statusBadgeClass,
  isInternalRole,
  type I9ClientCompany,
  type I9NewHireRequest,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

function OnboardingProgress({ status }: { status: I9ClientCompany["status"] }) {
  if (status === "suspended" || status === "offboarding" || status === "terminated") {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        This account's status is <strong>{COMPANY_STATUS_LABELS[status]}</strong>. Contact LBS for details.
      </div>
    );
  }
  const idx = COMPANY_ONBOARDING_ORDER.indexOf(status);
  return (
    <div className="space-y-2">
      {COMPANY_ONBOARDING_ORDER.map((step, i) => {
        const done = idx >= 0 && i < idx;
        const current = i === idx;
        return (
          <div key={step} className="flex items-center gap-2.5 text-sm">
            {done ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : (
              <Circle className={`w-4 h-4 shrink-0 ${current ? "text-[#FF6A00]" : "text-gray-300"}`} />
            )}
            <span className={current ? "font-semibold" : done ? "text-muted-foreground" : "text-gray-400"} style={current ? { color: NAVY } : undefined}>
              {COMPANY_STATUS_LABELS[step]}
            </span>
            {current && <span className="text-xs text-[#BD4F00] dark:text-[#FF8A3D] font-medium ml-1">Current stage</span>}
          </div>
        );
      })}
    </div>
  );
}

function ClientDashboard({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [company, setCompany] = useState<I9ClientCompany | null>(null);
  const [requests, setRequests] = useState<I9NewHireRequest[]>([]);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      i9Api<{ company: I9ClientCompany }>("/api/i9/companies/me").then((d) => {
        if (active) setCompany(d.company);
      }),
      i9Api<{ requests: I9NewHireRequest[] }>("/api/i9/new-hire-requests").then((d) => {
        if (active) setRequests(d.requests);
      }),
    ])
      .catch((err) => {
        if (!active) return;
        if (isI9ServiceUnavailable(err) && err instanceof I9ApiError) {
          const details = err.details as { missing?: string[] } | undefined;
          setGateMissing(details?.missing ?? []);
        } else {
          onUnauth(err);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [companyId, onUnauth]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading account...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (!company) return <p className="text-sm text-muted-foreground">No company record found for this account.</p>;

  const activeRequests = requests.filter((r) => !["closed", "cancelled_duplicate", "final_nonconfirmation"].includes(r.status));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PortalCard
          title={`${company.legalBusinessName} — Onboarding Status`}
          action={
            company.status !== "active" && company.status !== "suspended" && company.status !== "offboarding" && company.status !== "terminated" ? (
              <Link href={PORTAL_ROUTES.onboarding}>
                <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
                  Continue Onboarding <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : undefined
          }
        >
          <OnboardingProgress status={company.status} />
          {company.status !== "active" && (
            <p className="text-xs text-muted-foreground">
              New-hire requests can be drafted at any stage, but cannot be submitted for processing until onboarding
              reaches <strong>Active</strong>.
            </p>
          )}
        </PortalCard>

        <PortalCard
          title="New-Hire Requests"
          action={
            <Link href={PORTAL_ROUTES.newRequest}>
              <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
                New Request <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          }
        >
          {activeRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active new-hire requests yet.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {activeRequests.slice(0, 6).map((r) => (
                <li key={r.id} className="py-2.5">
                  <Link href={PORTAL_ROUTES.requestDetail(r.id)} className="flex items-center justify-between gap-3 group">
                    <div>
                      <p className="text-sm font-medium group-hover:underline" style={{ color: NAVY }}>{r.internalRequestNumber}</p>
                      <p className="text-xs text-muted-foreground">{r.serviceRequested}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(r.status)}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={PORTAL_ROUTES.requests} className="text-sm font-medium hover:underline inline-flex items-center gap-1" style={{ color: NAVY }}>
            View all requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </PortalCard>
      </div>

      <div className="space-y-5">
        <PortalCard title="Quick Links">
          <div className="space-y-2">
            <Link href={PORTAL_ROUTES.businessIntake}>
              <div className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:bg-[#f8f9fb] cursor-pointer">
                <Building2 className="w-4 h-4" style={{ color: NAVY }} /> Business Intake
              </div>
            </Link>
            <Link href={PORTAL_ROUTES.hiringSites}>
              <div className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:bg-[#f8f9fb] cursor-pointer">
                <MapPin className="w-4 h-4" style={{ color: NAVY }} /> Hiring Sites
              </div>
            </Link>
            <Link href={PORTAL_ROUTES.requests}>
              <div className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:bg-[#f8f9fb] cursor-pointer">
                <ClipboardList className="w-4 h-4" style={{ color: NAVY }} /> New-Hire Requests
              </div>
            </Link>
          </div>
        </PortalCard>

        {company.everifyCompanyId || company.mouSignedDate ? (
          <PortalCard title="E-Verify Enrollment">
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-muted-foreground">Company ID</dt><dd>{company.everifyCompanyId || "Not yet recorded"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">MOU Signed</dt><dd>{company.mouSignedDate || "Not yet"}</dd></div>
            </dl>
          </PortalCard>
        ) : null}
      </div>
    </div>
  );
}

function InternalDashboard() {
  const onUnauth = useUnauthRedirect();
  const [requests, setRequests] = useState<I9NewHireRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    i9Api<{ requests: I9NewHireRequest[] }>("/api/i9/new-hire-requests")
      .then((d) => {
        if (active) setRequests(d.requests);
      })
      .catch((err) => active && onUnauth(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [onUnauth]);

  const needsAttention = requests.filter((r) => ["submitted", "deficient_client_action_required"].includes(r.status));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PortalCard title="Requests Needing Attention">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : needsAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing waiting on LBS review right now.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {needsAttention.map((r) => (
                <li key={r.id} className="py-2.5">
                  <Link href={PORTAL_ROUTES.requestDetail(r.id)} className="flex items-center justify-between gap-3 group">
                    <div>
                      <p className="text-sm font-medium group-hover:underline" style={{ color: NAVY }}>{r.internalRequestNumber}</p>
                      <p className="text-xs text-muted-foreground">{r.serviceRequested}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(r.status)}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={PORTAL_ROUTES.requests} className="text-sm font-medium hover:underline inline-flex items-center gap-1" style={{ color: NAVY }}>
            View all requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </PortalCard>
      </div>
      <div className="space-y-5">
        <PortalCard title="Quick Links">
          <Link href={PORTAL_ROUTES.adminCompanies}>
            <div className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:bg-[#f8f9fb] cursor-pointer">
              <Users className="w-4 h-4" style={{ color: NAVY }} /> Client Companies
            </div>
          </Link>
          <Link href={PORTAL_ROUTES.requests}>
            <div className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:bg-[#f8f9fb] cursor-pointer">
              <ClipboardList className="w-4 h-4" style={{ color: NAVY }} /> All New-Hire Requests
            </div>
          </Link>
        </PortalCard>
      </div>
    </div>
  );
}

export default function PortalDashboard() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Dashboard">
          {isInternalRole(user.role) ? (
            <InternalDashboard />
          ) : user.clientCompanyId ? (
            <ClientDashboard companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">No company is associated with this account yet.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
