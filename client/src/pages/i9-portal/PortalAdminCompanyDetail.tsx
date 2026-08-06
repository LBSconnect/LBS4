import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, FileText, Download, Upload, CheckCircle2 } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  COMPANY_STATUS_LABELS,
  COMPANY_ONBOARDING_TRANSITIONS,
  fileToBase64,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type I9ClientCompany,
  type I9HiringSite,
  type I9Role,
  type I9ClientAgreement,
  type I9Appointment,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, SuccessBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

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

/** No e-signature provider is configured (see deliverables doc) — this only
 *  ever generates document *text* for download/print, and records a
 *  reference to a signed copy uploaded separately. It never simulates or
 *  fakes an actual signature capture. */
function AgreementSection({ companyId, canManage }: { companyId: string; canManage: boolean }) {
  const [agreement, setAgreement] = useState<I9ClientAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    i9Api<{ agreement: I9ClientAgreement | null }>(`/api/i9/companies/${companyId}/agreement`)
      .then((r) => setAgreement(r.agreement))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const r = await i9Api<{ agreement: I9ClientAgreement }>(`/api/i9/companies/${companyId}/agreement/generate`, { method: "POST" });
      setAgreement(r.agreement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate agreement.");
    } finally {
      setGenerating(false);
    }
  }

  function downloadDraft() {
    if (!agreement?.generatedDocumentHtml) return;
    const blob = new Blob([agreement.generatedDocumentHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LBS-Agreement-Draft-${companyId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadSignedCopy(file: File) {
    setError("");
    if (!signedByName.trim()) {
      setError("Enter the signer's name before uploading.");
      return;
    }
    if (!UPLOAD_ALLOWED_MIME_TYPES.includes(file.type as (typeof UPLOAD_ALLOWED_MIME_TYPES)[number])) {
      setError("Only PDF, PNG, or JPEG files are accepted.");
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setError(`File too large. Maximum size is ${UPLOAD_MAX_BYTES / 1024 / 1024}MB.`);
      return;
    }
    setUploading(true);
    try {
      const base64Content = await fileToBase64(file);
      const uploadRes = await i9Api<{ documentId: string; warning?: string }>("/api/i9/documents/upload", {
        method: "POST",
        body: JSON.stringify({
          clientCompanyId: companyId,
          documentType: "signed_lbs_agreement",
          filename: file.name,
          mimeType: file.type,
          base64Content,
        }),
      });
      await i9Api(`/api/i9/companies/${companyId}/agreement/record-signed-copy`, {
        method: "POST",
        body: JSON.stringify({ secureDocumentId: uploadRes.documentId, signedByName }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload signed copy.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return null;

  return (
    <PortalCard title="LBS Commercial Agreement">
      <p className="text-xs text-muted-foreground">
        No e-signature provider is configured. This generates agreement text to download and sign outside the
        portal, then records a reference once a signed copy is uploaded — it never simulates a signature.
      </p>
      {!agreement ? (
        canManage ? (
          <>
            {error && <ErrorBanner message={error} />}
            <Button size="sm" onClick={generate} disabled={generating} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
              <FileText className="w-3.5 h-3.5" /> {generating ? "Generating..." : "Generate Draft Agreement"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No agreement has been generated yet.</p>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            Status: <span className="font-semibold capitalize" style={{ color: NAVY }}>{agreement.status.replace(/_/g, " ")}</span>
            {agreement.signedByName && <span className="text-muted-foreground"> — signed by {agreement.signedByName}</span>}
          </p>
          <Button size="sm" variant="outline" onClick={downloadDraft} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download Draft (.html)
          </Button>
          {canManage && agreement.status !== "signed" && (
            <div className="border-t border-border/50 pt-3 space-y-2">
              <Field label="Signer Name" required>
                <Input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Name on the signed copy" />
              </Field>
              {error && <ErrorBanner message={error} />}
              <input
                ref={fileInputRef}
                type="file"
                accept={UPLOAD_ALLOWED_MIME_TYPES.join(",")}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadSignedCopy(f); }}
              />
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
                <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading..." : "Upload Signed Copy"}
              </Button>
            </div>
          )}
        </div>
      )}
    </PortalCard>
  );
}

function EverifyEnrollmentSection({ company, canManage, onSaved }: { company: I9ClientCompany; canManage: boolean; onSaved: (patch: Partial<I9ClientCompany>) => void }) {
  const [editing, setEditing] = useState(false);
  const [everifyCompanyId, setEverifyCompanyId] = useState(company.everifyCompanyId ?? "");
  const [mouSignerName, setMouSignerName] = useState(company.mouSignerName ?? "");
  const [mouSignedDate, setMouSignedDate] = useState(company.mouSignedDate ?? "");
  const [mouSecureReference, setMouSecureReference] = useState(company.mouSecureReference ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      await i9Api(`/api/i9/companies/${company.id}/everify-enrollment`, {
        method: "POST",
        body: JSON.stringify({
          everifyCompanyId: everifyCompanyId || undefined,
          mouSignerName: mouSignerName || undefined,
          mouSignedDate: mouSignedDate || undefined,
          mouSecureReference: mouSecureReference || undefined,
        }),
      });
      onSaved({ everifyCompanyId, mouSignerName, mouSignedDate, mouSecureReference });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save E-Verify enrollment info.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalCard
      title="E-Verify Enrollment (recorded by LBS, executed externally)"
      action={canManage && !editing ? <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button> : undefined}
    >
      {!editing ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-xs text-muted-foreground">E-Verify Company ID</dt><dd>{company.everifyCompanyId || "Not yet recorded"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">MOU Signer</dt><dd>{company.mouSignerName || "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">MOU Signed Date</dt><dd>{company.mouSignedDate || "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Secure Reference</dt><dd>{company.mouSecureReference || "—"}</dd></div>
        </dl>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="E-Verify Company ID"><Input value={everifyCompanyId} onChange={(e) => setEverifyCompanyId(e.target.value)} /></Field>
            <Field label="MOU Signer Name"><Input value={mouSignerName} onChange={(e) => setMouSignerName(e.target.value)} /></Field>
            <Field label="MOU Signed Date"><Input type="date" value={mouSignedDate} onChange={(e) => setMouSignedDate(e.target.value)} /></Field>
            <Field label="Secure Reference" hint="A pointer to where the signed MOU copy is filed — not the file itself."><Input value={mouSecureReference} onChange={(e) => setMouSecureReference(e.target.value)} /></Field>
          </div>
          {error && <ErrorBanner message={error} />}
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving} className="text-white" style={{ backgroundColor: NAVY }}>{saving ? "Saving..." : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        The E-Verify MOU is executed by the client directly with DHS/SSA, outside this website. This section only
        records status and reference information after the fact.
      </p>
    </PortalCard>
  );
}

const APPT_TYPE_LABELS: Record<I9Appointment["appointmentType"], string> = {
  in_office_examination: "In-Office Document Examination",
  mobile_examination: "Mobile Document Examination",
  hiring_event: "Hiring-Event Support",
};

/** Confirmation is intentionally blocked server-side for in-office/mobile
 *  exams without an authorized-rep designation on file (see
 *  server/i9Routes.ts's PATCH .../confirm) — the button here just surfaces
 *  whatever reason the server gives rather than duplicating that check. */
function AppointmentsAdminSection({ companyId }: { companyId: string }) {
  const [appointments, setAppointments] = useState<I9Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    i9Api<{ appointments: I9Appointment[] }>(`/api/i9/appointments?companyId=${companyId}`)
      .then((r) => setAppointments(r.appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  async function confirm(id: string) {
    setConfirmingId(id);
    setError("");
    try {
      await i9Api(`/api/i9/appointments/${id}/confirm`, { method: "PATCH" });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "confirmed" } : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm appointment.");
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) return null;
  if (appointments.length === 0) return null;

  return (
    <PortalCard title="Appointments">
      {error && <ErrorBanner message={error} />}
      <ul className="divide-y divide-border/50">
        {appointments.map((a) => (
          <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium" style={{ color: NAVY }}>{APPT_TYPE_LABELS[a.appointmentType]}</p>
              <p className="text-xs text-muted-foreground capitalize">{a.status}{a.employeeCountEstimate ? ` · ~${a.employeeCountEstimate} employees` : ""}</p>
            </div>
            {a.status === "requested" && (
              <Button size="sm" variant="outline" disabled={confirmingId === a.id} onClick={() => confirm(a.id)} className="gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {confirmingId === a.id ? "..." : "Confirm"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </PortalCard>
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

        <EverifyEnrollmentSection company={company} canManage={canChangeStatus} onSaved={(patch) => setCompany((c) => (c ? { ...c, ...patch } : c))} />

        <AgreementSection companyId={company.id} canManage={canChangeStatus} />

        <AppointmentsAdminSection companyId={company.id} />
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
