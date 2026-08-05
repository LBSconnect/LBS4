import { Link } from "wouter";
import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { FileSignature, AlertTriangle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYER_BASE_ROUTE, EMPLOYER_INTAKE_ROUTE } from "@/lib/employerServices";

export default function ServiceAgreement() {
  return (
    <>
      <SEO
        title="LBS Employer Verification Services Agreement (Draft)"
        canonical="/employer-services/new-hire-verification/agreement"
        description="Draft service agreement template for LBS New-Hire Verification & Form I-9 Support: scope, fees, employer responsibilities, and billing terms. Legal review recommended before use."
        noIndex
      />
      <LegalPageLayout
        icon={FileSignature}
        title="LBS Employer Verification Services Agreement"
        meta="Draft Template · Version 0.1"
      >
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-5" data-testid="text-agreement-draft-warning">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-300">Draft business document — legal review recommended before use.</p>
            <p className="text-sm text-amber-800 dark:text-amber-400">
              This template is provided for internal planning purposes only. It has not been reviewed or approved
              by an attorney and is not a final, binding agreement until reviewed by qualified legal counsel and
              signed by both parties.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} data-testid="button-print-agreement">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
          <Link href={EMPLOYER_BASE_ROUTE}>
            <Button variant="ghost" size="sm" data-testid="button-back-to-employer-services">
              Back to New-Hire Verification &amp; Form I-9 Support
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Parties</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Agreement is between <strong>Linton Business Solutions LLC (LBS)</strong>, 616 FM 1960 Road West,
            Suite 101, Houston, Texas 77090, and the employer identified on the signature page or in the LBS
            client-enrollment records ("Client"). LBS is enrolled as an E-Verify Employer Agent and provides
            E-Verify case-management and Form I-9 administrative support for participating employers.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Services Selected</h2>
          <p className="text-muted-foreground leading-relaxed">
            The parties will identify, by checkbox or attached order form, the services Client has selected,
            which may include: monthly E-Verify case management, Form I-9 administrative support, in-office
            document examination, mobile document examination, hiring-event support, Form I-9 file review, and
            manager training.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. Monthly or Pay-As-You-Go Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client will pay the monthly plan fee or pay-as-you-go rates in effect on the LBS employer-services
            pricing page or attached order form at the time of enrollment. Current published rates are available
            at <Link href={EMPLOYER_BASE_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">lbs4.com/employer-services/new-hire-verification</Link>.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Setup Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            A one-time client setup fee applies to new client enrollment, as set out in the applicable plan or
            order form (for example, $99 for the Business plan).
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Additional-Case Charges</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cases processed beyond a plan's included monthly case volume are billed at the applicable
            additional-case rate for Client's selected plan.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Mobile Travel Charges</h2>
          <p className="text-muted-foreground leading-relaxed">
            Mobile document-examination appointments are billed at the applicable starting rate plus travel
            charges based on distance and scheduling.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. Client Responsibilities</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Timely and accurate delivery of Form I-9 information needed to create and manage E-Verify cases.</li>
            <li>Maintaining accurate company, hiring-location, and authorized-signer information.</li>
            <li>Cooperating with LBS on required E-Verify enrollment steps and the Memorandum of Understanding.</li>
            <li>Complying with all applicable Form I-9 and E-Verify recordkeeping and retention obligations.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Timely and Accurate Delivery of Form I-9 Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client is responsible for providing complete and accurate Form I-9 information to LBS on a schedule
            that allows LBS to create E-Verify cases within the applicable regulatory timeframe. Delays in
            information provided by Client may affect case timing and outcomes.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">9. Employee Privacy and Secure Communication</h2>
          <p className="text-muted-foreground leading-relaxed">
            Both parties will handle employee information privately and securely, limit access to authorized
            personnel, and use secure channels agreed upon by the parties for transmitting any employee
            information necessary to perform the Services. This public website's forms do not collect employee
            Form I-9 data, Social Security numbers, or identity-document copies; secure channels for that
            information are established separately during client onboarding.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">10. Authorized Representative Designation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Where Client selects in-person or mobile document examination, Client designates LBS personnel as
            Client's authorized representative solely for the purpose of physically examining Form I-9
            documents. Client remains responsible for Form I-9 compliance and for the actions of its designated
            authorized representative.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">11. E-Verify Client Enrollment</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will assist Client with enrollment as a participating client under LBS's E-Verify Employer Agent
            account, including collection of the business information required for enrollment.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">12. Memorandum of Understanding</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client acknowledges that participation in E-Verify requires execution of an E-Verify Memorandum of
            Understanding, and agrees to cooperate with LBS in completing the applicable enrollment steps.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">13. Record-Retention Responsibilities</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client remains responsible for retaining Form I-9 and related records for the period required by
            applicable law. LBS will provide case-number documentation to support Client's own recordkeeping.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">14. Mismatch Administration</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS will assist with the administrative process for Further Action Notices, referral paperwork,
            status tracking, and required employee communication steps. LBS does not determine immigration
            status and does not provide immigration legal advice.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">15. Prohibition Against Pre-Screening</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client agrees that E-Verify will not be used to pre-screen job applicants. Form I-9 must be completed
            and an offer of employment accepted before a case is created.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">16. Prohibition Against Discriminatory or Selective Verification</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client agrees to apply its verification process consistently for all new hires and agrees not to
            select employees for verification based on citizenship, immigration status, national origin, name,
            language, or appearance.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">17. No Legal Advice</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS provides administrative employer-support services only. LBS does not provide immigration legal
            advice, does not practice law, and does not determine an employee's immigration status. Client should
            consult qualified legal counsel regarding specific legal questions.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">18. No Guarantee of a Particular Case Result</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not guarantee any particular E-Verify case result, processing time, or outcome. Case results
            depend on information submitted and on government systems and processes outside LBS's control.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">19. No Government Endorsement</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is an independent private company and is not affiliated with, certified by, endorsed by, or
            acting on behalf of the U.S. Department of Homeland Security, U.S. Citizenship and Immigration
            Services, or E-Verify beyond its role as an enrolled E-Verify Employer Agent.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">20. Billing and Cancellation</h2>
          <p className="text-muted-foreground leading-relaxed">
            [Placeholder — billing cycle, invoicing method, late-payment terms, and cancellation notice period to
            be finalized by attorney review and business terms.]
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">21. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            [Placeholder — limitation-of-liability language to be drafted and finalized by attorney review.]
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">22. Indemnification (Marked for Attorney Review)</h2>
          <p className="text-muted-foreground leading-relaxed">
            [Placeholder — indemnification language to be drafted and finalized by attorney review before this
            Agreement is used with any client.]
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">23. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Agreement is governed by the laws of the State of Texas, without regard to conflict-of-law
            principles.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">24. Electronic Signatures</h2>
          <p className="text-muted-foreground leading-relaxed">
            The parties agree that this Agreement may be executed electronically and that electronic signatures
            are valid and binding to the same extent as handwritten signatures, as permitted by applicable law.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">25. Contact Information</h2>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090</p>
            <p className="text-muted-foreground">Phone: 281-836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-5 print:hidden">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-400">
            <strong>Reminder:</strong> this draft is not attorney-approved. Sections 20–22 in particular contain
            placeholders that require attorney drafting before this Agreement is signed by any client.
          </p>
        </div>
      </LegalPageLayout>
    </>
  );
}
