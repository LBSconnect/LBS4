import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  isInternalRole,
  PORTAL_ROUTES,
  REQUEST_STATUS_LABELS,
  statusBadgeClass,
  type I9NewHireRequest,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

function RequestsList() {
  const onUnauth = useUnauthRedirect();
  const [requests, setRequests] = useState<I9NewHireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    i9Api<{ requests: I9NewHireRequest[] }>("/api/i9/new-hire-requests")
      .then((d) => active && setRequests(d.requests))
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading requests...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;

  const filtered = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  const statusesPresent = Array.from(new Set(requests.map((r) => r.status)));

  return (
    <PortalCard
      title="New-Hire Requests"
      action={
        <Link href={PORTAL_ROUTES.newRequest}>
          <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
            <Plus className="w-3.5 h-3.5" /> New Request
          </Button>
        </Link>
      }
    >
      {statusesPresent.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusFilter === "all" ? "text-white border-transparent" : "text-muted-foreground border-border/50"}`}
            style={statusFilter === "all" ? { backgroundColor: NAVY } : undefined}
          >
            All ({requests.length})
          </button>
          {statusesPresent.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusFilter === s ? "text-white border-transparent" : "text-muted-foreground border-border/50"}`}
              style={statusFilter === s ? { backgroundColor: NAVY } : undefined}
            >
              {REQUEST_STATUS_LABELS[s]} ({requests.filter((r) => r.status === s).length})
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No new-hire requests match this filter.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {sorted.map((r) => (
            <li key={r.id} className="py-3">
              <Link href={PORTAL_ROUTES.requestDetail(r.id)} className="flex items-center justify-between gap-3 group">
                <div className="min-w-0">
                  <p className="text-sm font-medium group-hover:underline truncate" style={{ color: NAVY }}>{r.internalRequestNumber}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.serviceRequested} · First day of pay: {r.firstDayOfEmploymentForPay}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass(r.status)}`}>
                    {REQUEST_STATUS_LABELS[r.status]}
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

export default function PortalNewHireRequests() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title={isInternalRole(user.role) ? "New-Hire Requests (All Clients)" : "New-Hire Requests"}>
          <RequestsList />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
