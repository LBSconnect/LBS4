import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LogIn, ShieldCheck, KeyRound } from "lucide-react";
import { i9Api, I9ApiError, PORTAL_ROUTES, type I9User } from "@/lib/i9Portal";
import { useI9Session } from "./_shared";
import { NAVY } from "./_shared";

export default function PortalLogin() {
  const [, setLocation] = useLocation();
  const session = useI9Session();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Set once the password step succeeds on an MFA-enabled account — the
  // form then switches to asking for the 6-digit code instead of
  // re-prompting for the password.
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  // Already signed in? Skip straight to the dashboard (or the forced
  // password-change screen, if that's still outstanding).
  useEffect(() => {
    if (session.status === "authed") {
      setLocation(session.user?.mustChangePassword ? PORTAL_ROUTES.forceChangePassword : PORTAL_ROUTES.dashboard);
    }
  }, [session.status, session.user, setLocation]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await i9Api<{ user: I9User; mfaRequired?: boolean; mfaToken?: string }>("/api/i9/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.mfaRequired && result.mfaToken) {
        setMfaToken(result.mfaToken);
        setLoading(false);
        return;
      }
      session.setUser(result.user);
      session.setStatus("authed");
      setLocation(result.user.mustChangePassword ? PORTAL_ROUTES.forceChangePassword : PORTAL_ROUTES.dashboard);
    } catch (err) {
      if (err instanceof I9ApiError && err.status === 503) {
        setError("The secure portal is not yet configured on this environment. Please contact LBS directly.");
      } else {
        setError(err instanceof Error ? err.message : "Sign in failed. Please check your details.");
      }
      setLoading(false);
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await i9Api<{ user: I9User }>("/api/i9/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ mfaToken, code: mfaCode }),
      });
      session.setUser(result.user);
      session.setStatus("authed");
      setLocation(result.user.mustChangePassword ? PORTAL_ROUTES.forceChangePassword : PORTAL_ROUTES.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid authentication code.");
      setLoading(false);
    }
  }

  if (mfaToken) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ backgroundColor: NAVY }}>
          <SEO title="Verify | LBS New-Hire Verification" canonical={PORTAL_ROUTES.login} noIndex />
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center space-y-1">
              <KeyRound className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
              <h1 className="text-xl font-bold" style={{ color: NAVY }}>Enter Your Authentication Code</h1>
              <p className="text-sm text-muted-foreground">Open your authenticator app and enter the current 6-digit code.</p>
            </div>
            <form onSubmit={submitMfa} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="i9-mfa-code">Authentication Code</Label>
                <Input
                  id="i9-mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoFocus
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full text-white gap-1.5" style={{ backgroundColor: NAVY }} disabled={loading || mfaCode.length !== 6}>
                <KeyRound className="w-4 h-4" /> {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => { setMfaToken(null); setMfaCode(""); setError(""); }}
              className="text-center text-xs text-muted-foreground hover:underline w-full"
            >
              Back to sign in
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ backgroundColor: NAVY }}>
        <SEO title="Client Portal Login | LBS New-Hire Verification" canonical={PORTAL_ROUTES.login} noIndex />
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <ShieldCheck className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>New-Hire Verification Portal</h1>
            <p className="text-sm text-muted-foreground">Sign in to your secure client portal</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="i9-email">Email</Label>
              <Input id="i9-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="i9-password">Password</Label>
                <Link href={PORTAL_ROUTES.forgotPassword} className="text-xs font-medium hover:underline" style={{ color: NAVY }}>
                  Forgot password?
                </Link>
              </div>
              <Input id="i9-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              className="w-full text-white gap-1.5"
              style={{ backgroundColor: NAVY }}
              disabled={loading || !email || !password}
            >
              <LogIn className="w-4 h-4" /> {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            New client?{" "}
            <Link href={PORTAL_ROUTES.register} className="font-medium hover:underline" style={{ color: NAVY }}>
              Start employer onboarding
            </Link>
          </p>
          <p className="text-center text-[11px] text-muted-foreground">
            This portal is for authenticated business-account use only. Do not enter employee Social Security numbers or
            document information on this page.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
