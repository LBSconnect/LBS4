import { Link } from "wouter";
import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { FileSignature, AlertTriangle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYER_BASE_ROUTE } from "@/lib/employerServices";

// Agreement version + effective date live here, in one place, so every
// reference on this page (and the eventual client-acceptance record) stays
// in sync. Bump AGREEMENT_VERSION whenever the substantive terms below
// change; do not edit already-accepted client records to match a later
// version (see i9_client_agreements.documentVersion server-side).
export const AGREEMENT_VERSION = "1.0";
const EFFECTIVE_DATE = "August 7, 2026";

export default function ServiceAgreement() {
  return (
    <>
      <SEO
        title="New-Hire Verification Services Agreement"
        canonical="/employer-services/new-hire-verification/agreement"
        description="Review the Linton Business Solutions LLC agreement governing employer E-Verify Employer Agent services and Form I-9 support for New-Hire Verification clients."
        noIndex
      />
      <LegalPageLayout
        icon={FileSignature}
        title="New-Hire Verification & Form I-9 Support Services Agreement"
        meta={`Linton Business Solutions LLC · Version ${AGREEMENT_VERSION} · Effective ${EFFECTIVE_DATE}`}
      >
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
          <p className="text-muted-foreground leading-relaxed">
            This New-Hire Verification &amp; Form I-9 Support Services Agreement ("Agreement") governs the
            administrative employment-eligibility verification and Form I-9 support services that{" "}
            <strong>Linton Business Solutions LLC</strong> ("LBS"), 616 FM 1960 Road West, Suite 101, Houston, Texas
            77090, provides to the employer client identified on the signature page or in LBS's client-enrollment
            records ("Client"). This Agreement distinguishes among three roles: the Client as employer, LBS acting
            as Client's E-Verify Employer Agent, and — only when separately requested — LBS acting as Client's
            Form I-9 Authorized Representative. LBS does not become Client's employer and does not assume Client's
            statutory employment responsibilities in any of these roles.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Nature and Scope of Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS provides administrative employment-eligibility verification support. When applicable, and only
            after Client has completed all required E-Verify enrollment steps, LBS may act as Client's{" "}
            <strong>E-Verify Employer Agent</strong> for the purpose of creating and managing E-Verify cases on
            Client's behalf. When separately requested by Client, LBS may act as Client's designated{" "}
            <strong>Form I-9 Authorized Representative</strong> for the purpose of physically or otherwise lawfully
            examining Client's new hires' identity and employment-eligibility documents and completing the
            employer/authorized-representative portion of Form I-9.
          </p>
          <p className="text-muted-foreground leading-relaxed">In performing these services, LBS does not:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1.5">
            <li>Act as the employer of Client's workers;</li>
            <li>Make hiring decisions on Client's behalf;</li>
            <li>Make termination, suspension, or discipline decisions on Client's behalf;</li>
            <li>Determine compensation;</li>
            <li>Determine an individual's immigration status;</li>
            <li>Provide immigration legal advice; or</li>
            <li>Make final employment-eligibility decisions outside the official E-Verify or Form I-9 process.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            The specific services Client has selected are identified by checkbox or attached order form and may
            include monthly E-Verify case management, Form I-9 administrative support, in-office document
            examination, mobile document examination, hiring-event support, Form I-9 file review, and manager
            training. Client will pay the plan fee or pay-as-you-go rates in effect on the LBS employer-services
            pricing page or attached order form at the time of enrollment, currently published at{" "}
            <Link href={EMPLOYER_BASE_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">
              lbs4.com/employer-services/new-hire-verification
            </Link>
            , plus any applicable one-time setup fee.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Client Responsibilities</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client remains legally responsible for its own Form I-9 obligations and for all employment decisions.
            Client agrees to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-1.5">
            <li>Provide accurate employee and company information to LBS;</li>
            <li>Provide that information to LBS early enough for LBS to meet applicable deadlines;</li>
            <li>Ensure a valid job offer has been accepted before initiating any pre-employment verification activity;</li>
            <li>Follow applicable Form I-9 requirements and E-Verify rules;</li>
            <li>Follow applicable anti-discrimination laws;</li>
            <li>Provide required notices to employees;</li>
            <li>Make all hiring, termination, suspension, compensation, and other employment decisions;</li>
            <li>Maintain required Form I-9 and verification records, unless Client has separately engaged LBS in writing for record-retention services; and</li>
            <li>Promptly inform LBS of any errors in information Client has already submitted.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            LBS is not responsible for deadlines missed because Client submitted information late, incomplete, or
            inaccurate.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. E-Verify Enrollment and Memorandum of Understanding</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client's use of LBS's E-Verify Employer Agent services is conditioned on Client completing the required
            E-Verify enrollment and execution of the applicable DHS/USCIS E-Verify Memorandum of Understanding
            ("MOU"). LBS will not create E-Verify cases for Client until that enrollment is active. Client agrees
            to comply with the applicable E-Verify MOU, the current E-Verify rules, the current E-Verify User
            Manual, and applicable DHS and USCIS requirements. Where a mandatory E-Verify requirement conflicts
            with a provision of this Agreement concerning participation in E-Verify, the mandatory E-Verify
            requirement governs.
          </p>
        </div>

        <div className="space-y-4 border-l-4 border-amber-400 pl-5 py-1">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. No Applicant Prescreening</h2>
          <p className="text-muted-foreground leading-relaxed">
            E-Verify may not be used by Client or LBS to prescreen job applicants before it is legally permitted.
            Client may not send applicants to LBS merely to determine whether they appear eligible to work before a
            hiring decision is made. All verification requests must follow the legally permitted Form I-9 and
            E-Verify workflow, which requires a Form I-9 to be completed and a job offer accepted before an E-Verify
            case is created.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Form I-9 Process and Timing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Client is responsible for ensuring that Form I-9 steps occur within the time period required by
            applicable federal law and current Form I-9 and E-Verify requirements. Client must submit accurate
            information to LBS early enough for LBS to perform requested services within those deadlines. Delays
            caused by Client's late, incomplete, or inaccurate submissions may affect case timing and are Client's
            responsibility.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Document Choice and Non-Discrimination</h2>
          <p className="text-muted-foreground leading-relaxed">
            Neither LBS nor Client may demand that an employee present a particular Form I-9 document (for example,
            specifically demanding a driver's license, a Social Security card, or a Permanent Resident Card),
            require more documents than Form I-9 requires, or reject a document that reasonably appears genuine and
            relates to the employee presenting it because of the employee's citizenship, immigration status,
            national origin, or nationality. Employees choose which acceptable documentation to present from the
            current Form I-9 Lists of Acceptable Documents, and that choice is respected throughout LBS's process.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. E-Verify Mismatches and Employee Rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            An E-Verify mismatch or Tentative Nonconfirmation does not automatically mean an employee is unauthorized
            to work. When E-Verify returns a result requiring action, LBS will notify Client and provide the
            available E-Verify documentation and procedural instructions. Client is responsible for timely and
            privately providing all required notices to the affected employee and for allowing the employee the
            rights and response period permitted under E-Verify rules. Client may not take a prohibited adverse
            action against an employee solely because the employee received a Tentative Nonconfirmation or is
            timely contesting a mismatch through the applicable E-Verify process.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Government Program Disclosure</h2>
          <p className="text-muted-foreground leading-relaxed">
            E-Verify is a federal employment-verification program operated by the U.S. Department of Homeland
            Security in partnership with the Social Security Administration, and is available directly to eligible
            participating employers without an E-Verify usage fee. Fees charged by LBS are for LBS's professional
            administrative services — enrollment assistance, case creation, case management, deadline tracking,
            reporting, Form I-9 support, client support, and related services. Fees paid to LBS are not E-Verify
            access fees and are not fees imposed by DHS, USCIS, SSA, or E-Verify.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">9. No Government Endorsement</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is an independent private company and is not a government agency. LBS's services are not sponsored,
            endorsed, certified, approved, or recommended by DHS, USCIS, SSA, or E-Verify. Where accurate and
            supported by LBS's current enrollment, LBS may state that it participates in E-Verify as an E-Verify
            Employer Agent — this statement describes LBS's enrollment status only and is not a claim of government
            endorsement or certification.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">10. Confidentiality and Employee Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            These services may involve sensitive employee information, which can include full legal names, home
            addresses, dates of birth, Social Security numbers, citizenship or immigration attestations, Alien
            Registration Numbers, USCIS Numbers, I-94 information, passport information, Employment Authorization
            Documents, other identity documents, Form I-9 information, E-Verify case information and case numbers,
            and employee contact information. LBS will use this information only as reasonably necessary to
            provide the contracted services, perform E-Verify functions, perform requested Form I-9 services,
            maintain legally or operationally necessary records, protect its systems, and comply with applicable
            law. LBS will not sell employee verification data, use it for advertising, use it for unrelated
            profiling, or sell Social Security numbers or identity-document information.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">11. Secure Data Transmission</h2>
          <p className="text-muted-foreground leading-relaxed">
            Both parties will handle employee information privately and securely and limit access to authorized
            personnel. This public website's forms do not collect employee Form I-9 data, Social Security numbers,
            or identity-document copies. Where LBS's secure client portal is available, employers and employees
            should submit Social Security numbers, passport or identity-document scans, Employment Authorization
            Documents, completed Form I-9s, and other sensitive verification information through that secure
            channel — not by ordinary, unsecured email.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">12. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS maintains administrative, technical, and physical safeguards reasonably appropriate to the
            sensitivity of employee verification information, which may include access controls, authentication,
            role-based access, restricted employee access, secure transmission, system monitoring, and encryption
            where applicable. No method of storage or transmission is completely secure, and LBS does not
            guarantee that its systems are invulnerable to unauthorized access.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">13. Security Incident Notification</h2>
          <p className="text-muted-foreground leading-relaxed">
            If LBS discovers unauthorized access to Client employee information that constitutes, or is reasonably
            suspected to constitute, a security incident, LBS will investigate the incident, take reasonable
            mitigation measures, notify Client as required by applicable law (including applicable Texas data-security
            and breach-notification requirements), and cooperate with Client regarding any legally required
            notification obligations.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">14. Form I-9 and Verification Records</h2>
          <p className="text-muted-foreground leading-relaxed">
            Unless separately agreed in writing, Client remains the official custodian of its Forms I-9, remains
            responsible for legally required retention, and remains responsible for producing its records to
            government agencies when legally required. LBS may maintain copies, audit records, case documentation,
            transaction records, and verification records reasonably necessary to perform its services, document
            its performance, comply with E-Verify requirements, resolve disputes, or satisfy applicable law. LBS
            does not undertake to permanently retain Form I-9 or identity records on Client's behalf, and may
            securely delete employee information once it is no longer reasonably required for the contracted
            services, legal compliance, E-Verify obligations, security, billing disputes, or recordkeeping
            obligations — subject to any longer retention period required by applicable law.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">15. Fees and Payment Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            Fees described above and on the LBS employer-services pricing page are for LBS's professional
            verification and Form I-9 support services — not for access to E-Verify itself. Recurring plan fees are
            billed on the cycle disclosed at enrollment; pay-as-you-go and additional-case charges are billed as
            incurred. Invoices are due upon receipt unless otherwise stated at enrollment. LBS may suspend services
            for accounts more than 15 days past due, after written notice, without waiving any other remedy. Fees
            already earned for services performed are non-refundable; setup fees are non-refundable once
            enrollment work has begun. Client is responsible for any applicable sales, use, or similar taxes on
            LBS's fees, exclusive of taxes on LBS's own income. If Client disputes an invoice in good faith, Client
            will notify LBS in writing within 15 days of the invoice date and pay any undisputed portion; the
            parties will work in good faith to resolve the disputed portion. Failed or reversed payments may be
            re-presented and may incur a reasonable processing charge. This section does not, by itself, create a
            subscription commitment beyond the plan Client has selected.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">16. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, neither party will be liable to the other for indirect,
            incidental, special, punitive, or consequential damages, or for lost profits or lost business, arising
            out of or relating to this Agreement, even if advised of the possibility of such damages. Except for
            the carve-outs below, LBS's total aggregate liability to Client for claims arising out of or relating
            to this Agreement will not exceed the fees actually paid by Client to LBS for the services giving rise
            to the claim during the 12 months preceding the event giving rise to liability. These limitations do
            not apply to, and are not intended to limit liability for, fraud, willful misconduct, LBS's material
            unauthorized disclosure of Client's confidential employee information in violation of Section 10, or
            any liability that cannot lawfully be limited or excluded.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">17. Indemnification</h2>
          <p className="text-muted-foreground leading-relaxed">
            <strong>Client will indemnify, defend, and hold harmless LBS</strong> from third-party claims arising
            out of: Client's employment decisions; Client's discriminatory conduct; improper termination or other
            adverse action; Client's prescreening of applicants in violation of Section 4; Client's failure to
            provide required notices to employees; false or inaccurate information Client provided to LBS; Client
            instructions that violate E-Verify rules; Client's failure to meet a legal deadline where caused by
            Client's own late, incomplete, or inaccurate submissions; or Client's misuse of LBS's services.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong>LBS will indemnify, defend, and hold harmless Client</strong> from third-party claims directly
            arising out of LBS's willful misconduct, LBS's material unauthorized disclosure of Client's
            confidential information, or LBS's material breach of its confidentiality obligations under Section
            10.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The indemnifying party's obligations are conditioned on the indemnified party providing prompt written
            notice of the claim, reasonable cooperation, and control of the defense (with the indemnified party
            entitled to participate at its own expense).
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">18. No Legal or Immigration Advice</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS provides administrative verification and Form I-9 support services only. LBS is not acting as
            Client's legal counsel, does not practice law, and does not provide immigration legal advice. Client
            should obtain advice from qualified legal counsel regarding unusual employment, immigration,
            discrimination, or Form I-9 compliance questions.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">19. No Guarantee of a Particular Case Result</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not guarantee any particular E-Verify case result, processing time, or outcome. Case results
            depend on the information submitted and on government systems and processes outside LBS's control.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">20. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            Either party may terminate this Agreement for convenience on 30 days' written notice. LBS may
            terminate or suspend services immediately on written notice for Client's nonpayment beyond the period
            described in Section 15, material breach, instructions that would require LBS to violate E-Verify
            rules or applicable law, or a genuine security concern involving Client's account. Termination does not
            relieve Client of the obligation to pay fees for services already performed.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Termination does not automatically close E-Verify cases already initiated. Where legally permissible,
            LBS may complete reasonable ministerial steps necessary to properly close, document, or transfer
            responsibility for cases already opened before termination, and will provide Client with the case
            records reasonably necessary for Client's ongoing compliance, subject to applicable legal and security
            restrictions. If LBS's own E-Verify enrollment or Employer Agent status is suspended or terminated by
            the government, LBS will notify Client promptly and reasonably assist Client's transition to another
            method of E-Verify participation.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">21. Force Majeure and Government System Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is not responsible for delay or failure to perform caused by matters outside its reasonable
            control, including E-Verify, DHS, or SSA system outages; government shutdowns; internet or utility
            outages; cyber incidents outside LBS's reasonable control; natural disasters; or changes to government
            rules governing E-Verify or Form I-9. LBS will use commercially reasonable efforts to resume
            performance once the condition causing the delay ends.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">22. Independent Contractor</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS is an independent contractor. Nothing in this Agreement creates an employment relationship, a
            general agency relationship, a partnership, a joint venture, or a fiduciary relationship between the
            parties. LBS's limited role as E-Verify Employer Agent, and, where separately requested, as Form I-9
            Authorized Representative, does not create any broader authority for LBS to bind Client.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">23. Governing Law and Venue</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Agreement is governed by the laws of the State of Texas, without regard to conflict-of-law
            principles. The parties consent to the exclusive jurisdiction and venue of the state and federal courts
            located in Harris County, Texas for any dispute arising out of or relating to this Agreement. Nothing
            in this Agreement alters any right or protection that Client or its employees have under federal law
            governing Form I-9, E-Verify, employment discrimination, or immigration, which controls to the extent
            of any conflict.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">24. Electronic Signatures and Records</h2>
          <p className="text-muted-foreground leading-relaxed">
            The parties agree that this Agreement may be executed electronically and that electronic signatures
            and records are valid and binding to the same extent as handwritten signatures and paper records, as
            permitted by applicable law. By checking the acknowledgment box on LBS's enrollment or client-portal
            acceptance flow, Client's authorized signer certifies that they are authorized to bind the company
            identified in LBS's enrollment records and that they have read and agree to this Agreement.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">25. Entire Agreement</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Agreement, together with the applicable order form, pricing page, and any signed addenda,
            constitutes the entire agreement between the parties regarding its subject matter and supersedes prior
            proposals or understandings, written or oral. It may be amended only by a writing signed (including
            electronically) by both parties, except that LBS may update this Agreement's terms prospectively for
            future services with reasonable notice to Client, and update the LBS employer-services pricing page
            for future billing periods. A party's failure to enforce a provision is not a waiver of that provision.
            If any provision of this Agreement is held unenforceable, the remaining provisions remain in full force
            and effect, and the unenforceable provision will be reformed to the minimum extent necessary to make it
            enforceable. Client may not assign this Agreement without LBS's written consent; LBS may assign this
            Agreement in connection with a merger, acquisition, or sale of substantially all of its assets. Notices
            under this Agreement will be sent to the contact information on file in LBS's enrollment records.
            Sections 10 (Confidentiality), 14 (Records), 16 (Limitation of Liability), 17 (Indemnification), 18 (No
            Legal Advice), 20 (Termination — as to already-opened cases), and 23 (Governing Law) survive
            termination. This Agreement may be executed in counterparts, including electronic counterparts, each of
            which is deemed an original.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">26. Contact Information</h2>
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

        <div className="flex items-start gap-3 bg-muted/30 border border-border/50 rounded-lg p-5 print:hidden">
          <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            LBS does not provide immigration legal advice and this page is not a substitute for advice from
            qualified legal counsel. Employer clients enrolling with LBS accept the version of this Agreement in
            effect at the time of their electronic acceptance in the LBS client portal; that acceptance record —
            not this public page — is the authoritative record of what a given client agreed to.
          </p>
        </div>
      </LegalPageLayout>
    </>
  );
}
