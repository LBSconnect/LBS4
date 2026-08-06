import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard } from "lucide-react";
import {
  i9Api,
  I9ApiError,
  isI9ServiceUnavailable,
  formatCents,
  type I9ServicePlan,
  type I9AddOn,
  type I9Subscription,
} from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, ErrorBanner, ServiceGateBanner, useUnauthRedirect, NAVY } from "./_shared";

export function PlanCatalog({ companyId }: { companyId: string }) {
  const onUnauth = useUnauthRedirect();
  const [plans, setPlans] = useState<I9ServicePlan[]>([]);
  const [addOns, setAddOns] = useState<I9AddOn[]>([]);
  const [subscription, setSubscription] = useState<I9Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [gateMissing, setGateMissing] = useState<string[] | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      i9Api<{ plans: I9ServicePlan[]; addOns: I9AddOn[]; configured: boolean }>("/api/i9/catalog"),
      i9Api<{ subscription: I9Subscription | null }>(`/api/i9/companies/${companyId}/subscription`).catch(() => ({ subscription: null })),
    ])
      .then(([catalog, sub]) => {
        if (!active) return;
        setPlans(catalog.plans);
        setAddOns(catalog.addOns);
        setSubscription(sub.subscription);
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

  async function subscribe(planId: string) {
    setCheckingOutPlanId(planId);
    setCheckoutError("");
    try {
      const r = await i9Api<{ checkoutUrl: string }>(`/api/i9/companies/${companyId}/checkout`, {
        method: "POST",
        body: JSON.stringify({ servicePlanId: planId }),
      });
      window.location.href = r.checkoutUrl;
    } catch (err) {
      if (isI9ServiceUnavailable(err) && err instanceof I9ApiError) {
        setGateMissing((err.details as { missing?: string[] } | undefined)?.missing ?? []);
      } else {
        setCheckoutError(err instanceof Error ? err.message : "Failed to start checkout.");
      }
      setCheckingOutPlanId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading billing...</p>;
  if (gateMissing) return <ServiceGateBanner missing={gateMissing} />;

  return (
    <div className="space-y-5">
      {subscription?.status === "active" && (
        <PortalCard>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" /> Active subscription on file{subscription.setupFeePaid ? " — setup fee paid" : ""}.
          </div>
        </PortalCard>
      )}
      {checkoutError && <ErrorBanner message={checkoutError} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PortalCard key={plan.id} title={plan.name}>
            <p className="text-2xl font-bold" style={{ color: NAVY }}>
              {formatCents(plan.monthlyPriceCents)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            {plan.setupFeeCents > 0 && <p className="text-xs text-muted-foreground">+ {formatCents(plan.setupFeeCents)} one-time setup</p>}
            <p className="text-xs text-muted-foreground">
              {plan.includedCasesPerMonth} cases/month included, +{formatCents(plan.additionalCaseCents)}/additional case
            </p>
            <ul className="text-xs space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 mt-0.5 text-green-600 shrink-0" /> {f}</li>
              ))}
            </ul>
            <Button
              size="sm"
              onClick={() => subscribe(plan.id)}
              disabled={checkingOutPlanId === plan.id || subscription?.servicePlanId === plan.id && subscription?.status === "active"}
              className="w-full text-white gap-1.5"
              style={{ backgroundColor: NAVY }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {subscription?.servicePlanId === plan.id && subscription?.status === "active"
                ? "Current Plan"
                : checkingOutPlanId === plan.id ? "Redirecting..." : "Subscribe"}
            </Button>
          </PortalCard>
        ))}
      </div>

      {addOns.length > 0 && (
        <PortalCard title="Add-On Services">
          <ul className="divide-y divide-border/50">
            {addOns.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                <span>{a.name}</span>
                <span className="text-muted-foreground">{formatCents(a.startingPriceCents)} {a.priceUnit.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Add-on services are billed by LBS as they're used — contact your LBS representative to add one.</p>
        </PortalCard>
      )}
    </div>
  );
}

export default function PortalBilling() {
  return (
    <PortalGuard roles={["client_authorized_signer", "client_limited_user"]}>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Billing & Plans">
          {user.clientCompanyId ? (
            <PlanCatalog companyId={user.clientCompanyId} />
          ) : (
            <p className="text-sm text-muted-foreground">No company is associated with this account.</p>
          )}
        </PortalShell>
      )}
    </PortalGuard>
  );
}
