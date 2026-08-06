import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  type I9ClientCompany,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, SuccessBanner, ServiceGateBanner, useUnauthRedirect } from "./_shared";

const ENTITY_TYPES = ["Sole Proprietorship", "Partnership", "LLC", "S-Corporation", "C-Corporation", "Nonprofit", "Other"];
const YES_NO_NOT_SURE: { value: "yes" | "no" | "not_sure"; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not Sure" },
];
const I9_WORKFLOW_OPTIONS: { value: string; label: string }[] = [
  { value: "client_self_serve", label: "Client self-serve (we submit requests, LBS creates cases)" },
  { value: "lbs_administrative_review", label: "LBS administrative review of completed Form I-9s" },
  { value: "lbs_in_person_examination", label: "LBS in-person document examination" },
];

interface FormState {
  legalBusinessName: string;
  dba: string;
  ein: string;
  entityType: string;
  physicalAddress: string;
  mailingAddress: string;
  website: string;
  industry: string;
  naicsSector: string;
  totalEmployeeCount: string;
  averageMonthlyHires: string;
  federalContractorStatus: "" | "yes" | "no" | "not_sure";
  alreadyEnrolledInEverify: "" | "yes" | "no" | "not_sure";
  currentEmployerAgent: string;
  authorizedSignerName: string;
  authorizedSignerTitle: string;
  authorizedSignerEmail: string;
  authorizedSignerPhone: string;
  billingContactName: string;
  billingContactEmail: string;
  preferredStartDate: string;
  formI9WorkflowSelection: string;
  acknowledgedResponsibilities: boolean;
}

const EMPTY: FormState = {
  legalBusinessName: "", dba: "", ein: "", entityType: "", physicalAddress: "", mailingAddress: "",
  website: "", industry: "", naicsSector: "", totalEmployeeCount: "", averageMonthlyHires: "",
  federalContractorStatus: "", alreadyEnrolledInEverify: "", currentEmployerAgent: "",
  authorizedSignerName: "", authorizedSignerTitle: "", authorizedSignerEmail: "", authorizedSignerPhone: "",
  billingContactName: "", billingContactEmail: "", preferredStartDate: "", formI9WorkflowSelection: "",
  acknowledgedResponsibilities: false,
};

function companyToForm(c: I9ClientCompany): FormState {
  return {
    legalBusinessName: c.legalBusinessName ?? "",
    dba: c.dba ?? "",
    ein: "", // write-only; never round-tripped from the server
    entityType: c.entityType ?? "",
    physicalAddress: c.physicalAddress ?? "",
    mailingAddress: c.mailingAddress ?? "",
    website: c.website ?? "",
    industry: c.industry ?? "",
    naicsSector: c.naicsSector ?? "",
    totalEmployeeCount: c.totalEmployeeCount != null ? String(c.totalEmployeeCount) : "",
    averageMonthlyHires: c.averageMonthlyHires != null ? String(c.averageMonthlyHires) : "",
    federalContractorStatus: (c.federalContractorStatus as FormState["federalContractorStatus"]) ?? "",
    alreadyEnrolledInEverify: (c.alreadyEnrolledInEverify as FormState["alreadyEnrolledInEverify"]) ?? "",
    currentEmployerAgent: c.currentEmployerAgent ?? "",
    authorizedSignerName: c.authorizedSignerName ?? "",
    authorizedSignerTitle: c.authorizedSignerTitle ?? "",
    authorizedSignerEmail: c.authorizedSignerEmail ?? "",
    authorizedSignerPhone: c.authorizedSignerPhone ?? "",
    billingContactName: c.billingContactName ?? "",
    billingContactEmail: c.billingContactEmail ?? "",
    preferredStartDate: c.preferredStartDate ?? "",
    formI9WorkflowSelection: c.formI9WorkflowSelection ?? "",
    acknowledgedResponsibilities: c.acknowledgedResponsibilities ?? false,
  };
}

export function BusinessIntakeForm({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [company, setCompany] = useState<I9ClientCompany | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [einMasked, setEinMasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    i9Api<{ company: I9ClientCompany }>(`/api/i9/companies/${companyId}`)
      .then((d) => {
        if (!active) return;
        setCompany(d.company);
        setForm(companyToForm(d.company));
        setEinMasked(d.company.einMasked);
      })
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

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        legalBusinessName: form.legalBusinessName,
        dba: form.dba || undefined,
        entityType: form.entityType || undefined,
        physicalAddress: form.physicalAddress || undefined,
        mailingAddress: form.mailingAddress || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        naicsSector: form.naicsSector || undefined,
        totalEmployeeCount: form.totalEmployeeCount ? Number(form.totalEmployeeCount) : undefined,
        averageMonthlyHires: form.averageMonthlyHires ? Number(form.averageMonthlyHires) : undefined,
        federalContractorStatus: form.federalContractorStatus || undefined,
        alreadyEnrolledInEverify: form.alreadyEnrolledInEverify || undefined,
        currentEmployerAgent: form.currentEmployerAgent || undefined,
        authorizedSignerName: form.authorizedSignerName || undefined,
        authorizedSignerTitle: form.authorizedSignerTitle || undefined,
        authorizedSignerEmail: form.authorizedSignerEmail || undefined,
        authorizedSignerPhone: form.authorizedSignerPhone || undefined,
        billingContactName: form.billingContactName || undefined,
        billingContactEmail: form.billingContactEmail || undefined,
        preferredStartDate: form.preferredStartDate || undefined,
        formI9WorkflowSelection: form.formI9WorkflowSelection || undefined,
        acknowledgedResponsibilities: form.acknowledgedResponsibilities,
      };
      if (form.ein) payload.ein = form.ein;
      await i9Api(`/api/i9/companies/${companyId}/business-intake`, { method: "PATCH", body: JSON.stringify(payload) });
      setSaved(true);
      setForm((f) => ({ ...f, ein: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save business intake information.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading business intake...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (!company) return <p className="text-sm text-muted-foreground">Company record not found.</p>;

  return (
    <form onSubmit={save} className="space-y-5">
      <PortalCard>
        <p className="text-sm text-muted-foreground">
          Business-level information only — never enter employee names, Social Security numbers, or Form I-9 document
          details anywhere on this page.
        </p>
      </PortalCard>

      <PortalCard title="Company Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Legal Business Name" required>
            <Input value={form.legalBusinessName} onChange={(e) => set("legalBusinessName", e.target.value)} required />
          </Field>
          <Field label="DBA (if applicable)">
            <Input value={form.dba} onChange={(e) => set("dba", e.target.value)} />
          </Field>
          <Field label="EIN" hint={einMasked ? `Currently on file: ${einMasked}` : "Enter to set or replace. Stored encrypted; never displayed in full."}>
            <Input value={form.ein} onChange={(e) => set("ein", e.target.value)} placeholder="XX-XXXXXXX" />
          </Field>
          <Field label="Entity Type">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.entityType} onChange={(e) => set("entityType", e.target.value)}>
              <option value="">Select...</option>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Industry">
            <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          </Field>
          <Field label="NAICS Sector (3 digits)" hint="e.g. 236 for Construction of Buildings">
            <Input value={form.naicsSector} onChange={(e) => set("naicsSector", e.target.value.replace(/\D/g, "").slice(0, 3))} maxLength={3} placeholder="236" />
          </Field>
          <Field label="Total Employee Count">
            <Input type="number" min="0" value={form.totalEmployeeCount} onChange={(e) => set("totalEmployeeCount", e.target.value)} />
          </Field>
          <Field label="Average Monthly Hires">
            <Input type="number" min="0" value={form.averageMonthlyHires} onChange={(e) => set("averageMonthlyHires", e.target.value)} />
          </Field>
          <Field label="Federal Contractor Status">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.federalContractorStatus} onChange={(e) => set("federalContractorStatus", e.target.value as FormState["federalContractorStatus"])}>
              <option value="">Select...</option>
              {YES_NO_NOT_SURE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Already Enrolled in E-Verify?">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.alreadyEnrolledInEverify} onChange={(e) => set("alreadyEnrolledInEverify", e.target.value as FormState["alreadyEnrolledInEverify"])}>
              <option value="">Select...</option>
              {YES_NO_NOT_SURE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Current Employer Agent (if any)">
            <Input value={form.currentEmployerAgent} onChange={(e) => set("currentEmployerAgent", e.target.value)} />
          </Field>
        </div>
      </PortalCard>

      <PortalCard title="Addresses">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Physical Address">
            <Input value={form.physicalAddress} onChange={(e) => set("physicalAddress", e.target.value)} />
          </Field>
          <Field label="Mailing Address">
            <Input value={form.mailingAddress} onChange={(e) => set("mailingAddress", e.target.value)} />
          </Field>
        </div>
      </PortalCard>

      <PortalCard title="Authorized Signer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><Input value={form.authorizedSignerName} onChange={(e) => set("authorizedSignerName", e.target.value)} /></Field>
          <Field label="Title"><Input value={form.authorizedSignerTitle} onChange={(e) => set("authorizedSignerTitle", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.authorizedSignerEmail} onChange={(e) => set("authorizedSignerEmail", e.target.value)} /></Field>
          <Field label="Phone"><Input type="tel" value={form.authorizedSignerPhone} onChange={(e) => set("authorizedSignerPhone", e.target.value)} /></Field>
        </div>
      </PortalCard>

      <PortalCard title="Billing Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name"><Input value={form.billingContactName} onChange={(e) => set("billingContactName", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.billingContactEmail} onChange={(e) => set("billingContactEmail", e.target.value)} /></Field>
        </div>
      </PortalCard>

      <PortalCard title="Workflow Preferences">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Preferred Start Date">
            <Input type="date" value={form.preferredStartDate} onChange={(e) => set("preferredStartDate", e.target.value)} />
          </Field>
          <Field label="Form I-9 Workflow Selection">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={form.formI9WorkflowSelection} onChange={(e) => set("formI9WorkflowSelection", e.target.value)}>
              <option value="">Select...</option>
              {I9_WORKFLOW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input type="checkbox" className="mt-0.5 w-4 h-4" checked={form.acknowledgedResponsibilities} onChange={(e) => set("acknowledgedResponsibilities", e.target.checked)} />
          <span className="text-sm text-foreground">
            We acknowledge that LBS acts as our E-Verify Employer Agent and administrative support provider, and that
            our company remains responsible for its own Form I-9 and E-Verify compliance obligations. This is not a
            substitute for legal advice.
          </span>
        </label>
      </PortalCard>

      {error && <ErrorBanner message={error} />}
      {saved && <SuccessBanner message="Business intake information saved. An LBS representative will review it and move your account forward." />}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="text-white gap-1.5" style={{ backgroundColor: "#0D1B3D" }}>
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Business Intake"}
        </Button>
      </div>
    </form>
  );
}

export default function PortalBusinessIntake() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Business Intake">
          {user.clientCompanyId ? (
            <BusinessIntakeForm companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">This page is for client company accounts.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
