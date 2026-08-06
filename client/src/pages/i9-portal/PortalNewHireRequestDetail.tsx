import { useEffect, useState, useCallback } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, ShieldCheck } from "lucide-react";
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

function RequestDetail({ id, role }: { id: string; role: I9Role }) {
  const onUnauth = useUnauthRedirect();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [activity, setActivity] = useState<I9CaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
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
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, onUnauth]);

  useEffect(() => load(), [load]);

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

        {isInternal && (
          <PortalCard title="Employee Data on File">
            {protectedDataSummary?.hasData ? (
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span>{protectedDataSummary.employeeName}{protectedDataSummary.ssnMasked ? ` · SSN ${protectedDataSummary.ssnMasked}` : ""}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No protected employee data has been entered for this request yet. Entry of protected employee data is
                gated on secure-storage configuration and is not yet available in this build.
              </p>
            )}
          </PortalCard>
        )}

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
