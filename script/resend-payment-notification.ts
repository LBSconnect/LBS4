// One-off tool to manually resend the business notification email(s) for a
// specific Stripe Checkout Session, for purchases missed due to a webhook
// or delivery issue.
//
// Mirrors WebhookHandlers.handleCheckoutCompleted's branching:
// - Session has metadata.appointment_id -> resend the appointment-based
//   emails (sendAppointmentConfirmation to the customer, sendAppointmentCalendarInvite
//   to the business with Full Name/Email/Phone/Exam/appointment time).
// - No appointment_id -> resend the generic "New Purchase" business email.
//
// Usage (run on the server, with production env vars loaded):
//   tsx script/resend-payment-notification.ts <checkout_session_id>
//
// Example:
//   tsx script/resend-payment-notification.ts cs_live_a1zMF569Fxsm39XEcLPgb6b9zaKfo2CpgvfnJTtQ0hTcS30Jb2gqUuR1ZJ

import { getUncachableStripeClient } from '../server/stripeClient';
import { storage } from '../server/storage';
import { sendAppointmentConfirmation, sendAppointmentCalendarInvite, sendPaymentNotification } from '../server/emailService';

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Usage: tsx script/resend-payment-notification.ts <checkout_session_id>');
    process.exit(1);
  }

  const stripe = await getUncachableStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    console.error(`Refusing to send: session ${sessionId} has payment_status="${session.payment_status}", not "paid".`);
    process.exit(1);
  }

  const appointmentId = session.metadata?.appointment_id;

  if (appointmentId) {
    const appointment = await storage.getAppointment(appointmentId);
    if (!appointment) {
      console.error(`Appointment not found for ID: ${appointmentId}`);
      process.exit(1);
    }

    await sendAppointmentConfirmation({
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      serviceName: appointment.serviceName,
      appointmentDate: appointment.appointmentDate,
      priceAmount: appointment.priceAmount ?? undefined,
      paymentStatus: 'paid',
    });

    await sendAppointmentCalendarInvite({
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone ?? undefined,
      serviceName: appointment.serviceName,
      appointmentDate: appointment.appointmentDate,
      priceAmount: appointment.priceAmount ?? undefined,
      paymentStatus: 'paid',
      notes: appointment.notes ?? undefined,
    });

    console.log(`Done. Appointment confirmation and calendar invite resent for appointment ${appointment.id} (session ${sessionId}).`);
    return;
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
  const productName = lineItems.data[0]?.description || undefined;

  await sendPaymentNotification({
    customerEmail: session.customer_details?.email || undefined,
    customerName: session.customer_details?.name || undefined,
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    productName,
    sessionId: session.id,
  });

  console.log(`Done. Purchase notification resent for session ${sessionId}.`);
}

main().catch((error) => {
  console.error('Failed to resend payment notification:', error.message);
  process.exit(1);
});
