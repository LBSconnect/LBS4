import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  PORTAL_ROUTES,
  COMPANY_STATUS_LABELS,
  type I9ClientCompany,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

function CompaniesList() {
  const onUnauth = useUnauthRedirect();
  const [companies, setCompanies] = useState<I9ClientCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    i9Api<{ companies: I9ClientCompany[] }>("/api/i9/companies")
      .then((d) => active && setCompanies(d.companies))
      .catch((err) => {
        if (!active) return;
        if (isI9ServiceUnavailable(err) && err instanceof I9ApiError) {
          setGateMissing((err.details as { missing?: string[] } | undefined)?.missing ?? []);
        } else {
          onUnauth(err);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [onUnauth]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading client companies...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;

  return (
    <PortalCard title={`Client Companies (${companies.length})`}>
      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No client companies yet.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {companies.map((c) => (
            <li key={c.id} className="py-3">
              <Link href={PORTAL_ROUTES.adminCompanyDetail(c.id)} className="flex items-center justify-between gap-3 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:underline truncate" style={{ color: NAVY }}>{c.legalBusinessName}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.industry || "Industry not set"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-100 text-gray-700 border-gray-200">
                    {COMPANY_STATUS_LABELS[c.status]}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}

export default function PortalAdminCompanies() {
  return (
    <PortalGuard roles={["lbs_program_admin", "lbs_case_processor", "lbs_intake_billing"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Client Companies">
          <CompaniesList />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
