import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import {
  i9Api,
  formatCents,
  type I9UsageRecord,
  type I9AuditEvent,
  type I9SecurityIncident,
  type I9Role,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ErrorBanner, useUnauthRedirect, NAVY } from "./_shared";

interface CaseVolumeRow { monthYear: string; status: string; count: number }

function UsageApprovalSection() {
  const onUnauth = useUnauthRedirect();
  const [records, setRecords] = useState<I9UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    i9Api<{ usage: I9UsageRecord[] }>("/api/i9/usage/pending-approval")
      .then((r) => active && setRecords(r.usage))
      .catch((err) => active && onUnauth(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [onUnauth]);

  async function approve(id: string) {
    setApprovingId(id);
    setError("");
    try {
      await i9Api(`/api/i9/usage/${id}/approve`, { method: "POST" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve usage record.");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading usage records...</p>;

  return (
    <PortalCard title={`Usage Pending Approval (${records.length})`}>
      {error && <ErrorBanner message={error} />}
      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing pending review.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {records.map((r) => (
            <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium" style={{ color: NAVY }}>{r.monthYear} — {r.casesUsed}/{r.casesIncluded} cases</p>
                {r.additionalCases > 0 && <p className="text-xs text-muted-foreground">{r.additionalCases} additional cases · {formatCents(r.additionalCaseChargeCents)}</p>}
              </div>
              <Button size="sm" variant="outline" disabled={approvingId === r.id} onClick={() => approve(r.id)} className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {approvingId === r.id ? "..." : "Approve"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}

function CaseVolumeReport() {
  const [rows, setRows] = useState<CaseVolumeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    i9Api<{ report: CaseVolumeRow[] }>("/api/i9/reports/monthly-case-volume")
      .then((r) => setRows(r.report))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byMonth = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.monthYear] = (acc[r.monthYear] ?? 0) + r.count;
    return acc;
  }, {});
  const months = Object.keys(byMonth).sort().reverse().slice(0, 6);

  if (loading) return null;

  return (
    <PortalCard title="Monthly Case Volume">
      {months.length === 0 ? (
        <p className="text-sm text-muted-foreground">No case data yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {months.map((m) => (
              <tr key={m} className="border-b border-border/30">
                <td className="py-1.5 font-medium" style={{ color: NAVY }}>{m}</td>
                <td className="py-1.5 text-right">{byMonth[m]} case{byMonth[m] !== 1 ? "s" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalCard>
  );
}

function AuditLogSection() {
  const [events, setEvents] = useState<I9AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    i9Api<{ auditEvents: I9AuditEvent[] }>("/api/i9/reports/audit")
      .then((r) => setEvents(r.auditEvents.slice(0, 100)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <PortalCard title="Audit Log (most recent 100)">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No audit events yet.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <ul className="divide-y divide-border/50">
            {events.map((e) => (
              <li key={e.id} className="py-2 text-xs">
                <span className="font-mono" style={{ color: NAVY }}>{e.action}</span>
                {e.entityType && <span className="text-muted-foreground"> · {e.entityType}</span>}
                {e.createdAt && <span className="text-muted-foreground"> · {new Date(e.createdAt).toLocaleString()}</span>}
                {e.actorRole && <span className="text-muted-foreground"> · by {e.actorRole}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PortalCard>
  );
}

function SecurityIncidentsSection() {
  const [incidents, setIncidents] = useState<I9SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    i9Api<{ incidents: I9SecurityIncident[] }>("/api/i9/security-incidents")
      .then((r) => setIncidents(r.incidents))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const severityStyle: Record<I9SecurityIncident["severity"], string> = {
    low: "bg-gray-100 text-gray-700 border-gray-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <PortalCard title="Security Incidents">
      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No security incidents recorded.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {incidents.map((i) => (
            <li key={i.id} className="py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="font-medium" style={{ color: NAVY }}>{i.category.replace(/_/g, " ")}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${severityStyle[i.severity]}`}>{i.severity}</span>
                <span className="text-xs text-muted-foreground capitalize ml-auto">{i.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{i.description}</p>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}

function AdminToolsContent({ role }: { role: I9Role }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-5">
        <UsageApprovalSection />
        <CaseVolumeReport />
      </div>
      <div className="space-y-5">
        {role === "lbs_program_admin" && <AuditLogSection />}
        {role === "lbs_program_admin" && <SecurityIncidentsSection />}
      </div>
    </div>
  );
}

export default function PortalAdminTools() {
  return (
    <PortalGuard roles={["lbs_program_admin", "lbs_intake_billing"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Admin Tools">
          <AdminToolsContent role={user.role} />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
