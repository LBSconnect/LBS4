import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { i9Api, I9ApiError, PORTAL_ROUTES } from "@/lib/i9Portal";
import { NAVY } from "./_shared";

const MIN_PASSWORD_LENGTH = 12;

function getTokenFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

export default function PortalResetPassword() {
  const [token] = useState(getTokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      await i9Api("/api/i9/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof I9ApiError && err.status === 503) {
        setError("The secure portal is not yet configured on this environment. Please contact LBS directly.");
      } else {
        setError(err instanceof Error ? err.message : "This reset link is invalid or has expired. Please request a new one.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ backgroundColor: NAVY }}>
        <SEO title="Reset Password | LBS New-Hire Verification" canonical={PORTAL_ROUTES.resetPassword} noIndex />
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <ShieldCheck className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>Set a New Password</h1>
          </div>

          {!token ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-red-600">This reset link is missing or malformed.</p>
              <Link href={PORTAL_ROUTES.forgotPassword} className="text-sm font-medium hover:underline" style={{ color: NAVY }}>
                Request a new reset link
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-8 h-8 mx-auto text-green-600" />
              <p className="text-sm text-foreground">Your password has been reset. You can now sign in with your new password.</p>
              <Link href={PORTAL_ROUTES.login} className="text-sm font-medium hover:underline" style={{ color: NAVY }}>
                Go to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="i9-new-password">New Password</Label>
                <Input
                  id="i9-new-password"
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
                <Label htmlFor="i9-new-password-confirm">Confirm New Password</Label>
                <Input
                  id="i9-new-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={MIN_PASSWORD_LENGTH}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">
                  {error}{" "}
                  <Link href={PORTAL_ROUTES.forgotPassword} className="font-medium underline">Request a new link</Link>.
                </p>
              )}
              <Button type="submit" className="w-full text-white gap-1.5" style={{ backgroundColor: NAVY }} disabled={loading || !password || !confirmPassword}>
                <KeyRound className="w-4 h-4" /> {loading ? "Saving..." : "Reset Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
