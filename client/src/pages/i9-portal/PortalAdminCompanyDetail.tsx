import { useEffect, useState, useCallback } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  COMPANY_STATUS_LABELS,
  COMPANY_ONBOARDING_TRANSITIONS,
  type I9ClientCompany,
  type I9HiringSite,
  type I9Role,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ErrorBanner, SuccessBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

interface ClientUserRow {
  id: string;
  email: string;
  fullName: string;
  role: I9Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

function StatusTransitionControl({ company, canChange, onChanged }: { company: I9ClientCompany; canChange: boolean; onChanged: (status: I9ClientCompany["status"]) => void }) {
  const allowed = COMPANY_ONBOARDING_TRANSITIONS[company.status] ?? [];
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function apply() {
    if (!target) return;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      await i9Api(`/api/i9/companies/${company.id}/status`, { method: "POST", body: JSON.stringify({ status: target }) });
      onChanged(target as I9ClientCompany["status"]);
      setSuccess(true);
      setTarget("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  }

  if (!canChange) {
    return <p className="text-xs text-muted-foreground">Only an LBS Program Administrator or Intake/Billing user can change onboarding status.</p>;
  }
  if (allowed.length === 0) {
    return <p className="text-xs text-muted-foreground">No further onboarding transitions from this status.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select className="h-9 px-3 text-sm border border-input rounded-md bg-background" value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Move to...</option>
          {allowed.map((s) => <option key={s} value={s}>{COMPANY_STATUS_LABELS[s]}</option>)}
        </select>
        <Button size="sm" onClick={apply} disabled={busy || !target} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
          {busy ? "Saving..." : <>Apply <ArrowRight className="w-3.5 h-3.5" /></>}
        </Button>
      </div>
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message="Status updated." />}
    </div>
  );
}

function CompanyDetail({ id, actorRole }: { id: string; actorRole: I9Role }) {
  const onUnauth = useUnauthRedirect();
  const [company, setCompany] = useState<I9ClientCompany | null>(null);
  const [sites, setSites] = useState<I9HiringSite[]>([]);
  const [users, setUsers] = useState<ClientUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      i9Api<{ company: I9ClientCompany }>(`/api/i9/companies/${id}`),
      i9Api<{ sites: I9HiringSite[] }>(`/api/i9/companies/${id}/hiring-sites`).catch(() => ({ sites: [] })),
      i9Api<{ users: ClientUserRow[] }>(`/api/i9/companies/${id}/users`).catch(() => ({ users: [] })),
    ])
      .then(([c, s, u]) => {
        if (!active) return;
        setCompany(c.company);
        setSites(s.sites);
        setUsers(u.users);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof I9ApiError && err.status === 404) {
          setNotFound(true);
        } else if (isI9ServiceUnavailable(err) && err instanceof I9ApiError) {
          setGateMissing((err.details as { missing?: string[] } | undefined)?.missing ?? []);
        } else {
          onUnauth(err);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, onUnauth]);

  useEffect(() => load(), [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading company...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (notFound) return <p className="text-sm text-muted-foreground">Company not found.</p>;
  if (!company) return null;

  const canChangeStatus = actorRole === "lbs_program_admin" || actorRole === "lbs_intake_billing";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PortalCard title={company.legalBusinessName}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-xs text-muted-foreground">DBA</dt><dd>{company.dba || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">EIN</dt><dd>{company.einMasked || "Not on file"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Entity Type</dt><dd>{company.entityType || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Industry</dt><dd>{company.industry || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Total Employees</dt><dd>{company.totalEmployeeCount ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Avg. Monthly Hires</dt><dd>{company.averageMonthlyHires ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Already Enrolled in E-Verify?</dt><dd className="capitalize">{company.alreadyEnrolledInEverify?.replace("_", " ") || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Federal Contractor?</dt><dd className="capitalize">{company.federalContractorStatus?.replace("_", " ") || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Authorized Signer</dt><dd>{company.authorizedSignerName || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Billing Contact</dt><dd>{company.billingContactName || "—"}</dd></div>
          </dl>
        </PortalCard>

        <PortalCard title="Onboarding Status">
          <p className="text-sm">
            Current status: <span className="font-semibold" style={{ color: NAVY }}>{COMPANY_STATUS_LABELS[company.status]}</span>
          </p>
          <StatusTransitionControl company={company} canChange={canChangeStatus} onChanged={(s) => setCompany((c) => (c ? { ...c, status: s } : c))} />
        </PortalCard>

        <PortalCard title="E-Verify Enrollment (recorded by LBS, executed externally)">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-xs text-muted-foreground">E-Verify Company ID</dt><dd>{company.everifyCompanyId || "Not yet recorded"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">MOU Signer</dt><dd>{company.mouSignerName || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">MOU Signed Date</dt><dd>{company.mouSignedDate || "—"}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">
            The E-Verify MOU is executed by the client directly with DHS/SSA, outside this website. This section only
            records status and reference information after the fact.
          </p>
        </PortalCard>
      </div>

      <div className="space-y-5">
        <PortalCard title={`Hiring Sites (${sites.length})`}>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">None added yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sites.map((s) => <li key={s.id}>{s.name} <span className="text-xs text-muted-foreground">— {s.participationStatus}</span></li>)}
            </ul>
          )}
        </PortalCard>

        <PortalCard title={`Users (${users.length})`}>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {users.map((u) => (
                <li key={u.id}>
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · {u.role.replace("client_", "").replace("_", " ")}{!u.isActive ? " · inactive" : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  );
}

export default function PortalAdminCompanyDetail() {
  const params = useParams<{ id: string }>();
  return (
    <PortalGuard roles={["lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Client Company">
          {params.id ? <CompanyDetail id={params.id} actorRole={user.role} /> : <p className="text-sm text-muted-foreground">Missing company id.</p>}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
