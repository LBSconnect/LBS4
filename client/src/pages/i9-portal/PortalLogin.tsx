import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { LogIn, ShieldCheck } from "lucide-react";
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

  // Already signed in? Skip straight to the dashboard.
  useEffect(() => {
    if (session.status === "authed") setLocation(PORTAL_ROUTES.dashboard);
  }, [session.status, setLocation]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await i9Api<{ user: I9User }>("/api/i9/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      session.setUser(result.user);
      session.setStatus("authed");
      setLocation(PORTAL_ROUTES.dashboard);
    } catch (err) {
      if (err instanceof I9ApiError && err.status === 503) {
        setError("The secure portal is not yet configured on this environment. Please contact LBS directly.");
      } else {
        setError(err instanceof Error ? err.message : "Sign in failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: NAVY }}>
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
            <Label htmlFor="i9-password">Password</Label>
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
  );
}
