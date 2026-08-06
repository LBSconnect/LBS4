import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import { UserPlus, ShieldCheck } from "lucide-react";
import { i9Api, I9ApiError, PORTAL_ROUTES, type I9User } from "@/lib/i9Portal";
import { useI9Session, NAVY } from "./_shared";
import { trackEvent } from "@/components/Analytics";

const MIN_PASSWORD_LENGTH = 12;

export default function PortalRegister() {
  const [, setLocation] = useLocation();
  const session = useI9Session();
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.status === "authed") setLocation(PORTAL_ROUTES.dashboard);
  }, [session.status, setLocation]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsDuplicateEmail(false);
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
      const result = await i9Api<{ user: I9User; companyId: string }>("/api/i9/auth/register-client", {
        method: "POST",
        body: JSON.stringify({ companyLegalName, contactName, email, password }),
      });
      // Conversion event only — no PII (company/contact name, email) is ever
      // passed as an event param, matching the site's no-employee/business-PII-
      // in-analytics boundary.
      trackEvent("employer_onboarding_registered");
      session.setUser(result.user);
      session.setStatus("authed");
      setLocation(PORTAL_ROUTES.onboarding);
    } catch (err) {
      if (err instanceof I9ApiError && err.status === 503) {
        setError("The secure portal is not yet configured on this environment. Please contact LBS directly to begin onboarding.");
      } else if (err instanceof I9ApiError && err.status === 409) {
        setIsDuplicateEmail(true);
        setError("An account with this email already exists.");
      } else {
        setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ backgroundColor: NAVY }}>
      <SEO title="Start Employer Onboarding | LBS New-Hire Verification" canonical={PORTAL_ROUTES.register} noIndex />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <ShieldCheck className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>Start Employer Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Create your secure portal account to begin. No employee data is collected here — this only creates the
            business account used for onboarding, agreements, and case management.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="i9-company">Company Legal Name</Label>
            <Input id="i9-company" value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} placeholder="Acme Manufacturing LLC" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i9-contact">Your Name</Label>
            <Input id="i9-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i9-reg-email">Business Email</Label>
            <Input id="i9-reg-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@acme.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i9-reg-password">Password</Label>
            <Input id="i9-reg-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`} required minLength={MIN_PASSWORD_LENGTH} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i9-reg-password-confirm">Confirm Password</Label>
            <Input id="i9-reg-password-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={MIN_PASSWORD_LENGTH} />
          </div>
          {error && (
            <p className="text-red-500 text-sm">
              {error}
              {isDuplicateEmail && (
                <>
                  {" "}
                  <Link href={PORTAL_ROUTES.login} className="font-medium underline">Sign in</Link>
                  {" or "}
                  <Link href={PORTAL_ROUTES.forgotPassword} className="font-medium underline">reset your password</Link>.
                </>
              )}
            </p>
          )}
          <Button
            type="submit"
            className="w-full text-white gap-1.5"
            style={{ backgroundColor: NAVY }}
            disabled={loading || !companyLegalName || !contactName || !email || !password || !confirmPassword}
          >
            <UserPlus className="w-4 h-4" /> {loading ? "Creating account..." : "Create Account & Continue"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href={PORTAL_ROUTES.login} className="font-medium hover:underline" style={{ color: NAVY }}>
            Sign in
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted-foreground">
          Do not enter employee Social Security numbers, document numbers, or other employee-specific information
          anywhere on this page.
        </p>
      </div>
    </div>
  );
}
