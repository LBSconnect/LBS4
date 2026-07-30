import { Link } from "wouter";
import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { Eye } from "lucide-react";

export default function NoticeAtCollection() {
  return (
    <>
      <SEO
        title="Notice at Collection"
        canonical="/notice-at-collection"
        description="Notice at Collection for Linton Business Solutions LLC (LBS): categories of personal information we collect, our purposes for collecting it, and your rights."
      />
      <LegalPageLayout
        icon={Eye}
        title="Notice at Collection"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Linton Business Solutions LLC collects personal information to operate its websites, applications,
            consulting services, educational products, workforce platform, testing center, and business-center
            services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Categories Collected</h2>
          <p className="text-muted-foreground leading-relaxed">Depending on the service, LBS may collect:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>identifiers and contact details</li>
            <li>account and authentication information</li>
            <li>transaction and subscription records</li>
            <li>internet, device, and usage information</li>
            <li>appointment and testing information</li>
            <li>practice-test answers, scores, and study progress</li>
            <li>employer, employee, timekeeping, scheduling, attendance, PTO, payroll-related, pay-stub, and communication information</li>
            <li>government-identification details used for testing or notary services</li>
            <li>photographs and customer documents</li>
            <li>consulting and project information</li>
            <li>customer communications and support records</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Purposes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use information to provide and secure services, process payments and appointments, administer
            accounts and education tools, support workforce operations, comply with testing and notary
            requirements, communicate with customers, prevent fraud, improve products, and satisfy legal
            obligations.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Disclosure</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may disclose information to service providers, payment processors, testing sponsors, professional
            advisers, government authorities, and others described in the Corporate Privacy Policy.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not sell personal information for money.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain information only for appropriate operational, legal, contractual, security, and backup
            periods. Short-lived document-service files should be deleted promptly after completion.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Rights and Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Review the{" "}
            <Link href="/privacy-policy" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">
              Corporate Privacy Policy
            </Link>{" "}
            or contact:
          </p>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: (281) 836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
            <p className="text-muted-foreground">Use the subject line "Privacy Request".</p>
          </div>
        </div>
      </LegalPageLayout>
    </>
  );
}
