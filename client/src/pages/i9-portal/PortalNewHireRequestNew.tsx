import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  containsLikelySensitivePattern,
  SENSITIVE_FREE_TEXT_WARNING,
  PORTAL_ROUTES,
  type I9HiringSite,
  type I9NewHireRequest,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

const SERVICE_OPTIONS = [
  "E-Verify case creation and processing",
  "Form I-9 administrative review",
  "In-office document examination",
  "Mobile document examination",
];

interface FormState {
  hiringSiteId: string;
  serviceRequested: string;
  firstDayOfEmploymentForPay: string;
  formI9Section1CompletedDate: string;
  formI9Section2CompletedDate: string;
  section2LateReason: string;
  attestJobOfferAccepted: boolean;
  attestNotPreScreening: boolean;
  attestEmployeeChoseDocuments: boolean;
  attestListBHasPhoto: "" | "yes" | "no" | "na";
  attestInformationAccurate: boolean;
  attestParticipatingHiringSite: boolean;
  clientNotes: string;
}

const EMPTY: FormState = {
  hiringSiteId: "", serviceRequested: "", firstDayOfEmploymentForPay: "",
  formI9Section1CompletedDate: "", formI9Section2CompletedDate: "", section2LateReason: "",
  attestJobOfferAccepted: false, attestNotPreScreening: false, attestEmployeeChoseDocuments: false,
  attestListBHasPhoto: "", attestInformationAccurate: false, attestParticipatingHiringSite: false,
  clientNotes: "",
};

function NewRequestForm({ companyId }: { companyId: string }) {
  const [, setLocation] = useLocation();
  const onUnauth = useUnauthRedirect();
  const [sites, setSites] = useState<I9HiringSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
      .finally(() => active && setLoadingSites(false));
    return () => {
      active = false;
    };
  }, [companyId, onUnauth]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const notesFlagged = containsLikelySensitivePattern(form.clientNotes) || containsLikelySensitivePattern(form.section2LateReason);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (notesFlagged) {
      setError(SENSITIVE_FREE_TEXT_WARNING);
      return;
    }
    setSaving(true);
    try {
      const result = await i9Api<{ request: I9NewHireRequest }>("/api/i9/new-hire-requests", {
        method: "POST",
        body: JSON.stringify({
          clientCompanyId: companyId,
          hiringSiteId: form.hiringSiteId,
          serviceRequested: form.serviceRequested,
          firstDayOfEmploymentForPay: form.firstDayOfEmploymentForPay,
          formI9Section1CompletedDate: form.formI9Section1CompletedDate || undefined,
          formI9Section2CompletedDate: form.formI9Section2CompletedDate || undefined,
          section2LateReason: form.section2LateReason || undefined,
          attestJobOfferAccepted: form.attestJobOfferAccepted,
          attestNotPreScreening: form.attestNotPreScreening,
          attestEmployeeChoseDocuments: form.attestEmployeeChoseDocuments,
          attestListBHasPhoto: form.attestListBHasPhoto === "" ? null : form.attestListBHasPhoto === "yes",
          attestInformationAccurate: form.attestInformationAccurate,
          attestParticipatingHiringSite: form.attestParticipatingHiringSite,
          clientNotes: form.clientNotes || undefined,
        }),
      });
      setLocation(PORTAL_ROUTES.requestDetail(result.request.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingSites) return <p className="text-sm text-muted-foreground">Loading hiring sites...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (sites.length === 0) {
    return (
      <PortalCard>
        <p className="text-sm text-muted-foreground">
          Add at least one hiring site before creating a new-hire request.{" "}
          <a href={PORTAL_ROUTES.hiringSites} className="font-medium hover:underline" style={{ color: NAVY }}>Add a hiring site</a>.
        </p>
      </PortalCard>
    );
  }

  const attestations: { key: keyof FormState; label: string }[] = [
    { key: "attestJobOfferAccepted", label: "This employee has accepted a job offer. (E-Verify may only be used after a job offer is accepted — this is not a pre-screening tool.)" },
    { key: "attestNotPreScreening", label: "This request is not being submitted before a hiring decision has been made." },
    { key: "attestEmployeeChoseDocuments", label: "The employee chose which acceptable documents to present for Form I-9 — no one directed which documents to provide." },
    { key: "attestInformationAccurate", label: "The information in this request is accurate to the best of my knowledge." },
    { key: "attestParticipatingHiringSite", label: "The hiring site selected above is a confirmed E-Verify participating hiring site." },
  ];

  return (
    <form onSubmit={submit} className="space-y-5">
      <PortalCard title="Case Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Hiring Site" required>
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.hiringSiteId} onChange={(e) => set("hiringSiteId", e.target.value)} required>
              <option value="">Select a hiring site...</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Service Requested" required>
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.serviceRequested} onChange={(e) => set("serviceRequested", e.target.value)} required>
              <option value="">Select...</option>
              {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="First Day of Employment for Pay" required hint="Used to compute the informational 3-business-day case-creation target.">
            <Input type="date" value={form.firstDayOfEmploymentForPay} onChange={(e) => set("firstDayOfEmploymentForPay", e.target.value)} required />
          </Field>
          <Field label="Form I-9 Section 1 Completed Date">
            <Input type="date" value={form.formI9Section1CompletedDate} onChange={(e) => set("formI9Section1CompletedDate", e.target.value)} />
          </Field>
          <Field label="Form I-9 Section 2 Completed Date">
            <Input type="date" value={form.formI9Section2CompletedDate} onChange={(e) => set("formI9Section2CompletedDate", e.target.value)} />
          </Field>
          <Field label="List B Document Has Photo?">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.attestListBHasPhoto} onChange={(e) => set("attestListBHasPhoto", e.target.value as FormState["attestListBHasPhoto"])}>
              <option value="">N/A — no List B document used</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
        <Field label="Section 2 Late Reason (if applicable)" hint="Never enter employee names, SSNs, or document numbers.">
          <Textarea value={form.section2LateReason} onChange={(e) => set("section2LateReason", e.target.value)} rows={2} />
        </Field>
      </PortalCard>

      <PortalCard title="Required Attestations">
        <p className="text-xs text-muted-foreground">
          These confirmations are required before this request can be submitted for LBS processing. You can save this
          as a draft now and confirm them later.
        </p>
        {attestations.map(({ key, label }) => (
          <label key={key} className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4" checked={form[key] as boolean} onChange={(e) => set(key, e.target.checked as FormState[typeof key])} />
            <span className="text-sm text-foreground">{label}</span>
          </label>
        ))}
      </PortalCard>

      <PortalCard title="Notes">
        <Field label="Client Notes" hint="Never enter employee names, SSNs, document numbers, or other sensitive information here.">
          <Textarea value={form.clientNotes} onChange={(e) => set("clientNotes", e.target.value)} rows={3} />
        </Field>
        {notesFlagged && <ErrorBanner message={SENSITIVE_FREE_TEXT_WARNING} />}
      </PortalCard>

      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving || !form.hiringSiteId || !form.serviceRequested || !form.firstDayOfEmploymentForPay || notesFlagged} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save as Draft"}
        </Button>
      </div>
    </form>
  );
}

export default function PortalNewHireRequestNew() {
  return (
    <PortalGuard roles={["client_authorized_signer", "client_limited_user"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="New Request">
          {user.clientCompanyId ? (
            <NewRequestForm companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">No company is associated with this account.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
