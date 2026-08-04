import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { Accessibility } from "lucide-react";

export default function AccessibilityStatement() {
  return (
    <>
      <SEO
        title="Accessibility Statement"
        canonical="/accessibility-statement"
        description="Linton Business Solutions LLC (LBS) is committed to making its websites, applications, digital products, and physical services reasonably accessible to people with disabilities."
      />
      <LegalPageLayout
        icon={Accessibility}
        title="Accessibility Statement"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Linton Business Solutions LLC is committed to making its websites, applications, digital products, and
            physical services reasonably accessible to people with disabilities.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Our Goal</h2>
          <p className="text-muted-foreground leading-relaxed">
            We aim to design and maintain digital experiences consistent with generally recognized accessibility
            practices, including relevant Web Content Accessibility Guidelines where reasonably applicable.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Measures</h2>
          <p className="text-muted-foreground leading-relaxed">LBS may:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>use semantic page structure and keyboard-accessible controls;</li>
            <li>provide text alternatives for meaningful images;</li>
            <li>maintain readable contrast and scalable text;</li>
            <li>label forms and identify validation errors;</li>
            <li>support screen-reader and keyboard navigation;</li>
            <li>review new features for accessibility;</li>
            <li>address reported barriers;</li>
            <li>provide reasonable alternative methods of receiving information or service.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Testing and Third-Party Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            Some content, embedded tools, payment pages, testing platforms, or third-party services may be
            controlled by others. LBS will make reasonable efforts to select accessible providers and to help users
            identify available alternatives.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Physical Accommodations</h2>
          <p className="text-muted-foreground leading-relaxed">
            Individuals needing an accommodation for a certification or licensing examination may be required to
            request approval through the applicable testing sponsor before scheduling. LBS cannot independently
            modify exam rules or approved accommodations.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For other LBS services, contact us in advance when possible so we can discuss a reasonable
            accommodation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Feedback</h2>
          <p className="text-muted-foreground leading-relaxed">Please describe:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>the page, application, or service involved;</li>
            <li>the accessibility barrier;</li>
            <li>the device and assistive technology used, if relevant;</li>
            <li>the preferred way to receive a response.</li>
          </ul>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: 281-836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not retaliate against anyone who requests an accommodation or reports an accessibility concern.
          </p>
        </div>
      </LegalPageLayout>
    </>
  );
}
