// ─────────────────────────────────────────────────────────────────────────────
// Self-service MFA (TOTP) enrollment / disable for the signed-in user. Every
// role can reach this page — a client authorized signer's account holds the
// same class of sensitive access (protected employee data reveal) as LBS
// staff, so MFA is offered to everyone, not staff-only.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldAlert, KeyRound, Copy } from "lucide-react";
import { i9Api } from "@/lib/i9Portal";
import { PortalGuard, PortalShell, PortalCard, Field, ErrorBanner, SuccessBanner } from "./_shared";

function MfaSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [copied, setCopied] = useState(false);

  // Disable state
  const [disableCode, setDisableCode] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableError, setDisableError] = useState("");

  const [success, setSuccess] = useState("");

  function refreshStatus() {
    return i9Api<{ mfaEnabled: boolean }>("/api/i9/auth/mfa/status")
      .then((d) => setEnabled(d.mfaEnabled))
      .catch(() => {});
  }

  useEffect(() => {
    refreshStatus().finally(() => setLoading(false));
  }, []);

  async function startEnroll() {
    setEnrollError("");
    setEnrollBusy(true);
    try {
      const r = await i9Api<{ secret: string; otpauthUrl: string }>("/api/i9/auth/mfa/enroll/start", { method: "POST" });
      setSecret(r.secret);
      setOtpauthUrl(r.otpauthUrl);
      setEnrolling(true);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "Failed to start enrollment.");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setEnrollError("");
    setEnrollBusy(true);
    try {
      await i9Api("/api/i9/auth/mfa/enroll/confirm", { method: "POST", body: JSON.stringify({ code: enrollCode }) });
      setEnrolling(false);
      setSecret("");
      setOtpauthUrl("");
      setEnrollCode("");
      setSuccess("Two-factor authentication is now enabled on your account.");
      await refreshStatus();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "That code didn't match. Try again.");
    } finally {
      setEnrollBusy(false);
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setDisableError("");
    setDisableBusy(true);
    try {
      await i9Api("/api/i9/auth/mfa/disable", { method: "POST", body: JSON.stringify({ code: disableCode }) });
      setDisableCode("");
      setSuccess("Two-factor authentication has been turned off.");
      await refreshStatus();
    } catch (err) {
      setDisableError(err instanceof Error ? err.message : "Failed to disable two-factor authentication.");
    } finally {
      setDisableBusy(false);
    }
  }

  function copySecret() {
    navigator.clipboard?.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading security settings...</p>;

  if (success) return <SuccessBanner message={success} />;

  return (
    <PortalCard title="Two-Factor Authentication">
      {enabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <ShieldCheck className="w-4 h-4" /> Two-factor authentication is enabled on your account.
          </div>
          <form onSubmit={disableMfa} className="space-y-3 max-w-sm">
            <Field label="Enter a current code to disable" hint="Requires a valid code from your authenticator app, so a hijacked browser session alone can't turn this off.">
              <Input inputMode="numeric" maxLength={6} value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" />
            </Field>
            {disableError && <ErrorBanner message={disableError} />}
            <Button type="submit" variant="outline" disabled={disableBusy || disableCode.length !== 6} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
              <ShieldAlert className="w-3.5 h-3.5" /> {disableBusy ? "Disabling..." : "Disable Two-Factor Authentication"}
            </Button>
          </form>
        </div>
      ) : enrolling ? (
        <form onSubmit={confirmEnroll} className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">
            Add this account to your authenticator app (Google Authenticator, Authy, 1Password, etc.) using "Enter a
            setup key manually" and the code below, then enter the 6-digit code it generates.
          </p>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground">Setup key</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono break-all">{secret}</code>
              <Button type="button" size="sm" variant="ghost" onClick={copySecret} className="shrink-0 gap-1">
                <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <Field label="Enter the 6-digit code from your app" required>
            <Input inputMode="numeric" maxLength={6} value={enrollCode} onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" autoFocus />
          </Field>
          {enrollError && <ErrorBanner message={enrollError} />}
          <div className="flex gap-2">
            <Button type="submit" disabled={enrollBusy || enrollCode.length !== 6} className="gap-1.5 text-white" style={{ backgroundColor: "#0D1B3D" }}>
              <KeyRound className="w-3.5 h-3.5" /> {enrollBusy ? "Confirming..." : "Confirm & Enable"}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setEnrolling(false); setEnrollCode(""); setEnrollError(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Two-factor authentication adds a 6-digit code from an authenticator app on top of your password. Not
            currently enabled on your account.
          </p>
          <Button onClick={startEnroll} disabled={enrollBusy} className="gap-1.5 text-white" style={{ backgroundColor: "#0D1B3D" }}>
            <ShieldCheck className="w-3.5 h-3.5" /> {enrollBusy ? "Starting..." : "Enable Two-Factor Authentication"}
          </Button>
          {enrollError && <ErrorBanner message={enrollError} />}
        </div>
      )}
    </PortalCard>
  );
}

export default function PortalSecuritySettings() {
  return (
    <PortalGuard>
      {(user, session) => (
        <PortalShell user={user} logout={session.logout} title="Security Settings">
          <MfaSection />
        </PortalShell>
      )}
    </PortalGuard>
  );
}
