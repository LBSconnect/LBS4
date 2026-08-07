import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/components/Analytics";

/**
 * Reopenable cookie/analytics preferences control, triggered from the
 * footer's "Cookie Preferences" link. Google Analytics (GA4) is the only
 * tracking technology this site loads (confirmed by codebase audit — no ad
 * pixels, no remarketing tags) — so there's one real toggle, not a wall of
 * unused categories. "Essential" cookies (session, CSRF, login) are always
 * on and aren't presented as optional, since disabling them would break the
 * booking/portal/checkout flows themselves, not just tracking.
 */
export default function CookiePreferences({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => getAnalyticsConsent());

  const handleSave = () => {
    setAnalyticsConsent(analyticsEnabled);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-cookie-preferences">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which optional technologies LBS can use on this site. See the{" "}
            <Link href="/cookie-policy" className="underline underline-offset-2 hover:opacity-80">
              Cookie Policy
            </Link>{" "}
            for details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start justify-between gap-4 rounded-md border border-border/50 px-4 py-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Essential</Label>
              <p className="text-xs text-muted-foreground">
                Required for login, checkout, and booking to work. Always on.
              </p>
            </div>
            <Switch checked disabled aria-label="Essential cookies (always on)" data-testid="switch-cookies-essential" />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border/50 px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="switch-cookies-analytics" className="text-sm font-medium">Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Google Analytics — helps LBS understand site usage. No advertising or remarketing
                cookies are used on this site.
              </p>
            </div>
            <Switch
              id="switch-cookies-analytics"
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
              data-testid="switch-cookies-analytics"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full sm:w-auto" data-testid="button-save-cookie-preferences">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
