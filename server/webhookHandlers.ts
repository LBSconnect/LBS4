import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendAppointmentConfirmation, sendAppointmentCalendarInvite, sendPaymentNotification } from './emailService';
import { updateCorporateAccountStripe, getCorporateAccount, logAudit } from './corporateStorage';
import { sendActivationEmail } from './corporateEmailService';
import { activateI9Subscription, getI9Subscription, logI9Audit } from './i9Storage';
import type Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    let event: Stripe.Event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      // Verify signature when secret is configured
      const stripe = await getUncachableStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      console.log(`Webhook verified: ${event.type} - ${event.id}`);
    } else {
      // Process without verification (not recommended for production)
      console.warn('STRIPE_WEBHOOK_SECRET not set — processing without signature verification');
      event = JSON.parse(payload.toString()) as Stripe.Event;
      console.log(`Webhook received (unverified): ${event.type} - ${event.id}`);
    }

    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout.session.completed — update appointment and send paid confirmation
   */
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Processing checkout.session.completed for session:', session.id);

    // This Stripe account is shared across multiple sites/apps, all of which can
    // register their own webhook endpoint but still receive every event fired
    // on the account. Only act on sessions this app itself created.
    if (session.metadata?.app !== 'lbs4') {
      console.log(`Ignoring checkout.session.completed for session ${session.id} — not an lbs4 session`);
      return;
    }

    // Corporate Notary Division: activate the account's subscription
    const corporateAccountId = parseInt(session.client_reference_id || session.metadata?.corporateAccountId || '', 10);
    if (!isNaN(corporateAccountId)) {
      try {
        // Idempotency guard — Stripe redelivers webhooks (at-least-once
        // delivery), and without this a replayed event would resend the
        // customer's activation email and duplicate the audit log entry
        // every time. Read current state first; skip all side-effects once
        // the account is already active, mirroring the appointment-payment
        // guard above.
        const existingAccount = await getCorporateAccount(corporateAccountId);
        if (!existingAccount) {
          console.error('Corporate account not found for ID:', corporateAccountId);
          return;
        }
        if (existingAccount.status === 'active') {
          console.log(`Corporate account ${corporateAccountId} already active — ignoring duplicate webhook (session ${session.id})`);
          return;
        }

        await updateCorporateAccountStripe(
          corporateAccountId,
          session.customer as string,
          session.subscription as string
        );
        await logAudit('account', String(corporateAccountId), 'subscription_activated', 'stripe', {
          stripeCustomer: session.customer,
          stripeSubscription: session.subscription,
        });
        const activated = await getCorporateAccount(corporateAccountId);
        if (activated) sendActivationEmail(activated).catch(console.error);
      } catch (error: any) {
        console.error('Error activating corporate account for session:', session.id, error.message);
      }
      return;
    }

    // New-Hire Verification / I-9 portal: activate the pending subscription
    // created when checkout started (server/i9Routes.ts's checkout route).
    const i9SubscriptionId = session.metadata?.i9SubscriptionId;
    if (i9SubscriptionId) {
      try {
        // Idempotency guard — same rationale as the corporate-account branch
        // above: a replayed checkout.session.completed must not re-run
        // activation (duplicate audit log entries, and — if this handler is
        // ever extended to email the client on activation — duplicate emails).
        const existingSubscription = await getI9Subscription(i9SubscriptionId);
        if (!existingSubscription) {
          console.error('I-9 subscription not found for ID:', i9SubscriptionId);
          return;
        }
        if (existingSubscription.status === 'active') {
          console.log(`I-9 subscription ${i9SubscriptionId} already active — ignoring duplicate webhook (session ${session.id})`);
          return;
        }

        await activateI9Subscription(i9SubscriptionId, {
          stripeCustomerId: (session.customer as string) || '',
          stripeSubscriptionId: (session.subscription as string) || '',
          setupFeePaid: session.metadata?.i9SetupFeeIncluded === 'true',
        });
        await logI9Audit({
          action: 'billing.subscription_activated',
          entityType: 'Subscription',
          entityId: i9SubscriptionId,
          clientCompanyId: session.metadata?.i9ClientCompanyId,
          details: { stripeCustomer: session.customer, stripeSubscription: session.subscription },
        });
      } catch (error: any) {
        console.error('Error activating I-9 subscription for session:', session.id, error.message);
      }
      return;
    }

    // Get appointment_id from session metadata (set during checkout creation)
    const appointmentId = session.metadata?.appointment_id;

    if (!appointmentId) {
      console.log('No appointment_id in session metadata, sending generic purchase notification');
      try {
        const stripe = await getUncachableStripeClient();
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        sendPaymentNotification({
          customerEmail: session.customer_details?.email || undefined,
          customerName: session.customer_details?.name || undefined,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          productName: lineItems.data[0]?.description || undefined,
          sessionId: session.id,
        });
      } catch (error: any) {
        console.error('Error sending purchase notification for session without appointment_id:', error.message);
      }
      return;
    }

    try {
      // Idempotency guard — Stripe may retry the same event multiple times.
      // Read current state first; if already paid, skip all side-effects.
      const existing = await storage.getAppointment(appointmentId);
      if (!existing) {
        console.error('Appointment not found for ID:', appointmentId);
        return;
      }
      if (existing.paymentStatus === 'paid') {
        console.log(`Appointment ${appointmentId} already paid — ignoring duplicate webhook (session ${session.id})`);
        return;
      }

      // Update appointment payment status
      const appointment = await storage.updateAppointmentPayment(appointmentId, 'paid', session.id);

      if (!appointment) {
        console.error('Appointment update returned null for ID:', appointmentId);
        return;
      }

      console.log(`Appointment ${appointmentId} marked as paid`);

      // Send paid confirmation email to customer
      sendAppointmentConfirmation({
        appointmentId: appointment.id,
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        serviceName: appointment.serviceName,
        appointmentDate: appointment.appointmentDate,
        priceAmount: appointment.priceAmount ?? undefined,
        paymentStatus: 'paid',
      });

      // Send full appointment notification with calendar invite to company
      sendAppointmentCalendarInvite({
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

      console.log('Payment confirmation emails queued for customer:', appointment.customerEmail, 'and company');
    } catch (error: any) {
      console.error('Error processing checkout.session.completed:', error.message);
    }
  }

  /**
   * Handle checkout.session.expired — cancel the orphaned appointment so the slot opens back up
   */
  private static async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Processing checkout.session.expired for session:', session.id);

    if (session.metadata?.app !== 'lbs4') {
      console.log(`Ignoring checkout.session.expired for session ${session.id} — not an lbs4 session`);
      return;
    }

    const appointmentId = session.metadata?.appointment_id;
    if (!appointmentId) {
      console.log('No appointment_id in expired session metadata, skipping');
      return;
    }

    try {
      const cancelled = await storage.cancelAppointment(appointmentId);
      if (cancelled) {
        console.log(`Appointment ${appointmentId} cancelled after checkout session expired`);
      } else {
        console.warn(`Appointment ${appointmentId} not found when cancelling expired session`);
      }
    } catch (error: any) {
      console.error('Error cancelling appointment for expired session:', error.message);
    }
  }
}
