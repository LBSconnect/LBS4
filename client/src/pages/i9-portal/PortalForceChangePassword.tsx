// Shown when an account was issued a known temporary password (bootstrap-admin,
// or an admin creating another user) and hasn't set its own password yet.
// Deliberately doesn't use PortalGuard — that component redirects *to* this
// page whenever mustChangePassword is true, so this page instead drives its
// own useI9Session() directly: anonymous visitors go to login, an already-
// cleared account goes to the dashboard, and the change form is the only
// other outcome. Every other portal route is blocked server-side
// (requireI9Auth in server/i9Auth.ts) until this succeeds.
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { KeyRound, ShieldCheck } from "lucide-react";
import { i9Api, PORTAL_ROUTES } from "@/lib/i9Portal";
import { useI9Session, NAVY, PortalLoading } from "./_shared";

const MIN_PASSWORD_LENGTH = 12;

export default function PortalForceChangePassword() {
  const [, setLocation] = useLocation();
  const session = useI9Session();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.status === "anon") setLocation(PORTAL_ROUTES.login);
    else if (session.status === "authed" && !session.user?.mustChangePassword) setLocation(PORTAL_ROUTES.dashboard);
  }, [session.status, session.user, setLocation]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await i9Api("/api/i9/auth/force-change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: password }),
      });
      if (session.user) session.setUser({ ...session.user, mustChangePassword: false });
      setLocation(PORTAL_ROUTES.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (session.status === "loading" || session.status === "anon" || !session.user?.mustChangePassword) return <PortalLoading />;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: NAVY }}>
      <SEO title="Set a New Password | LBS New-Hire Verification" canonical={PORTAL_ROUTES.forceChangePassword} noIndex />
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <ShieldCheck className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Set a New Password</h1>
          <p className="text-sm text-muted-foreground">
            Your account was created with a temporary password. Choose a new one to continue to the portal.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="i9-force-new-password">New Password</Label>
            <Input
              id="i9-force-new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              minLength={MIN_PASSWORD_LENGTH}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i9-force-new-password-confirm">Confirm New Password</Label>
            <Input
              id="i9-force-new-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full text-white gap-1.5" style={{ backgroundColor: NAVY }} disabled={loading || !password || !confirmPassword}>
            <KeyRound className="w-4 h-4" /> {loading ? "Saving..." : "Set Password & Continue"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => void session.logout().then(() => setLocation(PORTAL_ROUTES.login))}
          className="text-center text-xs text-muted-foreground hover:underline w-full"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
