// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks for every authenticated I-9 portal page: the session
// hook, the route guard, the page shell (top bar + nav), and small presentational
// helpers. Keeping these in one place means the auth/redirect logic — the part
// most worth getting exactly right — is written and tested once.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useId, isValidElement, cloneElement, type ReactNode, type ReactElement } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { Loader2, LogOut, LayoutDashboard, Building2, MapPin, ClipboardList, Users, ShieldAlert, CreditCard, CalendarClock, Bell, Wrench, KeyRound } from "lucide-react";
import {
  i9Api,
  isI9Unauthorized,
  PORTAL_ROUTES,
  ROLE_LABELS,
  isInternalRole,
  type I9User,
  type I9Role,
} from "@/lib/i9Portal";

const NAVY = "#0D1B3D";

// ─── Session hook ────────────────────────────────────────────────────────────

type SessionStatus = "loading" | "authed" | "anon";

export function useI9Session() {
  const [user, setUser] = useState<I9User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(() => {
    let active = true;
    setStatus("loading");
    i9Api<{ user: I9User }>("/api/i9/auth/me")
      .then((d) => {
        if (!active) return;
        setUser(d.user);
        setStatus("authed");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("anon");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => refresh(), [refresh]);

  const logout = useCallback(async () => {
    try {
      await i9Api("/api/i9/auth/logout", { method: "POST" });
    } catch {
      // Even if the network call fails, treat the client as logged out.
    }
    setUser(null);
    setStatus("anon");
  }, []);

  return { user, status, setUser, setStatus, refresh, logout };
}

/** Any hook that talks to the API should route unauthorized errors through
 *  this so an expired/revoked session bounces the user back to login instead
 *  of leaving them staring at a silent failure. */
export function useUnauthRedirect() {
  const [, setLocation] = useLocation();
  return useCallback(
    (err: unknown) => {
      if (isI9Unauthorized(err)) setLocation(PORTAL_ROUTES.login);
    },
    [setLocation]
  );
}

// ─── Loading / denied screens ────────────────────────────────────────────────

export function PortalLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

export function PortalDenied({ message = "You do not have permission to view this page." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb] px-6">
      <div className="max-w-md text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
        <h1 className="text-lg font-bold" style={{ color: NAVY }}>Access Denied</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link href={PORTAL_ROUTES.dashboard}>
          <Button variant="outline" className="mt-2">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Route guard ─────────────────────────────────────────────────────────────

/** Wrap any authenticated portal page's contents with this. Handles the
 *  loading -> authed/anon transition and the redirect to login, and
 *  optionally restricts by role. `children` is a render-prop so pages only
 *  ever render once a real user object exists — no `user!` non-null
 *  assertions scattered through page bodies. */
export function PortalGuard({
  roles,
  children,
}: {
  roles?: I9Role[];
  children: (user: I9User, session: ReturnType<typeof useI9Session>) => ReactNode;
}) {
  const session = useI9Session();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (session.status === "anon") setLocation(PORTAL_ROUTES.login);
    // A temporary/admin-issued password must be changed before anything
    // else in the portal is reachable — matches the server-side gate in
    // requireI9Auth (server/i9Auth.ts), which would 403 every API call any
    // of these pages made anyway. PortalForceChangePassword itself doesn't
    // go through PortalGuard, so there's no loop here.
    else if (session.status === "authed" && session.user?.mustChangePassword) setLocation(PORTAL_ROUTES.forceChangePassword);
  }, [session.status, session.user, setLocation]);

  if (session.status === "loading") return <PortalLoading />;
  if (session.status === "anon" || !session.user) return null; // redirect effect above is in flight
  if (session.user.mustChangePassword) return null; // redirect effect above is in flight
  if (roles && !roles.includes(session.user.role)) return <PortalDenied />;

  return <>{children(session.user, session)}</>;
}

// ─── Page shell (top bar + nav) ──────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  internalOnly?: boolean;
  clientOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: PORTAL_ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: PORTAL_ROUTES.businessIntake, label: "Business Intake", icon: Building2 },
  { href: PORTAL_ROUTES.hiringSites, label: "Hiring Sites", icon: MapPin },
  { href: PORTAL_ROUTES.billing, label: "Billing", icon: CreditCard, clientOnly: true },
  { href: PORTAL_ROUTES.appointments, label: "Appointments", icon: CalendarClock, clientOnly: true },
  { href: PORTAL_ROUTES.requests, label: "New-Hire Requests", icon: ClipboardList },
  { href: PORTAL_ROUTES.notifications, label: "Notifications", icon: Bell },
  { href: PORTAL_ROUTES.security, label: "Security", icon: KeyRound },
  { href: PORTAL_ROUTES.adminCompanies, label: "Client Companies", icon: Users, internalOnly: true },
  { href: PORTAL_ROUTES.adminTools, label: "Admin Tools", icon: Wrench, internalOnly: true },
];

export function PortalShell({
  user,
  logout,
  title,
  noIndexTitle,
  children,
}: {
  user: I9User;
  logout: () => void | Promise<void>;
  title: string;
  noIndexTitle?: string;
  children: ReactNode;
}) {
  const [location] = useLocation();
  const items = NAV_ITEMS.filter((item) => {
    if (item.internalOnly && !isInternalRole(user.role)) return false;
    if (item.clientOnly && isInternalRole(user.role)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* canonical reflects the actual current portal route (not always the
          dashboard) so each authenticated page doesn't collide with every
          other page's canonical URL — moot for indexing since noIndex is
          set, but keeps the tag itself correct. */}
      <SEO title={noIndexTitle ?? title} canonical={location} noIndex />

      <div className="text-white" style={{ backgroundColor: NAVY }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <span className="font-bold text-base sm:text-lg shrink-0">LBS New-Hire Verification Portal</span>
          <span className="hidden sm:inline text-xs text-white/60">{ROLE_LABELS[user.role]}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden md:inline text-sm text-white/80 truncate max-w-[220px]">{user.fullName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto border-t border-white/10">
          {items.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== PORTAL_ROUTES.dashboard && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap cursor-pointer border-b-2 transition-colors ${
                    active ? "border-[#FF6A00] text-white" : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: NAVY }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────────

export function PortalCard({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-border/50 p-5 sm:p-6 space-y-4">
      {(title || action) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-sm sm:text-base" style={{ color: NAVY }}>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** Wraps a single form control (Input/Textarea/select) with a properly
 *  associated <Label>. Every usage of this component across the portal was
 *  originally missing the htmlFor/id link entirely — the label text and the
 *  control just happened to sit next to each other visually, with no actual
 *  <label for="..."> or aria-labelledby relationship. That's an accessibility
 *  bug (WCAG 4.1.2 Name, Role, Value / 1.3.1 Info and Relationships): a
 *  screen reader can't announce the field's name, and clicking the label
 *  text doesn't focus the control. Caught via Playwright's getByLabel()
 *  failing to find fields that were visibly correct — same query assistive
 *  tech relies on. Fixed once, here, for every form that uses Field. */
export function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>, { id, "aria-describedby": hintId })
    : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {control}
      {hint && <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">{message}</div>;
}

export function SuccessBanner({ message }: { message: string }) {
  return <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">{message}</div>;
}

export function ServiceGateBanner({ missing }: { missing: string[] }) {
  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 space-y-1">
      <p className="font-semibold">Secure portal configuration required</p>
      <p>
        This feature needs additional infrastructure configured before it can safely handle protected employee data
        {missing.length > 0 && <>: {missing.join(", ")}</>}. It is intentionally disabled until that's in place — see
        the deliverables document for what's outstanding.
      </p>
    </div>
  );
}

export { NAVY };
