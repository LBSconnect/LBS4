import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { Copyright } from "lucide-react";

export default function CopyrightDmcaPolicy() {
  return (
    <>
      <SEO
        title="Copyright and DMCA Policy"
        canonical="/copyright-dmca-policy"
        description="Copyright and DMCA Policy for Linton Business Solutions LLC (LBS): ownership of LBS content, customer content rights, and the process for copyright complaints and counter-notices."
      />
      <LegalPageLayout
        icon={Copyright}
        title="Copyright and DMCA Policy"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. LBS Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            Unless otherwise stated, Linton Business Solutions LLC owns or licenses the websites, software, text,
            graphics, templates, prompts, courses, practice questions, explanations, videos, documentation,
            workflows, branding, and other content made available through its services.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            No content may be copied, scraped, republished, resold, distributed, publicly displayed, reverse
            engineered, or used to create a competing product except as expressly authorized.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Customer Content</h2>
          <p className="text-muted-foreground leading-relaxed">
            Customers retain ownership of content they submit, subject to the limited rights required for LBS to
            host, process, transmit, reproduce, display, secure, back up, and deliver the requested service.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. Copyright Complaints</h2>
          <p className="text-muted-foreground leading-relaxed">
            A copyright owner or authorized agent may send a notice identifying:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>the copyrighted work;</li>
            <li>the allegedly infringing material and its location;</li>
            <li>contact information;</li>
            <li>a good-faith statement that the use is unauthorized;</li>
            <li>a statement under penalty of perjury that the notice is accurate and the sender is authorized;</li>
            <li>a physical or electronic signature.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">Send notices to:</p>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: (281) 836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
            <p className="text-muted-foreground">Subject: Copyright Notice</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Counter-Notices</h2>
          <p className="text-muted-foreground leading-relaxed">
            A person whose material was removed may submit a legally sufficient counter-notice identifying the
            removed material, stating under penalty of perjury a good-faith belief that removal was mistaken, and
            consenting to appropriate federal-court jurisdiction where required.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Repeat Infringers</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS may suspend or terminate users who repeatedly infringe intellectual-property rights.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. No Misrepresentation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Knowingly submitting a materially false infringement or counter-notice may create legal liability.
          </p>
        </div>
      </LegalPageLayout>
    </>
  );
}
