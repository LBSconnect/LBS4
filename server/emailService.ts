import { sendEmail, createOutlookCalendarEvent } from './smtpClient';

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@lbsconnect.net';
const BUSINESS_NAME = 'LBS Test & Exam Center';
const BUSINESS_ADDRESS = '616 FM 1960 Road West, Suite 101, Houston, Texas 77090-3048';
const LBS_PHONE = '281-836-5357';

// All form-submitted values below are interpolated into HTML email bodies.
// Escape them so a submitted value like `<img src=x onerror=...>` or
// `<a href="http://phish">` can never inject markup/links into staff or
// customer-facing notification emails. Never call this on our own static
// template strings (BUSINESS_NAME, LBS_PHONE, pre-built HTML fragments, etc).
function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sanitizes a value for use inside an .ics VEVENT field. Per RFC 5545, raw
// newlines/semicolons/commas/backslashes are structural — an unescaped
// newline in a user-submitted field (e.g. booking notes) could inject
// additional ICS lines/properties into the calendar file. Escapes them into
// their literal RFC 5545 forms instead of stripping content.
function escapeICS(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${BUSINESS_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#0d1b35;border-radius:10px 10px 0 0;padding:28px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${BUSINESS_NAME}</div>
              <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">Notary &amp; Testing Services</div>
            </td>
            <td align="right">
              <div style="color:#94a3b8;font-size:11px;">Linton Business Solutions LLC</div>
              <div style="color:#94a3b8;font-size:11px;">JPMorgan Chase Building, Houston, Texas</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:24px 36px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
          <strong style="color:#0d1b35;">${BUSINESS_NAME}</strong><br />
          ${BUSINESS_ADDRESS}<br />
          ${LBS_PHONE} &nbsp;|&nbsp; <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a><br />
          Mon-Fri 8 AM-5 PM &nbsp;|&nbsp; Sat 8 AM-4 PM
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// Extracts "Exam: <name>" from the notes field and returns { exam, remainingNotes }
function parseExamFromNotes(notes?: string): { exam: string | null; remainingNotes: string | null } {
  if (!notes) return { exam: null, remainingNotes: null };
  const match = notes.match(/^Exam: (.+?)(?:\n\n|$)([\s\S]*)?/);
  if (match) {
    return {
      exam: match[1].trim(),
      remainingNotes: match[2]?.trim() || null,
    };
  }
  return { exam: null, remainingNotes: notes };
}

// Extracts "Duration: X hours" from notes and returns duration in minutes
function parseDurationFromNotes(notes?: string): number {
  if (!notes) return 60;
  const match = notes.match(/Duration: (\d+) hours/);
  return match ? parseInt(match[1], 10) * 60 : 60;
}

// Generate ICS calendar file content
function generateICSContent(data: {
  appointmentId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  appointmentDate: Date;
  durationMinutes?: number;
  notes?: string;
}): string {
  const startDate = new Date(data.appointmentDate);
  const endDate = new Date(startDate.getTime() + (data.durationMinutes || 60) * 60 * 1000);

  // Format date as YYYYMMDDTHHMMSS
  const formatICSDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = `${data.appointmentId}@lbs-test-center.onrender.com`;
  const now = formatICSDate(new Date());
  const start = formatICSDate(startDate);
  const end = formatICSDate(endDate);

  const description = `Service: ${escapeICS(data.serviceName)}\\nCustomer: ${escapeICS(data.customerName)}\\nEmail: ${escapeICS(data.customerEmail)}${data.customerPhone ? `\\nPhone: ${escapeICS(data.customerPhone)}` : ''}${data.notes ? `\\nNotes: ${escapeICS(data.notes)}` : ''}`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LBS Test & Exam Center//Appointment//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(data.serviceName)} - ${escapeICS(data.customerName)}
DESCRIPTION:${description}
LOCATION:${BUSINESS_ADDRESS}
ORGANIZER;CN=${BUSINESS_NAME}:mailto:${NOTIFICATION_EMAIL}
ATTENDEE;CN=${escapeICS(data.customerName)};RSVP=TRUE:mailto:${escapeICS(data.customerEmail)}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

export async function sendContactAcknowledgement(data: {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
}) {
  try {
    const serviceRow = data.service
      ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;width:40%;">Service:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(data.service)}</td></tr>`
      : '';
    const phoneRow = data.phone
      ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Phone:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(data.phone)}</td></tr>`
      : '';

    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">We received your message</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${escapeHtml(data.name)}, thank you for reaching out. A member of our team will get back to you within one business day.</p>

      <div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #1e3a6e;">
        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Your Submission</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;width:40%;">Name:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Email:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(data.email)}</td></tr>
          ${phoneRow}
          ${serviceRow}
        </table>
        <div style="margin-top:14px;padding:14px 16px;background:#ffffff;border-radius:6px;border:1px solid #e2e8f0;">
          <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Message</div>
          <p style="margin:0;color:#374151;font-size:14px;white-space:pre-wrap;line-height:1.6;">${escapeHtml(data.message)}</p>
        </div>
      </div>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">Need to reach us sooner?</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Call us at <a href="tel:${LBS_PHONE}" style="color:#1e3a6e;font-weight:600;">${LBS_PHONE}</a> or
          email <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a>.<br />
          Mon–Fri 8 AM–5 PM &nbsp;|&nbsp; Sat 8 AM–4 PM CT
        </p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: `We received your message: ${BUSINESS_NAME}`,
      html: emailWrapper(content),
    });
    console.log('Contact acknowledgement email sent to', data.email);
  } catch (error: any) {
    console.error('Failed to send contact acknowledgement email:', error.message);
  }
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
}) {
  try {
    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Contact Form Submission from ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Contact Submission</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 120px;">Name:</td>
                <td style="padding: 8px 12px;">${escapeHtml(data.name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Email:</td>
                <td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
              </tr>
              ${data.phone ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Phone:</td><td style="padding: 8px 12px;">${escapeHtml(data.phone)}</td></tr>` : ''}
              ${data.service ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Service:</td><td style="padding: 8px 12px;">${escapeHtml(data.service)}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 16px; background-color: white; border: 1px solid #e5e7eb; border-radius: 6px;">
              <p style="font-weight: bold; color: #1e3a6e; margin: 0 0 8px 0;">Message:</p>
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Contact notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send contact notification email:', error.message);
  }
}

export async function sendPrivacyRequestNotification(data: {
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  service: string;
  requestType: string;
  identifier?: string | null;
  description: string;
  preferredResponseMethod?: string | null;
  onBehalfOfAnother: boolean;
}) {
  try {
    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Privacy Request from ${data.name} (${data.requestType})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Privacy Request</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 160px;">Name:</td><td style="padding: 8px 12px;">${escapeHtml(data.name)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Email:</td><td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
              ${data.phone ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Phone:</td><td style="padding: 8px 12px;">${escapeHtml(data.phone)}</td></tr>` : ''}
              ${data.organization ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Organization:</td><td style="padding: 8px 12px;">${escapeHtml(data.organization)}</td></tr>` : ''}
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Website/Service:</td><td style="padding: 8px 12px;">${escapeHtml(data.service)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Request Type:</td><td style="padding: 8px 12px;">${escapeHtml(data.requestType)}</td></tr>
              ${data.identifier ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Account/Order ID:</td><td style="padding: 8px 12px;">${escapeHtml(data.identifier)}</td></tr>` : ''}
              ${data.preferredResponseMethod ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Preferred Response:</td><td style="padding: 8px 12px;">${escapeHtml(data.preferredResponseMethod)}</td></tr>` : ''}
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">On behalf of another person:</td><td style="padding: 8px 12px;">${data.onBehalfOfAnother ? 'Yes' : 'No'}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background-color: white; border: 1px solid #e5e7eb; border-radius: 6px;">
              <p style="font-weight: bold; color: #1e3a6e; margin: 0 0 8px 0;">Description of Request:</p>
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.description)}</p>
            </div>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Privacy request notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send privacy request notification email:', error.message);
  }
}

export async function sendPrivacyRequestAcknowledgement(data: {
  name: string;
  email: string;
  requestType: string;
}) {
  try {
    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">We received your privacy request</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${escapeHtml(data.name)}, we received your ${escapeHtml(data.requestType)} request and have recorded the date received. We may contact you to verify your identity before acting on the request.</p>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">What happens next?</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Where the Texas Data Privacy and Security Act applies, we generally respond without undue delay and
          within 45 days, subject to permitted extensions. Questions in the meantime? Call
          <a href="tel:${LBS_PHONE}" style="color:#1e3a6e;font-weight:600;">${LBS_PHONE}</a> or
          email <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a>.
        </p>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: `We received your privacy request: ${BUSINESS_NAME}`,
      html: emailWrapper(content),
    });
    console.log('Privacy request acknowledgement email sent to', data.email);
  } catch (error: any) {
    console.error('Failed to send privacy request acknowledgement email:', error.message);
  }
}

export async function sendEmployerConsultationNotification(data: {
  contactName: string;
  companyName: string;
  businessEmail: string;
  businessPhone: string;
  companyAddress: string;
  industry: string;
  employeeCount: string;
  newHiresPerMonth: string;
  hiringLocations: string;
  desiredService: string;
  preferredConsultationMethod: string;
  message?: string | null;
}) {
  try {
    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Employer Consultation Request: ${data.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Employer Consultation Request</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #c9a84c;">New-Hire Verification &amp; Form I-9 Support</p>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 180px;">Contact Name:</td><td style="padding: 8px 12px;">${escapeHtml(data.contactName)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Company:</td><td style="padding: 8px 12px;">${escapeHtml(data.companyName)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Business Email:</td><td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(data.businessEmail)}">${escapeHtml(data.businessEmail)}</a></td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Business Phone:</td><td style="padding: 8px 12px;">${escapeHtml(data.businessPhone)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Company Address:</td><td style="padding: 8px 12px;">${escapeHtml(data.companyAddress)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Industry:</td><td style="padding: 8px 12px;">${escapeHtml(data.industry)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Approx. Employees:</td><td style="padding: 8px 12px;">${escapeHtml(data.employeeCount)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Approx. New Hires/Month:</td><td style="padding: 8px 12px;">${escapeHtml(data.newHiresPerMonth)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Hiring Locations:</td><td style="padding: 8px 12px;">${escapeHtml(data.hiringLocations)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Desired Service:</td><td style="padding: 8px 12px;">${escapeHtml(data.desiredService)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Preferred Contact Method:</td><td style="padding: 8px 12px;">${escapeHtml(data.preferredConsultationMethod)}</td></tr>
            </table>
            ${data.message ? `<div style="margin-top: 16px; padding: 16px; background-color: white; border: 1px solid #e5e7eb; border-radius: 6px;">
              <p style="font-weight: bold; color: #1e3a6e; margin: 0 0 8px 0;">Message:</p>
              <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
            </div>` : ''}
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
              <p style="margin: 0; color: #92400e; font-size: 12px;">Reminder: this is an administrative sales lead only. No employee Form I-9, SSN, or identity-document data should ever come through this form — if any appears, do not act on it and contact the requester to resubmit safely.</p>
            </div>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Employer consultation notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send employer consultation notification email:', error.message);
  }
}

export async function sendEmployerConsultationAcknowledgement(data: {
  contactName: string;
  companyName: string;
  businessEmail: string;
  desiredService: string;
}) {
  try {
    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">We received your consultation request</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${escapeHtml(data.contactName)}, thank you for your interest in LBS New-Hire Verification &amp; Form I-9 Support for ${escapeHtml(data.companyName)}. A member of our employer-services team will follow up within one business day to discuss ${escapeHtml(data.desiredService.toLowerCase())}.</p>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">A quick reminder</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Submitting this form does not enroll your company in E-Verify or establish a client relationship. LBS is
          enrolled as an E-Verify Employer Agent and provides E-Verify case-management and Form I-9 administrative
          support for participating employers. Please do not reply to this email with employee Form I-9 information,
          Social Security numbers, identity documents, or other sensitive employee data.
        </p>
      </div>

      <div style="background:#f0f4ff;border-radius:8px;padding:18px 20px;border-left:4px solid #1e3a6e;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">Need to reach us sooner?</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Call us at <a href="tel:${LBS_PHONE}" style="color:#1e3a6e;font-weight:600;">${LBS_PHONE}</a> or
          email <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a>.<br />
          Mon–Fri 8 AM–5 PM &nbsp;|&nbsp; Sat 8 AM–4 PM CT
        </p>
      </div>
    `;

    await sendEmail({
      to: data.businessEmail,
      subject: `We received your employer consultation request: ${BUSINESS_NAME}`,
      html: emailWrapper(content),
    });
    console.log('Employer consultation acknowledgement email sent to', data.businessEmail);
  } catch (error: any) {
    console.error('Failed to send employer consultation acknowledgement email:', error.message);
  }
}

export async function sendEmployerIntakeNotification(data: {
  companyLegalName: string;
  dba?: string | null;
  ein?: string | null;
  companyAddress: string;
  mailingAddress?: string | null;
  hiringLocations: string;
  industry: string;
  naicsCategory?: string | null;
  employeeCount: string;
  averageMonthlyHires: string;
  federalContractorStatus: string;
  authorizedSignerName: string;
  authorizedSignerEmail: string;
  primaryAdministratorName: string;
  primaryAdministratorEmail: string;
  billingContactName: string;
  billingContactEmail: string;
  selectedPlan: string;
  requestedAddOns?: string[];
  preferredStartDate?: string | null;
}) {
  try {
    const addOnsRow = data.requestedAddOns && data.requestedAddOns.length > 0
      ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Requested Add-Ons:</td><td style="padding: 8px 12px;">${escapeHtml(data.requestedAddOns.join(', '))}</td></tr>`
      : '';
    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Employer Client Intake: ${data.companyLegalName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Employer Client Intake</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #c9a84c;">New-Hire Verification &amp; Form I-9 Support — Onboarding</p>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 200px;">Company Legal Name:</td><td style="padding: 8px 12px;">${escapeHtml(data.companyLegalName)}</td></tr>
              ${data.dba ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">DBA:</td><td style="padding: 8px 12px;">${escapeHtml(data.dba)}</td></tr>` : ''}
              ${data.ein ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">EIN:</td><td style="padding: 8px 12px;">${escapeHtml(data.ein)}</td></tr>` : ''}
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Company Address:</td><td style="padding: 8px 12px;">${escapeHtml(data.companyAddress)}</td></tr>
              ${data.mailingAddress ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Mailing Address:</td><td style="padding: 8px 12px;">${escapeHtml(data.mailingAddress)}</td></tr>` : ''}
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Hiring Locations:</td><td style="padding: 8px 12px;">${escapeHtml(data.hiringLocations)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Industry:</td><td style="padding: 8px 12px;">${escapeHtml(data.industry)}</td></tr>
              ${data.naicsCategory ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">NAICS Category:</td><td style="padding: 8px 12px;">${escapeHtml(data.naicsCategory)}</td></tr>` : ''}
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Employee Count:</td><td style="padding: 8px 12px;">${escapeHtml(data.employeeCount)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Average Monthly Hires:</td><td style="padding: 8px 12px;">${escapeHtml(data.averageMonthlyHires)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Federal Contractor Status:</td><td style="padding: 8px 12px;">${escapeHtml(data.federalContractorStatus)}</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Authorized Signer:</td><td style="padding: 8px 12px;">${escapeHtml(data.authorizedSignerName)} (<a href="mailto:${escapeHtml(data.authorizedSignerEmail)}">${escapeHtml(data.authorizedSignerEmail)}</a>)</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Primary Administrator:</td><td style="padding: 8px 12px;">${escapeHtml(data.primaryAdministratorName)} (<a href="mailto:${escapeHtml(data.primaryAdministratorEmail)}">${escapeHtml(data.primaryAdministratorEmail)}</a>)</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Billing Contact:</td><td style="padding: 8px 12px;">${escapeHtml(data.billingContactName)} (<a href="mailto:${escapeHtml(data.billingContactEmail)}">${escapeHtml(data.billingContactEmail)}</a>)</td></tr>
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Selected Plan:</td><td style="padding: 8px 12px;">${escapeHtml(data.selectedPlan)}</td></tr>
              ${addOnsRow}
              ${data.preferredStartDate ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Preferred Start Date:</td><td style="padding: 8px 12px;">${escapeHtml(data.preferredStartDate)}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
              <p style="margin: 0; color: #92400e; font-size: 12px;">This is business-level onboarding information only. No employee Form I-9 data, SSNs, or identity documents are collected through this form. Next steps: E-Verify Memorandum of Understanding and signed LBS service agreement.</p>
            </div>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Employer intake notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send employer intake notification email:', error.message);
  }
}

export async function sendEmployerIntakeAcknowledgement(data: {
  companyLegalName: string;
  primaryAdministratorName: string;
  primaryAdministratorEmail: string;
}) {
  try {
    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">We received your onboarding information</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hi ${escapeHtml(data.primaryAdministratorName)}, thank you for submitting onboarding information for ${escapeHtml(data.companyLegalName)}. Our employer-services team will review it and follow up about next steps, including the E-Verify Memorandum of Understanding and the LBS service agreement.</p>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">A quick reminder</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          This submission does not enroll your company in E-Verify or create a binding agreement. Please do not
          reply to this email with employee Form I-9 information, Social Security numbers, identity documents, or
          other sensitive employee data.
        </p>
      </div>

      <div style="background:#f0f4ff;border-radius:8px;padding:18px 20px;border-left:4px solid #1e3a6e;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">Need to reach us sooner?</p>
        <p style="margin:0;color:#374151;font-size:14px;">
          Call us at <a href="tel:${LBS_PHONE}" style="color:#1e3a6e;font-weight:600;">${LBS_PHONE}</a> or
          email <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a>.<br />
          Mon–Fri 8 AM–5 PM &nbsp;|&nbsp; Sat 8 AM–4 PM CT
        </p>
      </div>
    `;

    await sendEmail({
      to: data.primaryAdministratorEmail,
      subject: `We received your onboarding information: ${BUSINESS_NAME}`,
      html: emailWrapper(content),
    });
    console.log('Employer intake acknowledgement email sent to', data.primaryAdministratorEmail);
  } catch (error: any) {
    console.error('Failed to send employer intake acknowledgement email:', error.message);
  }
}

export async function sendPaymentNotification(data: {
  customerEmail?: string;
  customerName?: string;
  amount: number;
  currency: string;
  productName?: string;
  sessionId: string;
}) {
  try {
    const formattedAmount = `$${(data.amount / 100).toFixed(2)}`;
    const serviceName = data.productName || 'Service';

    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `A ${serviceName} has been purchased`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e3a6e; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">LBS - New Purchase</h1>
          </div>
          <div style="padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">${formattedAmount}</p>
              <p style="margin: 4px 0 0 0; color: #047857;">Payment Successful</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e; width: 140px;">Service:</td><td style="padding: 8px 12px;">${escapeHtml(serviceName)}</td></tr>
              ${data.customerName ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Name:</td><td style="padding: 8px 12px;">${escapeHtml(data.customerName)}</td></tr>` : ''}
              ${data.customerEmail ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Customer Email:</td><td style="padding: 8px 12px;"><a href="mailto:${escapeHtml(data.customerEmail)}">${escapeHtml(data.customerEmail)}</a></td></tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Amount:</td>
                <td style="padding: 8px 12px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #1e3a6e;">Session ID:</td>
                <td style="padding: 8px 12px; font-size: 12px; color: #6b7280;">${data.sessionId}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px;">
            LBS Test &amp; Exam Center | ${BUSINESS_ADDRESS}
          </div>
        </div>
      `,
    });
    console.log('Payment notification email sent to', NOTIFICATION_EMAIL);
  } catch (error: any) {
    console.error('Failed to send payment notification email:', error.message);
  }
}

// Send appointment confirmation to customer
export async function sendAppointmentConfirmation(data: {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  appointmentDate: Date;
  priceAmount?: number;
  paymentStatus: string;
  notes?: string;
}) {
  try {
    const { exam } = parseExamFromNotes(data.notes);
    const durationMins = parseDurationFromNotes(data.notes);
    const durationDisplay = durationMins > 60 ? `${durationMins / 60} hours` : null;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });

    const isNotaryService = data.serviceName.toLowerCase().includes('notary');
    const priceDisplay = data.priceAmount ? `$${(data.priceAmount / 100).toFixed(2)}` : 'To be determined';
    const paymentBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">Pay at Visit</span>';

    const content = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">Appointment Confirmed</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Hello ${escapeHtml(data.customerName)}, your appointment has been confirmed. Please see the details below.</p>

      <div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #1e3a6e;">
        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Appointment Details</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;width:40%;">Service:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(data.serviceName)}</td></tr>
          ${exam ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Exam:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${escapeHtml(exam)}</td></tr>` : ''}
          ${durationDisplay ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Duration:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${durationDisplay}</td></tr>` : ''}
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Date:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${formattedDate}</td></tr>
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Time:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${formattedTime} CT</td></tr>
          ${!isNotaryService ? `<tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Price:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${priceDisplay}</td></tr>` : ''}
          <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Payment:</td><td style="font-size:14px;padding:4px 0;">${paymentBadge}</td></tr>
        </table>
      </div>

      <div style="background:#f8fafc;border-radius:8px;padding:18px 20px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <p style="margin:0 0 4px;color:#0d1b35;font-size:14px;font-weight:600;">Location</p>
        <p style="margin:0;color:#374151;font-size:14px;">${BUSINESS_NAME}<br />${BUSINESS_ADDRESS}</p>
      </div>

      <p style="margin:0;color:#64748b;font-size:13px;">
        To reschedule or cancel, contact us at <a href="mailto:${NOTIFICATION_EMAIL}" style="color:#1e3a6e;">${NOTIFICATION_EMAIL}</a> or call ${LBS_PHONE}.
      </p>
    `;

    await sendEmail({
      to: data.customerEmail,
      subject: `Appointment Confirmed: ${data.serviceName} at LBS Test & Exam Center`,
      html: emailWrapper(content),
    });
    console.log('Appointment confirmation email sent to', data.customerEmail);
  } catch (error: any) {
    console.error('Failed to send appointment confirmation email:', error.message);
  }
}

// Send calendar invite to business email
export async function sendAppointmentCalendarInvite(data: {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  serviceName: string;
  appointmentDate: Date;
  priceAmount?: number;
  paymentStatus: string;
  notes?: string;
}) {
  try {
    const { exam, remainingNotes } = parseExamFromNotes(data.notes);
    const durationMins = parseDurationFromNotes(data.notes);
    const durationDisplay = durationMins > 60 ? `${durationMins / 60} hours` : null;
    const appointmentDateTime = new Date(data.appointmentDate);
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago',
    });

    const isNotaryService = data.serviceName.toLowerCase().includes('notary');
    const priceDisplay = data.priceAmount ? `$${(data.priceAmount / 100).toFixed(2)}` : 'To be determined';
    const paymentBadge = data.paymentStatus === 'paid'
      ? '<span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 12px;">PAID</span>'
      : '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px;">UNPAID</span>';

    // Generate ICS content
    const icsContent = generateICSContent({
      appointmentId: data.appointmentId,
      serviceName: data.serviceName,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      appointmentDate: data.appointmentDate,
      durationMinutes: parseDurationFromNotes(data.notes),
      notes: data.notes,
    });

    const startISO = appointmentDateTime.toISOString();
    const endISO = new Date(appointmentDateTime.getTime() + durationMins * 60 * 1000).toISOString();

    const adminContent = `
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">New Appointment Booked</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A new appointment has been scheduled. Open the attached .ics file to add it to your calendar.</p>

      <div style="background:#fff7ed;border-radius:8px;padding:20px 24px;margin-bottom:20px;border-left:4px solid #c9a84c;">
        <div style="color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">Appointment Summary</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;width:40%;">Service:</td><td style="font-size:14px;padding:4px 0;font-weight:700;color:#0d1b35;">${escapeHtml(data.serviceName)}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Customer:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${escapeHtml(data.customerName)}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Email:</td><td style="font-size:14px;padding:4px 0;"><a href="mailto:${escapeHtml(data.customerEmail)}" style="color:#1e3a6e;">${escapeHtml(data.customerEmail)}</a></td></tr>
          ${data.customerPhone ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Phone:</td><td style="font-size:14px;padding:4px 0;"><a href="tel:${escapeHtml(data.customerPhone)}" style="color:#1e3a6e;">${escapeHtml(data.customerPhone)}</a></td></tr>` : ''}
          ${exam ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Exam:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${escapeHtml(exam)}</td></tr>` : ''}
          ${durationDisplay ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Duration:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${durationDisplay}</td></tr>` : ''}
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Date:</td><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">${formattedDate}</td></tr>
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Time:</td><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">${formattedTime} CT</td></tr>
          ${!isNotaryService ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Price:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${priceDisplay}</td></tr>` : ''}
          <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Payment:</td><td style="font-size:14px;padding:4px 0;">${paymentBadge}</td></tr>
          ${remainingNotes ? `<tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Notes:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${escapeHtml(remainingNotes)}</td></tr>` : ''}
        </table>
      </div>
      <span style="display:none;overflow:hidden;max-height:0">APPTSTART:${startISO}|APPTEND:${endISO}|APPTSERVICE:${data.serviceName}|APPTCUSTOMER:${data.customerName}</span>
    `;

    await sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: `New Appointment: ${data.serviceName} - ${data.customerName} on ${formattedDate}`,
      html: emailWrapper(adminContent),
      attachments: [
        {
          filename: `appointment-${data.appointmentId}.ics`,
          content: icsContent,
          contentType: 'text/calendar',
        },
      ],
    });
    console.log('Calendar invite email sent to', NOTIFICATION_EMAIL);

    // Create the event directly on the Outlook calendar (requires Calendars.ReadWrite on the Azure AD app)
    createOutlookCalendarEvent({
      subject: `${data.serviceName}: ${data.customerName}`,
      bodyHtml: `
        <p><strong>Service:</strong> ${escapeHtml(data.serviceName)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(data.customerName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.customerEmail)}</p>
        ${data.customerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(data.customerPhone)}</p>` : ''}
        ${exam ? `<p><strong>Exam:</strong> ${escapeHtml(exam)}</p>` : ''}
        ${remainingNotes ? `<p><strong>Notes:</strong> ${escapeHtml(remainingNotes)}</p>` : ''}
        <p><strong>Payment:</strong> ${data.paymentStatus === 'paid' ? 'Paid Online' : 'Pay at Visit'}</p>
      `,
      startDateTime: appointmentDateTime,
      durationMinutes: durationMins,
      attendeeEmail: data.customerEmail,
      attendeeName: data.customerName,
    });
  } catch (error: any) {
    console.error('Failed to send calendar invite email:', error.message);
  }
}

