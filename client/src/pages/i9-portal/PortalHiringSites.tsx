import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin } from "lucide-react";
import { i9Api, I9ApiError, isI9ServiceUnavailable, type I9HiringSite } from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

const PARTICIPATION_LABELS: Record<I9HiringSite["participationStatus"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  not_participating: "Not Participating",
};
const PARTICIPATION_STYLES: Record<I9HiringSite["participationStatus"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  not_participating: "bg-gray-100 text-gray-600 border-gray-200",
};

function NewSiteForm({ companyId, onCreated }: { companyId: string; onCreated: (site: I9HiringSite) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await i9Api<{ site: I9HiringSite }>(`/api/i9/companies/${companyId}/hiring-sites`, {
        method: "POST",
        body: JSON.stringify({
          name,
          address,
          managerName: managerName || undefined,
          managerEmail: managerEmail || undefined,
        }),
      });
      onCreated(result.site);
      setName(""); setAddress(""); setManagerName(""); setManagerEmail("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add hiring site.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
        <Plus className="w-3.5 h-3.5" /> Add Hiring Site
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 bg-[#f8f9fb] rounded-xl p-4 border border-border/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Site Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Houston Warehouse" />
        </Field>
        <Field label="Address" required>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </Field>
        <Field label="Site Manager Name">
          <Input value={managerName} onChange={(e) => setManagerName(e.target.value)} />
        </Field>
        <Field label="Site Manager Email">
          <Input type="email" value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
        </Field>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !name || !address} className="text-white" style={{ backgroundColor: NAVY }}>
          {saving ? "Saving..." : "Save Site"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function HiringSitesList({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [sites, setSites] = useState<I9HiringSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    i9Api<{ sites: I9HiringSite[] }>(`/api/i9/companies/${companyId}/hiring-sites`)
      .then((d) => active && setSites(d.sites))
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
  }, [companyId, onUnauth]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading hiring sites...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;

  return (
    <PortalCard title="Hiring Sites" action={<NewSiteForm companyId={companyId} onCreated={(s) => setSites((prev) => [...prev, s])} />}>
      {sites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hiring sites added yet. Add every location where you'll hire employees who need Form I-9 / E-Verify processing.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {sites.map((s) => (
            <li key={s.id} className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: NAVY }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: NAVY }}>{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.address}</p>
                  {s.managerName && <p className="text-xs text-muted-foreground">Manager: {s.managerName}{s.managerEmail ? ` (${s.managerEmail})` : ""}</p>}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${PARTICIPATION_STYLES[s.participationStatus]}`}>
                {PARTICIPATION_LABELS[s.participationStatus]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PortalCard>
  );
}

export default function PortalHiringSites() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Hiring Sites">
          {user.clientCompanyId ? (
            <HiringSitesList companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">This page is for client company accounts.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
