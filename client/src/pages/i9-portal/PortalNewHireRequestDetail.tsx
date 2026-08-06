import { useEffect, useState, useCallback } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, ShieldCheck, Eye, EyeOff, ExternalLink, FileText } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  isInternalRole,
  containsLikelySensitivePattern,
  SENSITIVE_FREE_TEXT_WARNING,
  REQUEST_STATUS_LABELS,
  statusBadgeClass,
  type I9NewHireRequest,
  type I9CaseActivity,
  type I9Role,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, SuccessBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

interface ProtectedSummary {
  hasData: boolean;
  employeeName: string;
  ssnMasked: string | null;
  hasDocumentInfo: boolean;
}
interface DetailResponse {
  request: I9NewHireRequest;
  protectedDataSummary: ProtectedSummary | null;
  informationalCaseCreationTarget: { date: string; noncontrolling: true };
}

const GOVERNMENT_RESULT_OPTIONS: { value: string; label: string }[] = [
  { value: "employment_authorized", label: "Employment Authorized" },
  { value: "needs_more_time", label: "Needs More Time (DHS/SSA verifying)" },
  { value: "mismatch_employee_decision_pending", label: "Mismatch — Employee Decision Pending" },
  { value: "case_in_continuance", label: "Case in Continuance" },
  { value: "referred_to_dhs", label: "Referred to DHS" },
  { value: "referred_to_ssa", label: "Referred to SSA" },
  { value: "referred_to_dhs_and_ssa", label: "Referred to DHS & SSA" },
  { value: "final_nonconfirmation", label: "Final Nonconfirmation" },
];

function RequiredAttestationsSummary({ request }: { request: I9NewHireRequest }) {
  const items: { label: string; ok: boolean }[] = [
    { label: "Job offer accepted", ok: request.attestJobOfferAccepted },
    { label: "Not pre-screening", ok: request.attestNotPreScreening },
    { label: "Employee chose documents", ok: request.attestEmployeeChoseDocuments },
    { label: "Information accurate", ok: request.attestInformationAccurate },
    { label: "Participating hiring site confirmed", ok: request.attestParticipatingHiringSite },
  ];
  return (
    <ul className="text-sm space-y-1">
      {items.map((i) => (
        <li key={i.label} className={i.ok ? "text-green-700" : "text-amber-700"}>
          {i.ok ? "✓" : "○"} {i.label}
        </li>
      ))}
    </ul>
  );
}

function ClientSubmitSection({ request, onSubmitted }: { request: I9NewHireRequest; onSubmitted: (r: I9NewHireRequest) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allAttested =
    request.attestJobOfferAccepted &&
    request.attestNotPreScreening &&
    request.attestEmployeeChoseDocuments &&
    request.attestInformationAccurate &&
    request.attestParticipatingHiringSite;

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      await i9Api(`/api/i9/new-hire-requests/${request.id}/submit`, { method: "POST" });
      onSubmitted({ ...request, status: "submitted" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalCard title="Ready to Submit?">
      <RequiredAttestationsSummary request={request} />
      {!allAttested && (
        <p className="text-xs text-amber-700">
          One or more required attestations are not yet confirmed. This request was saved with those unchecked —
          create a new request with all attestations confirmed, or contact LBS to have this draft corrected.
        </p>
      )}
      {error && <ErrorBanner message={error} />}
      <Button onClick={submit} disabled={submitting || !allAttested} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
        <Send className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit for Processing"}
      </Button>
    </PortalCard>
  );
}

function LbsStaffActions({ request, onUpdated }: { request: I9NewHireRequest; onUpdated: (r: I9NewHireRequest) => void }) {
  // Second-review gate: submitted / deficient -> ready_for_case_creation
  const [secondReview, setSecondReview] = useState(false);
  const [readyBusy, setReadyBusy] = useState(false);
  const [readyError, setReadyError] = useState("");

  // Flag as deficient
  const [deficientNote, setDeficientNote] = useState("");
  const [deficientBusy, setDeficientBusy] = useState(false);
  const [deficientError, setDeficientError] = useState("");

  // Record case result -> case_created
  const [caseNumber, setCaseNumber] = useState("");
  const [initialResult, setInitialResult] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [caseNotes, setCaseNotes] = useState("");
  const [caseBusy, setCaseBusy] = useState(false);
  const [caseError, setCaseError] = useState("");

  // Record government result
  const [govResult, setGovResult] = useState("");
  const [govNote, setGovNote] = useState("");
  const [govBusy, setGovBusy] = useState(false);
  const [govError, setGovError] = useState("");

  async function markReady() {
    setReadyBusy(true);
    setReadyError("");
    try {
      await i9Api(`/api/i9/new-hire-requests/${request.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: "ready_for_case_creation", secondReviewConfirmed: secondReview }),
      });
      onUpdated({ ...request, status: "ready_for_case_creation" });
    } catch (err) {
      setReadyError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setReadyBusy(false);
    }
  }

  async function markDeficient() {
    setDeficientBusy(true);
    setDeficientError("");
    if (containsLikelySensitivePattern(deficientNote)) {
      setDeficientError(SENSITIVE_FREE_TEXT_WARNING);
      setDeficientBusy(false);
      return;
    }
    try {
      await i9Api(`/api/i9/new-hire-requests/${request.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: "deficient_client_action_required", note: deficientNote || undefined }),
      });
      onUpdated({ ...request, status: "deficient_client_action_required" });
      setDeficientNote("");
    } catch (err) {
      setDeficientError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setDeficientBusy(false);
    }
  }

  async function recordCaseResult() {
    setCaseBusy(true);
    setCaseError("");
    if (containsLikelySensitivePattern(caseNotes)) {
      setCaseError(SENSITIVE_FREE_TEXT_WARNING);
      setCaseBusy(false);
      return;
    }
    try {
      await i9Api(`/api/i9/new-hire-requests/${request.id}/case-result`, {
        method: "POST",
        body: JSON.stringify({
          everifyCaseNumber: caseNumber,
          everifyInitialResult: initialResult,
          deadlineDate: deadlineDate || undefined,
          deadlineType: deadlineDate ? "everify_displayed" : undefined,
          notes: caseNotes || undefined,
        }),
      });
      onUpdated({ ...request, status: "case_created", everifyCaseNumber: caseNumber, everifyInitialResult: initialResult });
      setCaseNumber(""); setInitialResult(""); setDeadlineDate(""); setCaseNotes("");
    } catch (err) {
      setCaseError(err instanceof Error ? err.message : "Failed to record case result.");
    } finally {
      setCaseBusy(false);
    }
  }

  async function recordGovResult() {
    setGovBusy(true);
    setGovError("");
    if (containsLikelySensitivePattern(govNote)) {
      setGovError(SENSITIVE_FREE_TEXT_WARNING);
      setGovBusy(false);
      return;
    }
    try {
      await i9Api(`/api/i9/new-hire-requests/${request.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: govResult, note: govNote || undefined }),
      });
      onUpdated({ ...request, status: govResult as I9NewHireRequest["status"] });
      setGovNote("");
    } catch (err) {
      setGovError(err instanceof Error ? err.message : "Failed to record result.");
    } finally {
      setGovBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {(request.status === "submitted" || request.status === "deficient_client_action_required") && (
        <PortalCard title="LBS Review">
          <RequiredAttestationsSummary request={request} />
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" className="mt-0.5 w-4 h-4" checked={secondReview} onChange={(e) => setSecondReview(e.target.checked)} />
            <span className="text-sm text-foreground">I am a second reviewer and confirm this request is ready for E-Verify case creation.</span>
          </label>
          {readyError && <ErrorBanner message={readyError} />}
          <Button onClick={markReady} disabled={readyBusy || !secondReview} className="text-white" style={{ backgroundColor: NAVY }}>
            {readyBusy ? "Saving..." : "Mark Ready for Case Creation"}
          </Button>

          <div className="pt-3 border-t border-border/50 space-y-2">
            <Field label="Deficiency note (if flagging back to client)" hint="Neutral, non-legal language only — never instruct how to alter an attestation.">
              <Textarea value={deficientNote} onChange={(e) => setDeficientNote(e.target.value)} rows={2} />
            </Field>
            {deficientError && <ErrorBanner message={deficientError} />}
            <Button variant="outline" onClick={markDeficient} disabled={deficientBusy}>
              {deficientBusy ? "Saving..." : "Flag as Deficient — Client Action Required"}
            </Button>
          </div>
        </PortalCard>
      )}

      {(request.status === "ready_for_case_creation" || request.status === "assigned") && (
        <PortalCard title="Record E-Verify Case Result">
          <p className="text-xs text-muted-foreground">
            Enter what E-Verify displayed after manually creating this case. Open E-Verify in a separate tab — this
            portal never automates or stores E-Verify credentials.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-Verify Case Number" required><Input value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} /></Field>
            <Field label="Initial Result" required><Input value={initialResult} onChange={(e) => setInitialResult(e.target.value)} placeholder="e.g. Employment Authorized" /></Field>
            <Field label="Deadline Date (as shown by E-Verify)" hint="Enter exactly what E-Verify displayed — never calculate this from memory.">
              <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes"><Textarea value={caseNotes} onChange={(e) => setCaseNotes(e.target.value)} rows={2} /></Field>
          {caseError && <ErrorBanner message={caseError} />}
          <Button onClick={recordCaseResult} disabled={caseBusy || !caseNumber || !initialResult} className="text-white" style={{ backgroundColor: NAVY }}>
            {caseBusy ? "Saving..." : "Record Case Result"}
          </Button>
        </PortalCard>
      )}

      {request.status === "case_created" && (
        <PortalCard title="Record Government Result">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Result" required>
              <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={govResult} onChange={(e) => setGovResult(e.target.value)}>
                <option value="">Select...</option>
                {GOVERNMENT_RESULT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes" hint="No adverse-action language. This is administrative case tracking, not an employment recommendation.">
            <Textarea value={govNote} onChange={(e) => setGovNote(e.target.value)} rows={2} />
          </Field>
          {govError && <ErrorBanner message={govError} />}
          <Button onClick={recordGovResult} disabled={govBusy || !govResult} className="text-white" style={{ backgroundColor: NAVY }}>
            {govBusy ? "Saving..." : "Record Result"}
          </Button>
        </PortalCard>
      )}
    </div>
  );
}

interface RevealedData {
  employeeName: string;
  employeeContact: string | null;
  ssn: string | null;
  documentInfo: Record<string, unknown> | null;
}

/** Shown to every role that can see this request, but write access is
 *  gated the same way the server gates it (any authenticated user in the
 *  right tenant EXCEPT lbs_intake_billing) and reveal is gated to LBS
 *  program admins / case processors only — matching
 *  server/i9Routes.ts's protected-data routes exactly. This is the one
 *  place in the whole portal that ever displays an unmasked SSN, and only
 *  after an explicit, audited reveal action. */
function ProtectedDataSection({ requestId, role, summary, onChanged }: { requestId: string; role: I9Role; summary: ProtectedSummary | null; onChanged: () => void }) {
  const canWrite = role !== "lbs_intake_billing";
  const canReveal = role === "lbs_program_admin" || role === "lbs_case_processor";

  const [showForm, setShowForm] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeContact, setEmployeeContact] = useState("");
  const [ssn, setSsn] = useState("");
  const [listB, setListB] = useState("");
  const [listC, setListC] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState("");
  const [saved, setSaved] = useState(false);

  const [revealed, setRevealed] = useState<RevealedData | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState("");

  async function submitWrite(e: React.FormEvent) {
    e.preventDefault();
    setWriteError("");
    setSaving(true);
    try {
      await i9Api(`/api/i9/new-hire-requests/${requestId}/protected-data`, {
        method: "POST",
        body: JSON.stringify({
          employeeName,
          employeeContact: employeeContact || undefined,
          ssn: ssn || undefined,
          documentInfo: listB || listC ? { listB: listB || undefined, listC: listC || undefined } : undefined,
        }),
      });
      setSaved(true);
      setShowForm(false);
      setSsn(""); // never linger in component state longer than needed
      onChanged();
    } catch (err) {
      setWriteError(err instanceof Error ? err.message : "Failed to save protected employee data.");
    } finally {
      setSaving(false);
    }
  }

  async function reveal() {
    setRevealError("");
    if (revealReason.trim().length < 5) {
      setRevealError("Please provide a brief reason (at least 5 characters) — this is recorded in the audit log.");
      return;
    }
    setRevealing(true);
    try {
      const r = await i9Api<{ data: RevealedData }>(`/api/i9/new-hire-requests/${requestId}/protected-data/reveal`, {
        method: "POST",
        body: JSON.stringify({ reason: revealReason }),
      });
      setRevealed(r.data);
    } catch (err) {
      setRevealError(err instanceof Error ? err.message : "Failed to reveal protected employee data.");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <PortalCard title="Protected Employee Data">
      <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800">
        <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Encrypted at rest. Never shown in full outside this narrow, audited view — not in lists, reports, notifications, or URLs.</span>
      </div>

      {summary?.hasData ? (
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>{summary.employeeName}{summary.ssnMasked ? ` · SSN ${summary.ssnMasked}` : ""}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No protected employee data has been entered for this request yet.</p>
      )}

      {canWrite && (!summary?.hasData || showForm) && (
        <form onSubmit={submitWrite} className="space-y-3 border-t border-border/50 pt-3">
          <Field label="Employee Name" required><Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} /></Field>
          <Field label="Employee Contact (email or phone)"><Input value={employeeContact} onChange={(e) => setEmployeeContact(e.target.value)} /></Field>
          <Field label="Social Security Number" hint="9 digits, with or without dashes. Encrypted immediately; only ever shown in full via an explicit, audited reveal.">
            <Input value={ssn} onChange={(e) => setSsn(e.target.value)} placeholder="XXX-XX-XXXX" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="List B Document"><Input value={listB} onChange={(e) => setListB(e.target.value)} placeholder="e.g. Driver's License" /></Field>
            <Field label="List C Document"><Input value={listC} onChange={(e) => setListC(e.target.value)} placeholder="e.g. Social Security Card" /></Field>
          </div>
          {writeError && <ErrorBanner message={writeError} />}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving || !employeeName} className="text-white" style={{ backgroundColor: NAVY }}>
              {saving ? "Saving..." : "Save Protected Data"}
            </Button>
            {summary?.hasData && <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>}
          </div>
        </form>
      )}
      {canWrite && summary?.hasData && !showForm && (
        <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>Update Protected Data</Button>
      )}
      {saved && <SuccessBanner message="Protected employee data saved securely." />}

      {canReveal && summary?.hasData && (
        <div className="border-t border-border/50 pt-3 space-y-2">
          {!revealed ? (
            <>
              <Field label="Reason for reveal" required hint="A brief business reason — recorded in the audit log alongside who revealed it and when.">
                <Input value={revealReason} onChange={(e) => setRevealReason(e.target.value)} placeholder="e.g. Manual E-Verify case entry" />
              </Field>
              {revealError && <ErrorBanner message={revealError} />}
              <Button size="sm" variant="outline" onClick={reveal} disabled={revealing} className="gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {revealing ? "Revealing..." : "Reveal Full Details"}
              </Button>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-1.5">
              <p className="font-semibold text-red-800 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Revealed — handle per your organization's data-handling policy</p>
              <p><span className="text-xs text-muted-foreground">Name:</span> {revealed.employeeName}</p>
              {revealed.employeeContact && <p><span className="text-xs text-muted-foreground">Contact:</span> {revealed.employeeContact}</p>}
              {revealed.ssn && <p className="font-mono"><span className="text-xs text-muted-foreground font-sans">SSN:</span> {revealed.ssn}</p>}
              {revealed.documentInfo && (
                <div>
                  <span className="text-xs text-muted-foreground">Documents:</span>
                  <ul className="list-disc list-inside">
                    {Object.entries(revealed.documentInfo).map(([k, v]) => v ? <li key={k}>{k}: {String(v)}</li> : null)}
                  </ul>
                </div>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setRevealed(null); setRevealReason(""); }} className="gap-1.5">
                <EyeOff className="w-3.5 h-3.5" /> Hide
              </Button>
            </div>
          )}
        </div>
      )}
    </PortalCard>
  );
}

interface WorkPacketField { value: unknown; source: string }
interface WorkPacket {
  clientCompanyName: WorkPacketField;
  internalRequestNumber: WorkPacketField;
  hiringSiteId: WorkPacketField;
  firstDayOfEmploymentForPay: WorkPacketField;
  informationalTarget: WorkPacketField;
  formI9Section1Date: WorkPacketField;
  formI9Section2Date: WorkPacketField;
  attestations: WorkPacketField;
  employeeName: WorkPacketField;
  ssnMasked: WorkPacketField;
  status: WorkPacketField;
}

function formatWorkPacketValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** LBS staff only — everything needed to manually create the case in
 *  E-Verify, with each value's source labeled per the brief. The "Open
 *  E-Verify" link is external-only: no credentials, no data in the URL, no
 *  automation of the government portal. */
function WorkPacketSection({ requestId }: { requestId: string }) {
  const [packet, setPacket] = useState<WorkPacket | null>(null);
  const [everifyUrl, setEverifyUrl] = useState<string>("https://everify.uscis.gov/everify/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await i9Api<{ workPacket: WorkPacket; everifyExternalUrl: string }>(`/api/i9/new-hire-requests/${requestId}/work-packet`);
      setPacket(r.workPacket);
      setEverifyUrl(r.everifyExternalUrl);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work packet.");
    } finally {
      setLoading(false);
    }
  }

  const rows: { label: string; field: keyof WorkPacket }[] = [
    { label: "Client Company", field: "clientCompanyName" },
    { label: "Internal Request #", field: "internalRequestNumber" },
    { label: "Hiring Site ID", field: "hiringSiteId" },
    { label: "First Day of Pay", field: "firstDayOfEmploymentForPay" },
    { label: "Informational Target", field: "informationalTarget" },
    { label: "Form I-9 Section 1 Date", field: "formI9Section1Date" },
    { label: "Form I-9 Section 2 Date", field: "formI9Section2Date" },
    { label: "Attestations", field: "attestations" },
    { label: "Employee Name", field: "employeeName" },
    { label: "SSN (masked)", field: "ssnMasked" },
    { label: "Status", field: "status" },
  ];

  return (
    <PortalCard
      title="Case Work Packet"
      action={
        !open ? (
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1.5">
            <FileText className="w-3.5 h-3.5" /> {loading ? "Loading..." : "View Work Packet"}
          </Button>
        ) : (
          <a href={everifyUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
              Open E-Verify <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
        )
      }
    >
      {error && <ErrorBanner message={error} />}
      {open && packet && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/50">
                <th className="py-1.5 pr-3 font-medium">Field</th>
                <th className="py-1.5 pr-3 font-medium">Value</th>
                <th className="py-1.5 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, field }) => (
                <tr key={field} className="border-b border-border/30 align-top">
                  <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{label}</td>
                  <td className="py-1.5 pr-3">{formatWorkPacketValue(packet[field].value)}</td>
                  <td className="py-1.5 text-xs text-muted-foreground">{packet[field].source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground pt-2">
            E-Verify opens in a new tab — no credentials or case data are passed in the URL, and this portal never
            automates or stores E-Verify credentials. Enter the case manually, then use "Record E-Verify Case Result"
            below to log what E-Verify returned.
          </p>
        </div>
      )}
    </PortalCard>
  );
}

function RequestDetail({ id, role }: { id: string; role: I9Role }) {
  const onUnauth = useUnauthRedirect();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [activity, setActivity] = useState<I9CaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  /** `silent: true` re-fetches without toggling the page-level loading flag —
   *  used when a child section (protected data, status actions) just wrote
   *  something and wants fresh data reflected without blanking the whole
   *  page back to "Loading request..." on every save. Without this, a child
   *  triggering the ordinary (non-silent) refresh unmounts the entire detail
   *  grid — including that same child — wiping any of its own local "saved"
   *  confirmation state before the user has a chance to see it. Caught via a
   *  Playwright test whose success-banner assertion kept failing even though
   *  the write itself was succeeding every time. */
  const load = useCallback((opts: { silent?: boolean } = {}) => {
    let active = true;
    if (!opts.silent) setLoading(true);
    Promise.all([
      i9Api<DetailResponse>(`/api/i9/new-hire-requests/${id}`),
      i9Api<{ activity: I9CaseActivity[] }>(`/api/i9/new-hire-requests/${id}/activity`).catch(() => ({ activity: [] })),
    ])
      .then(([detail, act]) => {
        if (!active) return;
        setData(detail);
        setActivity(act.activity);
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
      .finally(() => { if (active && !opts.silent) setLoading(false); });
    return () => {
      active = false;
    };
  }, [id, onUnauth]);

  useEffect(() => load(), [load]);
  const silentReload = useCallback(() => load({ silent: true }), [load]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading request...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;
  if (notFound) return <p className="text-sm text-muted-foreground">Request not found.</p>;
  if (!data) return null;

  const { request, protectedDataSummary, informationalCaseCreationTarget } = data;
  const isClientRole = role === "client_authorized_signer" || role === "client_limited_user";
  const isInternal = isInternalRole(role);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <PortalCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Internal Request Number</p>
              <p className="text-lg font-bold" style={{ color: NAVY }}>{request.internalRequestNumber}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusBadgeClass(request.status)}`}>
              {REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2">
            <div><dt className="text-xs text-muted-foreground">Service Requested</dt><dd>{request.serviceRequested}</dd></div>
            <div><dt className="text-xs text-muted-foreground">First Day of Employment for Pay</dt><dd>{request.firstDayOfEmploymentForPay}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Form I-9 Section 1 Completed</dt><dd>{request.formI9Section1CompletedDate || "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Form I-9 Section 2 Completed</dt><dd>{request.formI9Section2CompletedDate || "—"}</dd></div>
            {request.everifyCaseNumber && <div><dt className="text-xs text-muted-foreground">E-Verify Case Number</dt><dd className="font-mono">{request.everifyCaseNumber}</dd></div>}
            {request.everifyInitialResult && <div><dt className="text-xs text-muted-foreground">Initial Result</dt><dd>{request.everifyInitialResult}</dd></div>}
          </dl>
          <div className="text-xs bg-[#f8f9fb] rounded-lg p-3 text-muted-foreground">
            Informational case-creation target: <strong>{informationalCaseCreationTarget.date}</strong> (3 US business
            days after first day of pay). This is a non-controlling estimate — it never overrides a deadline
            E-Verify actually displays.
          </div>
        </PortalCard>

        <ProtectedDataSection requestId={request.id} role={role} summary={protectedDataSummary} onChanged={silentReload} />

        {isInternal && <WorkPacketSection requestId={request.id} />}

        {request.clientNotes && (
          <PortalCard title="Client Notes"><p className="text-sm whitespace-pre-wrap">{request.clientNotes}</p></PortalCard>
        )}

        {request.status === "draft" && isClientRole && <ClientSubmitSection request={request} onSubmitted={(r) => setData((d) => (d ? { ...d, request: r } : d))} />}
        {isInternal && <LbsStaffActions request={request} onUpdated={(r) => setData((d) => (d ? { ...d, request: r } : d))} />}
      </div>

      <div className="space-y-5">
        <PortalCard title="Activity">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm border-l-2 pl-3" style={{ borderColor: NAVY }}>
                  <p className="font-medium">{REQUEST_STATUS_LABELS[a.toStatus as keyof typeof REQUEST_STATUS_LABELS] ?? a.toStatus}</p>
                  {a.note && <p className="text-xs text-muted-foreground">{a.note}</p>}
                  {a.createdAt && <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>}
                </li>
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  );
}

export default function PortalNewHireRequestDetail() {
  const params = useParams<{ id: string }>();
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="New-Hire Request">
          {params.id ? <RequestDetail id={params.id} role={user.role} /> : <p className="text-sm text-muted-foreground">Missing request id.</p>}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
