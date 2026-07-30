import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { MessageSquare } from "lucide-react";

export default function ElectronicCommunicationsTerms() {
  return (
    <>
      <SEO
        title="Electronic Communications, Email, and SMS Terms"
        canonical="/electronic-communications-terms"
        description="Electronic Communications, Email, and SMS Terms for Linton Business Solutions LLC (LBS): electronic delivery consent, marketing email rules, and SMS terms."
      />
      <LegalPageLayout
        icon={MessageSquare}
        title="Electronic Communications, Email, and SMS Terms"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Electronic Delivery</h2>
          <p className="text-muted-foreground leading-relaxed">
            By providing an email address or telephone number in connection with an account, purchase, appointment,
            application, or service, you consent to receive electronic records related to that transaction or
            relationship, including receipts, confirmations, appointment reminders, account notices, security
            alerts, policy updates, support messages, and service communications.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You may withdraw consent to electronic delivery by contacting LBS, but withdrawal may affect our ability
            to provide online services.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Marketing Email</h2>
          <p className="text-muted-foreground leading-relaxed">
            Marketing email is separate from required transactional communication. Marketing messages will:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>accurately identify the sender;</li>
            <li>use non-deceptive subject lines;</li>
            <li>include LBS's physical postal address;</li>
            <li>provide a working opt-out method;</li>
            <li>honor valid opt-out requests as required by law.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Unsubscribing from marketing does not stop necessary account, appointment, billing, security, testing,
            or service messages.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. SMS</h2>
          <p className="text-muted-foreground leading-relaxed">
            Where SMS is offered, consent is not a condition of purchasing goods or services unless text messaging
            is essential to the requested service and clearly disclosed.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Message frequency varies. Message and data rates may apply. Reply:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>STOP to opt out of optional messages;</li>
            <li>HELP for assistance.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Carriers are not liable for delayed or undelivered messages.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Consent Records</h2>
          <p className="text-muted-foreground leading-relaxed">LBS should retain records of:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>the disclosure shown;</li>
            <li>date and time of consent;</li>
            <li>telephone number or email;</li>
            <li>source page or form;</li>
            <li>policy version;</li>
            <li>opt-out or withdrawal.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Contact</h2>
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
