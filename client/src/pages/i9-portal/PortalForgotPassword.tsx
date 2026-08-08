import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { KeyRound, ShieldCheck } from "lucide-react";
import { i9Api, PORTAL_ROUTES } from "@/lib/i9Portal";
import { NAVY } from "./_shared";

export default function PortalForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Always shown after submit, regardless of whether the email matched an
  // account — the API itself returns the same generic response either way,
  // so there's nothing more specific for this page to reveal.
  const [submitted, setSubmitted] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await i9Api("/api/i9/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch {
      // Deliberately ignored — the UI shows the same confirmation either
      // way, so a network hiccup here shouldn't read as "your email isn't
      // registered."
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ backgroundColor: NAVY }}>
        <SEO title="Forgot Password | LBS New-Hire Verification" canonical={PORTAL_ROUTES.forgotPassword} noIndex />
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <ShieldCheck className="w-10 h-10 mx-auto" style={{ color: NAVY }} />
            <h1 className="text-xl font-bold" style={{ color: NAVY }}>Reset Your Password</h1>
            <p className="text-sm text-muted-foreground">Enter the email on your account and we'll send a reset link.</p>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground">
                If an account exists for <strong>{email}</strong>, a password reset link has been sent. It's valid for
                1 hour and can only be used once.
              </p>
              <Link href={PORTAL_ROUTES.login} className="text-sm font-medium hover:underline" style={{ color: NAVY }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="i9-forgot-email">Email</Label>
                <Input
                  id="i9-forgot-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full text-white gap-1.5" style={{ backgroundColor: NAVY }} disabled={loading || !email}>
                <KeyRound className="w-4 h-4" /> {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          {!submitted && (
            <p className="text-center text-xs text-muted-foreground">
              <Link href={PORTAL_ROUTES.login} className="font-medium hover:underline" style={{ color: NAVY }}>
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
