// ─────────────────────────────────────────────────────────────────────────────
// Notification emails for the New-Hire Verification & Form I-9 Support portal.
//
// HARD RULE: no function in this file may accept a parameter containing a
// Social Security number, document number, immigration status, mismatch
// detail, or file attachment of sensitive employee data. Every template below
// only ever receives a company name, a generic event label, and a login URL —
// that's enforced by the function signatures themselves, not by convention.
// Anyone extending this file should keep it that way; if you find yourself
// wanting to pass employee-specific detail into an email, the right answer is
// "put it in the portal and tell the reader to log in," not add a parameter.
// ─────────────────────────────────────────────────────────────────────────────

import { sendEmail } from "./smtpClient";
import type { I9NotificationEvent } from "@shared/i9Schema";

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || "info@lbsconnect.net";
const BUSINESS_NAME = "LBS New-Hire Verification & Form I-9 Support";
const BUSINESS_ADDRESS = "616 FM 1960 Road West, Suite 101, Houston, Texas 77090-3048";
const LBS_PHONE = "281-836-5357";
const PORTAL_LOGIN_URL = `${process.env.PUBLIC_SITE_URL || "https://www.lbs4.com"}/employer-services/new-hire-verification/portal/login`;

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${BUSINESS_NAME}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:#0d1b35;border-radius:10px 10px 0 0;padding:28px 36px;">
        <div style="color:#ffffff;font-size:20px;font-weight:700;">${BUSINESS_NAME}</div>
        <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">Secure Employer Portal</div>
      </td></tr>
      <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${content}
      </td></tr>
      <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:24px 36px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
          <strong style="color:#0d1b35;">Linton Business Solutions LLC</strong><br />
          ${BUSINESS_ADDRESS}<br />
          ${LBS_PHONE} &nbsp;|&nbsp; <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a>
        </p>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;line-height:1.6;">
          This message never contains Social Security numbers, document numbers, immigration status, or other
          sensitive employee information. LBS is enrolled as an E-Verify Employer Agent and provides
          administrative case-management and Form I-9 support; LBS does not provide immigration legal advice.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const EVENT_LABELS: Record<I9NotificationEvent, string> = {
  consultation_requested: "Your employer consultation request was received",
  agreement_pending: "Your LBS service agreement is ready for signature",
  setup_payment_pending: "A setup payment is pending on your account",
  business_intake_incomplete: "Business onboarding information is still needed",
  everify_enrollment_ready_for_lbs_action: "Your E-Verify enrollment is ready for LBS to process",
  mou_signature_pending: "Your E-Verify Memorandum of Understanding needs a signature",
  client_activated: "Your account is now active",
  new_hire_request_submitted: "A new-hire request was submitted",
  deficiency_requires_client_action: "A new-hire request needs your attention",
  three_business_day_target_approaching: "A case-creation target date is approaching",
  case_result_available: "A case result is available in your secure portal",
  mismatch_notice_review_pending: "A notice requires private review with an employee",
  employee_decision_deadline_approaching: "An employee decision deadline is approaching",
  referral_deadline_approaching: "A referral deadline is approaching",
  case_monitoring_due: "A case needs a status check",
  monthly_report_ready: "Your monthly report is ready",
  invoice_ready: "A new invoice is available",
  payment_failed: "A payment did not go through",
};

/** The one function every I-9 notification email goes through. Deliberately
 *  generic: it tells the recipient *that* something changed and to log in,
 *  never *what* changed in sensitive terms. */
export async function sendI9NotificationEmail(data: {
  to: string;
  recipientName: string;
  companyName: string;
  event: I9NotificationEvent;
}): Promise<boolean> {
  const label = EVENT_LABELS[data.event];
  const content = `
    <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">${label}</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${data.recipientName}, there's an update on your ${data.companyName} account in the secure LBS employer portal.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${PORTAL_LOGIN_URL}" style="display:inline-block;background:linear-gradient(90deg,#FF6A00,#FF2D55);color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:999px;text-decoration:none;">
        Log In to the Secure Portal
      </a>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Please do not reply to this email with any employee information.</p>
  `;
  return sendEmail({ to: data.to, subject: `${label} — ${BUSINESS_NAME}`, html: emailWrapper(content) });
}

/** Internal (LBS-staff-facing) copy of the same generic pattern, for events
 *  LBS itself needs to act on (e.g. everify_enrollment_ready_for_lbs_action). */
export async function sendI9InternalNotificationEmail(data: {
  companyName: string;
  event: I9NotificationEvent;
  detail?: string; // operational detail only (e.g. "3 hiring sites confirmed") — never employee data
}): Promise<boolean> {
  const label = EVENT_LABELS[data.event];
  const content = `
    <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">${label}</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Company: <strong>${data.companyName}</strong></p>
    ${data.detail ? `<p style="margin:0 0 16px;color:#374151;font-size:14px;">${data.detail}</p>` : ""}
    <div style="text-align:center;margin:20px 0;">
      <a href="${PORTAL_LOGIN_URL}" style="display:inline-block;background:#0d1b35;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;text-decoration:none;">
        Open Admin Portal
      </a>
    </div>
  `;
  return sendEmail({ to: NOTIFICATION_EMAIL, subject: `[I-9 Portal] ${label}: ${data.companyName}`, html: emailWrapper(content) });
}
