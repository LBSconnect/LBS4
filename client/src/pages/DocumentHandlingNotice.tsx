import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { FolderLock } from "lucide-react";

export default function DocumentHandlingNotice() {
  return (
    <>
      <SEO
        title="Business-Center Document Handling Notice"
        canonical="/document-handling-notice"
        description="LBS4 Business-Center Document Handling Notice: how we handle files for passport photos and website design services."
      />
      <LegalPageLayout
        icon={FolderLock}
        title="Business-Center Document Handling Notice"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: August 4, 2026"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            This Notice applies to passport photos, website design services, and other document-handling services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Customer Responsibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            You represent that you have authority to possess, reproduce, edit, transmit, or publish the materials
            you provide.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Do not submit illegal content, stolen information, unlawful surveillance material, forged documents,
            malware, or content that infringes another person's rights.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">File Accuracy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Review the file, page range, spelling, orientation, quantity, destination, paper, color, and
            instructions before work begins. Customer file errors are not LBS errors.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Sensitive Documents</h2>
          <p className="text-muted-foreground leading-relaxed">Avoid unnecessary disclosure of:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Social Security numbers;</li>
            <li>full financial-account information;</li>
            <li>passwords;</li>
            <li>medical records;</li>
            <li>immigration records;</li>
            <li>private keys;</li>
            <li>confidential business records.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Where sensitive documents are necessary, ask about the most secure available transfer method.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Email, USB, and Workstations</h2>
          <p className="text-muted-foreground leading-relaxed">
            Files received by email, upload, USB, phone, cloud link, or workstation may temporarily exist on an
            intake email account, a browser download folder, a workstation, printer or scanner memory, a fax
            service, a temporary output folder, or a backup or security log.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LBS should use restricted accounts, clear local downloads, empty recycle bins, remove USB copies, sign
            out of customer accounts, and delete working files after completion.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Deletion Standards</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>passport-photo working files: same day or within 24 hours;</li>
            <li>design project files: 30 days after delivery unless the customer requests earlier deletion or ongoing storage;</li>
            <li>failed or abandoned jobs: 7 days;</li>
            <li>transaction records: retained separately without unnecessary document content.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Unclaimed Originals</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will attempt reasonable contact where practical. Unclaimed customer documents may be securely
            destroyed after 30 days unless law requires another period. Government identification and original
            legal documents should receive expedited contact and secure handling.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Reprints and Corrections</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will correct work that materially differs from accepted customer instructions due to LBS error. Work
            must be reported promptly and returned or documented where practical.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Employee Confidentiality</h2>
          <p className="text-muted-foreground leading-relaxed">
            Staff should access documents only as needed to provide service and should not photograph, retain,
            discuss, or use customer information for personal purposes.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Contact</h2>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: 281-836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
          </div>
        </div>
      </LegalPageLayout>
    </>
  );
}
