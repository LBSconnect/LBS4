import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, FileSignature } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  type I9AuthorizedRepDesignation,
  type I9Appointment,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, SuccessBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

const APPT_TYPE_LABELS: Record<I9Appointment["appointmentType"], string> = {
  in_office_examination: "In-Office Document Examination ($39/employee)",
  mobile_examination: "Mobile Document Examination ($95 + travel)",
  hiring_event: "Hiring-Event Support ($350+)",
};
const APPT_STATUS_STYLES: Record<I9Appointment["status"], string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

function DesignationForm({ companyId, onCreated }: { companyId: string; onCreated: (d: I9AuthorizedRepDesignation) => void }) {
  const [open, setOpen] = useState(false);
  const [employerLegalName, setEmployerLegalName] = useState("");
  const [employeeNameOrClass, setEmployeeNameOrClass] = useState("");
  const [designatedLbsRepresentativeName, setDesignatedLbsRepresentativeName] = useState("");
  const [scopeOfAuthorization, setScopeOfAuthorization] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in_office" | "mobile" | "">("");
  const [location, setLocation] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!acknowledged) {
      setError("The employer must acknowledge responsibility for Form I-9 compliance and the acts of its representative.");
      return;
    }
    setSaving(true);
    try {
      const r = await i9Api<{ designation: I9AuthorizedRepDesignation }>("/api/i9/authorized-rep-designations", {
        method: "POST",
        body: JSON.stringify({
          clientCompanyId: companyId, employerLegalName, employeeNameOrClass, designatedLbsRepresentativeName,
          scopeOfAuthorization, appointmentType, location, effectiveDate, employerAcknowledgedResponsibility: acknowledged,
        }),
      });
      onCreated(r.designation);
      setOpen(false);
      setEmployerLegalName(""); setEmployeeNameOrClass(""); setDesignatedLbsRepresentativeName("");
      setScopeOfAuthorization(""); setAppointmentType(""); setLocation(""); setEffectiveDate(""); setAcknowledged(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create designation.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}><FileSignature className="w-3.5 h-3.5" /> New Designation</Button>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-[#f8f9fb] rounded-xl p-4 border border-border/50">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Business document — legal review recommended before use.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employer Legal Name" required><Input value={employerLegalName} onChange={(e) => setEmployerLegalName(e.target.value)} required /></Field>
        <Field label="Employee Name or Class" required hint='e.g. a named employee, or "all new hires at Site X, 8/1–8/31"'><Input value={employeeNameOrClass} onChange={(e) => setEmployeeNameOrClass(e.target.value)} required /></Field>
        <Field label="Designated LBS Representative" required><Input value={designatedLbsRepresentativeName} onChange={(e) => setDesignatedLbsRepresentativeName(e.target.value)} required /></Field>
        <Field label="Appointment Type" required>
          <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={appointmentType} onChange={(e) => setAppointmentType(e.target.value as typeof appointmentType)} required>
            <option value="">Select...</option>
            <option value="in_office">In-Office</option>
            <option value="mobile">Mobile</option>
          </select>
        </Field>
        <Field label="Location" required><Input value={location} onChange={(e) => setLocation(e.target.value)} required /></Field>
        <Field label="Effective Date" required><Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required /></Field>
      </div>
      <Field label="Scope of Authorization" required><Textarea value={scopeOfAuthorization} onChange={(e) => setScopeOfAuthorization(e.target.value)} rows={3} required /></Field>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5 w-4 h-4" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
        <span className="text-sm text-foreground">Employer acknowledges responsibility for Form I-9 compliance and the acts of its designated representative.</span>
      </label>
      {error && <ErrorBanner message={error} />}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="text-white" style={{ backgroundColor: NAVY }}>{saving ? "Saving..." : "Create Designation"}</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

function AppointmentRequestForm({ companyId, designations, onCreated }: { companyId: string; designations: I9AuthorizedRepDesignation[]; onCreated: (a: I9Appointment) => void }) {
  const [appointmentType, setAppointmentType] = useState<I9Appointment["appointmentType"] | "">("");
  const [designationId, setDesignationId] = useState("");
  const [employeeCountEstimate, setEmployeeCountEstimate] = useState("");
  const [i9Notes, setI9Notes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsDesignation = appointmentType === "in_office_examination" || appointmentType === "mobile_examination";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const r = await i9Api<{ appointment: I9Appointment }>("/api/i9/appointments", {
        method: "POST",
        body: JSON.stringify({
          clientCompanyId: companyId,
          appointmentType,
          authorizedRepDesignationId: designationId || undefined,
          employeeCountEstimate: employeeCountEstimate ? Number(employeeCountEstimate) : undefined,
          i9Notes: i9Notes || undefined,
        }),
      });
      onCreated(r.appointment);
      setAppointmentType(""); setDesignationId(""); setEmployeeCountEstimate(""); setI9Notes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Appointment Type" required>
          <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={appointmentType} onChange={(e) => setAppointmentType(e.target.value as typeof appointmentType)} required>
            <option value="">Select...</option>
            {Object.entries(APPT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        {needsDesignation && (
          <Field label="Authorized Rep Designation" required hint="An in-office or mobile exam cannot be confirmed without one.">
            <select className="w-full h-9 px-3 text-sm border border-input rounded-md bg-background" value={designationId} onChange={(e) => setDesignationId(e.target.value)} required>
              <option value="">Select...</option>
              {designations.map((d) => <option key={d.id} value={d.id}>{d.employeeNameOrClass} — {d.effectiveDate}</option>)}
            </select>
          </Field>
        )}
        <Field label="Estimated Employee Count"><Input type="number" min="1" value={employeeCountEstimate} onChange={(e) => setEmployeeCountEstimate(e.target.value)} /></Field>
      </div>
      <Field label="Notes"><Textarea value={i9Notes} onChange={(e) => setI9Notes(e.target.value)} rows={2} /></Field>

      <div className="text-xs text-muted-foreground bg-[#f8f9fb] rounded-lg p-3 space-y-1">
        <p>Ask each employee to bring documents of the employee's choosing that establish identity and work authorization — LBS does not recommend or require specific documents.</p>
        <p>This appointment is a document examination in support of Form I-9, not a notarization.</p>
      </div>

      {error && <ErrorBanner message={error} />}
      <Button type="submit" disabled={saving || !appointmentType || (needsDesignation && !designationId)} className="text-white gap-1.5" style={{ backgroundColor: NAVY }}>
        <CalendarPlus className="w-4 h-4" /> {saving ? "Requesting..." : "Request Appointment"}
      </Button>
    </form>
  );
}

function AppointmentsSection({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [designations, setDesignations] = useState<I9AuthorizedRepDesignation[]>([]);
  const [appointments, setAppointments] = useState<I9Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      i9Api<{ designations: I9AuthorizedRepDesignation[] }>(`/api/i9/authorized-rep-designations?companyId=${companyId}`),
      i9Api<{ appointments: I9Appointment[] }>(`/api/i9/appointments?companyId=${companyId}`),
    ])
      .then(([d, a]) => {
        if (!active) return;
        setDesignations(d.designations);
        setAppointments(a.appointments);
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading appointments...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;

  return (
    <div className="space-y-5">
      <PortalCard title="Authorized Representative Designations" action={<DesignationForm companyId={companyId} onCreated={(d) => setDesignations((p) => [...p, d])} />}>
        {designations.length === 0 ? (
          <p className="text-sm text-muted-foreground">None on file yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {designations.map((d) => (
              <li key={d.id} className="py-2 text-sm">
                <p className="font-medium" style={{ color: NAVY }}>{d.employeeNameOrClass}</p>
                <p className="text-xs text-muted-foreground">{d.designatedLbsRepresentativeName} · {d.appointmentType} · effective {d.effectiveDate}</p>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>

      <PortalCard title="Request an Appointment">
        <AppointmentRequestForm companyId={companyId} designations={designations} onCreated={(a) => setAppointments((p) => [a, ...p])} />
      </PortalCard>

      <PortalCard title="Appointments">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {appointments.map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium" style={{ color: NAVY }}>{APPT_TYPE_LABELS[a.appointmentType]}</p>
                  {a.employeeCountEstimate && <p className="text-xs text-muted-foreground">~{a.employeeCountEstimate} employees</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${APPT_STATUS_STYLES[a.status]}`}>{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </PortalCard>
    </div>
  );
}

/** Client-only: LBS staff confirm requested appointments from the admin
 *  company detail page instead (per-company, alongside the rest of that
 *  company's onboarding data), not from a page keyed on the acting user's
 *  own clientCompanyId — which is always null for LBS staff. */
export default function PortalAppointments() {
  return (
    <PortalGuard roles={["client_authorized_signer", "client_limited_user"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Appointments">
          {user.clientCompanyId ? (
            <AppointmentsSection companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">No company is associated with this account.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
