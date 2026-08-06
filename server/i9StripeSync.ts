// ─────────────────────────────────────────────────────────────────────────────
// Syncs the DB-driven I-9 service plan / add-on catalog to Stripe Products
// and Prices, mirroring the pattern server/seedProducts.ts already uses for
// the main site's fixed-price services — but writing the resulting Stripe
// IDs back onto the i9_service_plans / i9_add_ons rows (seedProducts.ts
// doesn't need to, since its callers look products up by name; the I-9
// checkout flow needs the actual price ID to build a Checkout Session).
//
// Idempotent: safe to call on every server boot. Only runs when
// STRIPE_SECRET_KEY is configured — call site (server/i9Routes.ts) already
// guards on that.
//
// Add-ons with priceUnit "flat" get a single flat one-time Stripe price, same
// as before. Add-ons with a real per-unit priceUnit (per_case / per_employee
// / per_form) get true Stripe metered billing instead: a Billing Meter plus
// a recurring metered Price referencing it. The meter aggregates usage
// events reported under a deterministic event_name (`i9-addon-usage-<slug>`)
// — see attachI9AddOnRoute / reportI9AddOnUsage in i9Routes.ts for where
// those events actually get sent. Nothing in the case workflow reports usage
// automatically; it's always an explicit LBS-staff action, since the exact
// moment "1 unit" of a given add-on is consumed is a billing judgment call
// LBS makes, not something inferable from case-status transitions.
// ─────────────────────────────────────────────────────────────────────────────

import { getUncachableStripeClient } from "./stripeClient";
import * as store from "./i9Storage";

export async function syncI9StripeProducts(): Promise<void> {
  const stripe = await getUncachableStripeClient();

  const plans = await store.listI9ServicePlans();
  for (const plan of plans) {
    try {
      let productId = plan.stripeProductId;
      if (!productId) {
        const existing = await stripe.products.search({ query: `name:'LBS I-9 Plan: ${plan.name}'` });
        productId = existing.data[0]?.id ?? (await stripe.products.create({
          name: `LBS I-9 Plan: ${plan.name}`,
          description: `New-Hire Verification & Form I-9 Support — ${plan.name} plan (${plan.includedCasesPerMonth} cases/month included).`,
          metadata: { app: "lbs4", i9ServicePlanId: plan.id },
        })).id;
      }

      let monthlyPriceId = plan.stripeMonthlyPriceId;
      if (!monthlyPriceId) {
        const prices = await stripe.prices.list({ product: productId, active: true });
        const match = prices.data.find((p) => p.unit_amount === plan.monthlyPriceCents && p.recurring?.interval === "month");
        monthlyPriceId = match?.id ?? (await stripe.prices.create({
          product: productId,
          unit_amount: plan.monthlyPriceCents,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { app: "lbs4", i9ServicePlanId: plan.id, kind: "monthly" },
        })).id;
      }

      let setupPriceId = plan.stripeSetupPriceId;
      if (!setupPriceId && plan.setupFeeCents > 0) {
        const prices = await stripe.prices.list({ product: productId, active: true });
        const match = prices.data.find((p) => p.unit_amount === plan.setupFeeCents && !p.recurring);
        setupPriceId = match?.id ?? (await stripe.prices.create({
          product: productId,
          unit_amount: plan.setupFeeCents,
          currency: "usd",
          metadata: { app: "lbs4", i9ServicePlanId: plan.id, kind: "setup_fee" },
        })).id;
      }

      if (productId !== plan.stripeProductId || monthlyPriceId !== plan.stripeMonthlyPriceId || setupPriceId !== plan.stripeSetupPriceId) {
        await store.setI9ServicePlanStripeIds(plan.id, {
          stripeProductId: productId,
          stripeMonthlyPriceId: monthlyPriceId ?? undefined,
          stripeSetupPriceId: setupPriceId ?? undefined,
        });
      }
    } catch (err: any) {
      console.error(`[i9-stripe-sync] Failed to sync plan "${plan.name}":`, err.message);
    }
  }

  const addOns = await store.listI9AddOns();
  for (const addOn of addOns) {
    try {
      if (addOn.stripeProductId && addOn.stripePriceId && (addOn.priceUnit === "flat" || addOn.stripeMeterId)) continue;
      let productId = addOn.stripeProductId;
      if (!productId) {
        const existing = await stripe.products.search({ query: `name:'LBS I-9 Add-on: ${addOn.name}'` });
        productId = existing.data[0]?.id ?? (await stripe.products.create({
          name: `LBS I-9 Add-on: ${addOn.name}`,
          description: `New-Hire Verification & Form I-9 Support add-on service (${addOn.priceUnit}).`,
          metadata: { app: "lbs4", i9AddOnId: addOn.id },
        })).id;
      }

      if (addOn.priceUnit === "flat") {
        let priceId = addOn.stripePriceId;
        if (!priceId) {
          const prices = await stripe.prices.list({ product: productId, active: true });
          const match = prices.data.find((p) => p.unit_amount === addOn.startingPriceCents && !p.recurring);
          priceId = match?.id ?? (await stripe.prices.create({
            product: productId,
            unit_amount: addOn.startingPriceCents,
            currency: "usd",
            metadata: { app: "lbs4", i9AddOnId: addOn.id },
          })).id;
        }
        if (productId !== addOn.stripeProductId || priceId !== addOn.stripePriceId) {
          await store.setI9AddOnStripeIds(addOn.id, { stripeProductId: productId, stripePriceId: priceId });
        }
        continue;
      }

      // Metered add-on: find-or-create the Billing Meter, then a metered
      // recurring price referencing it.
      const eventName = `i9-addon-usage-${addOn.slug}`;
      let meterId = addOn.stripeMeterId;
      if (!meterId) {
        const meters = await stripe.billing.meters.list({ status: "active" });
        const existingMeter = meters.data.find((m) => m.event_name === eventName);
        meterId = existingMeter?.id ?? (await stripe.billing.meters.create({
          display_name: `LBS I-9 Add-on Usage: ${addOn.name}`,
          event_name: eventName,
          default_aggregation: { formula: "sum" },
        })).id;
      }

      // Only trust the stored stripePriceId here if it was already paired
      // with a meter — an add-on synced before metered billing existed may
      // have a stale flat one-time price ID left over from that older
      // logic, which must NOT be reused as if it were the metered price.
      let priceId = addOn.stripeMeterId ? addOn.stripePriceId : null;
      if (!priceId) {
        const prices = await stripe.prices.list({ product: productId, active: true });
        const match = prices.data.find((p) => p.recurring?.meter === meterId);
        priceId = match?.id ?? (await stripe.prices.create({
          product: productId,
          unit_amount: addOn.startingPriceCents,
          currency: "usd",
          recurring: { interval: "month", usage_type: "metered", meter: meterId },
          metadata: { app: "lbs4", i9AddOnId: addOn.id, priceUnit: addOn.priceUnit },
        })).id;
      }

      if (productId !== addOn.stripeProductId || priceId !== addOn.stripePriceId || meterId !== addOn.stripeMeterId) {
        await store.setI9AddOnStripeIds(addOn.id, { stripeProductId: productId, stripePriceId: priceId, stripeMeterId: meterId });
      }
    } catch (err: any) {
      console.error(`[i9-stripe-sync] Failed to sync add-on "${addOn.name}":`, err.message);
    }
  }

  console.log("[i9-stripe-sync] I-9 catalog synced to Stripe.");
}
