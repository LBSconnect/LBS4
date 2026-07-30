import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { Cookie } from "lucide-react";

export default function CookiePolicy() {
  return (
    <>
      <SEO
        title="Cookie Policy"
        canonical="/cookie-policy"
        description="Cookie Policy for Linton Business Solutions LLC (LBS), covering lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com. What cookies and similar technologies we use and your choices."
      />
      <LegalPageLayout
        icon={Cookie}
        title="Cookie Policy"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Scope</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Cookie Policy applies to lbsconnect.net, myeasypass.net, workabeez.net, lbs4.com, and related web
            applications that link to it.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. What Cookies Are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cookies are small text files placed on a browser or device. Similar technologies include local storage,
            software development kits, tags, pixels, and session identifiers.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. Categories We May Use</h2>

          <h3 className="text-lg font-semibold">Essential</h3>
          <p className="text-muted-foreground leading-relaxed">
            Used for login, authentication, security, fraud prevention, shopping carts, checkout, load balancing,
            and core operation. These technologies cannot always be disabled without making a service unusable.
          </p>

          <h3 className="text-lg font-semibold mt-6">Preferences</h3>
          <p className="text-muted-foreground leading-relaxed">
            Used to remember language, display, accessibility, and account settings.
          </p>

          <h3 className="text-lg font-semibold mt-6">Analytics and Performance</h3>
          <p className="text-muted-foreground leading-relaxed">
            Used to understand traffic, navigation, feature use, errors, and performance.
          </p>

          <h3 className="text-lg font-semibold mt-6">Advertising</h3>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not authorize advertising cookies or cross-site targeted-advertising technologies through this
            Policy. If such technology is introduced, LBS must update this Policy, provide required notice and
            controls, and complete legal review before activation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Service-Specific Use</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>LBSconnect may use cookies for contact forms, purchases, course access, and analytics.</li>
            <li>MyEasyPass may use cookies for authentication, saved study sessions, language selection, progress, and purchases.</li>
            <li>Work-A-Beez may use cookies for secure sessions, authentication, trusted-device workflows, preferences, and security.</li>
            <li>LBS4 may use cookies for appointments, forms, checkout, and analytics.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Cookie List</h2>
          <p className="text-muted-foreground leading-relaxed">
            A detailed cookie table — listing each cookie or technology, its provider, domain, purpose, category,
            and duration — is maintained separately and is available on request.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Your Choices</h2>
          <p className="text-muted-foreground leading-relaxed">You may manage cookies through:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>a cookie preference tool, where provided;</li>
            <li>your browser settings;</li>
            <li>device privacy settings;</li>
            <li>opt-out tools provided by relevant analytics providers.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Blocking essential cookies may prevent account login, checkout, appointment scheduling, or application
            functionality.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. Do Not Track and Universal Opt-Out Signals</h2>
          <p className="text-muted-foreground leading-relaxed">
            Browser "Do Not Track" signals are not interpreted consistently across the industry. Where applicable
            law requires recognition of an approved universal opt-out mechanism, LBS will process the signal as
            required for the relevant activity.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this Cookie Policy when technology or law changes.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">9. Contact</h2>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: (281) 836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
          </div>
        </div>
      </LegalPageLayout>
    </>
  );
}
