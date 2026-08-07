import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { FileText } from "lucide-react";

export default function TermsOfUse() {
  return (
    <>
      <SEO
        title="Terms of Service"
        canonical="/terms-of-use"
        description="LBS4 Test, Exam, and Business Center Terms of Service: testing-center appointments, sponsored examinations, boot camps, notary services, passport photos, and website design services."
      />
      <LegalPageLayout
        icon={FileText}
        title="LBS4 Test, Exam, and Business Center Terms of Service"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: August 4, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Scope</h2>
          <p className="text-muted-foreground leading-relaxed">These Terms apply to lbs4.com and LBS Test &amp; Exam Center services, including:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>testing-center appointments;</li>
            <li>Pearson VUE, Certiport, PMI, and other sponsored examinations;</li>
            <li>exam-preparation bootcamps;</li>
            <li>notary services;</li>
            <li>passport and visa photographs;</li>
            <li>website design and business-center services.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Independent Testing Sponsors</h2>
          <p className="text-muted-foreground leading-relaxed">Exam sponsors control their own:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>candidate eligibility and registration;</li>
            <li>exam purchase or voucher;</li>
            <li>identification rules;</li>
            <li>accommodations;</li>
            <li>exam content and security;</li>
            <li>rescheduling and cancellation rules;</li>
            <li>scoring and results;</li>
            <li>retesting and certification decisions;</li>
            <li>candidate data and retention.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            You may need to create an account and purchase the examination directly from the sponsor before
            reserving a seat at LBS.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            When sponsor rules conflict with these Terms, sponsor rules control for the examination.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Pearson VUE, Certiport, PMI, and other third-party names and trademarks referenced on this site are the
            property of their respective owners. Their use here identifies the examinations administered at LBS and
            does not imply any sponsorship of, or affiliation with, LBS beyond LBS's role as an authorized testing
            location.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. LBS Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS facility, seat, booking, bootcamp, or service fees may be separate from sponsor exam or voucher
            fees. Prices and refund rules shown before payment control.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            A Certiport seat fee may be advertised separately from the exam voucher.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Appointments</h2>
          <p className="text-muted-foreground leading-relaxed">
            Provide accurate information and arrive by the stated time. Bring all confirmations and required
            original identification.
          </p>
          <p className="text-muted-foreground leading-relaxed">LBS may deny or delay service when:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>identification is insufficient;</li>
            <li>eligibility is not confirmed;</li>
            <li>the candidate is late;</li>
            <li>payment is incomplete;</li>
            <li>equipment or sponsor systems are unavailable;</li>
            <li>safety, security, or conduct rules are violated.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Candidate Conduct and Exam Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Candidates must comply with sponsor and LBS rules. Prohibited conduct includes:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>bringing unauthorized items;</li>
            <li>copying, recording, discussing, reproducing, or removing exam content;</li>
            <li>receiving or providing unauthorized assistance;</li>
            <li>impersonation;</li>
            <li>tampering with equipment;</li>
            <li>disruptive, threatening, discriminatory, or abusive conduct.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            LBS may stop an exam, remove a person, preserve evidence, and report an incident to the sponsor or
            authorities.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Surveillance and Proctoring</h2>
          <p className="text-muted-foreground leading-relaxed">
            Testing areas may be observed or recorded as required by exam sponsors or security procedures. Sponsor
            systems may collect video, audio, screen, identity, incident, and test-session information.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not control sponsor retention or scoring decisions. Review the Candidate Rules and Surveillance
            Notice.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. Scores and Certifications</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not determine official scores, pass/fail standards, eligibility, license issuance,
            certification, or score appeals. Direct disputes to the sponsor or regulator.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Bootcamps</h2>
          <p className="text-muted-foreground leading-relaxed">
            Bootcamps and tutoring are educational services only. Attendance does not guarantee passing.
            Registration does not include an official exam appointment unless expressly stated.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">9. Notary Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            The commissioned notary, not LBS as a corporate entity, performs the official act.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The signer must personally appear as required, present satisfactory identification, understand the
            document, and act willingly. The notary may refuse an act when legal or ethical requirements are not
            satisfied.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LBS and the notary do not select forms, prepare legal documents, explain legal consequences, or provide
            legal advice. A notarial act does not prove that a document is truthful, valid, enforceable, or legally
            sufficient.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Required notary records may be public information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">10. Passport and Visa Photos</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will use reasonable efforts to produce photographs consistent with the customer's stated application
            type. The receiving government or organization makes the final acceptance decision.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The customer is responsible for confirming current size, age, background, clothing, digital, printing,
            and submission requirements. Acceptance is not guaranteed.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">11. Website Assistance</h2>
          <p className="text-muted-foreground leading-relaxed">
            Website and business-support services assist with preparation and presentation. LBS does not guarantee
            customers, revenue, search ranking, legal compliance, accessibility compliance, or business outcomes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Customers are responsible for the truth and legality of submitted and published content.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">12. Temporary Documents and Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will use customer files only to perform the requested service, troubleshoot, process payment, and
            comply with law. Customers should avoid unnecessary sensitive information.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            See the Corporate Privacy Policy and Business-Center Document Handling Notice.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">13. Payment</h2>
          <p className="text-muted-foreground leading-relaxed">
            Payment is due as shown at booking or service. Taxes and third-party fees may be additional.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            LBS may require deposits or full prepayment for custom, high-volume, or special-order work.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">14. Cancellations and Refunds</h2>
          <p className="text-muted-foreground leading-relaxed">
            The LBS4 Booking and Cancellation Policy is incorporated into these Terms. Sponsor fees may be
            non-refundable or governed solely by the sponsor.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">15. Personal Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is not responsible for unattended property except to the extent caused by LBS's failure to use
            reasonable care. Candidates must follow locker and prohibited-item rules.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">16. Conduct and Safety</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS may refuse service or remove anyone who threatens safety, disrupts operations, harasses others,
            damages property, violates law, or violates sponsor rules.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">17. Accessibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            Contact LBS regarding physical-service accommodations. Examination accommodations generally require
            advance sponsor approval.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">18. Disclaimers</h2>
          <p className="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SERVICES ARE PROVIDED "AS IS." LBS DOES NOT WARRANT EXAM RESULTS,
            GOVERNMENT ACCEPTANCE, LEGAL SUFFICIENCY, OR BUSINESS RESULTS.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">19. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is not liable for indirect, incidental, consequential, special, exemplary, or punitive damages,
            missed opportunities, lost wages, travel expenses, licensing delays, or sponsor decisions.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For a direct claim, LBS's aggregate liability will not exceed the amount paid to LBS for the specific
            service giving rise to the claim, except where law prohibits this limitation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">20. Governing Law and Venue</h2>
          <p className="text-muted-foreground leading-relaxed">
            Texas law governs. Disputes must be brought in state or federal courts located in Harris County, Texas,
            subject to non-waivable rights.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">21. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS may update these Terms prospectively. The terms displayed and accepted at booking apply to that
            transaction.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">22. Contact</h2>
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
