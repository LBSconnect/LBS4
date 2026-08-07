import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Privacy Policy"
        canonical="/privacy-policy"
        description="Privacy Policy for Linton Business Solutions LLC (LBS), covering lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com. How we collect, use, disclose, retain, and protect information."
      />
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Shield className="w-4 h-4 text-[#FF2D55]" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Privacy Policy
          </h1>
          <p className="text-white/80">
            Version 1.0 &nbsp;·&nbsp; Effective Date: July 30, 2026 &nbsp;·&nbsp; Last Updated: August 7, 2026
          </p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                Linton Business Solutions LLC ("LBS," "we," "us," or "our") respects privacy and is committed to
                handling personal information responsibly. This Privacy Policy explains how we collect, use,
                disclose, retain, and protect information through:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>lbsconnect.net</li>
                <li>myeasypass.net</li>
                <li>workabeez.net</li>
                <li>lbs4.com</li>
                <li>related applications, forms, communications, appointments, and in-person services that link to this Policy</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                This Policy does not replace privacy notices issued by testing sponsors, employers, government
                agencies, payment processors, or other organizations that independently determine how they use
                information.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Who We Are</h2>
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
                LBS operates several distinct services. Our role may differ depending on the service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>For corporate inquiries, purchases, appointments, and direct customer relationships, LBS generally determines why and how information is used.</li>
                <li>For employee information processed through Work-A-Beez on behalf of a subscribing employer, the employer generally controls the information and LBS processes it under the employer's instructions.</li>
                <li>For testing services, a testing sponsor may independently control candidate registration, eligibility, identification, exam delivery, scores, proctoring information, and retention.</li>
                <li>A commissioned notary controls the notarial record the notary is legally required to maintain.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. Information We Collect</h2>

              <h3 className="text-lg font-semibold">3.1 Information You Provide Directly</h3>
              <p className="text-muted-foreground leading-relaxed">Depending on the service, we may collect:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>name, email address, telephone number, mailing address, and organization</li>
                <li>account credentials and account preferences</li>
                <li>billing contact and transaction information</li>
                <li>appointment, reservation, attendance, and service-selection information</li>
                <li>messages, customer-support requests, survey responses, and feedback</li>
                <li>files, documents, photographs, or other content you submit</li>
                <li>consulting intake details and confidential project information</li>
                <li>practice answers, mock-exam results, study progress, and course activity</li>
                <li>employer, administrator, employee, contractor, schedule, time, attendance, PTO, payroll-related, pay-stub, message, performance, and recognition information</li>
                <li>government-issued identification information required for testing or notarial services</li>
                <li>passport or visa photographs</li>
                <li>information entered into notarial records as required by law</li>
                <li>information contained in documents or files presented for passport photos, website design, or similar services</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">3.2 Information Collected Automatically</h3>
              <p className="text-muted-foreground leading-relaxed">Our websites and applications may collect:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>IP address</li>
                <li>browser and device type</li>
                <li>operating system</li>
                <li>referring page</li>
                <li>pages or screens viewed</li>
                <li>timestamps and session information</li>
                <li>login history</li>
                <li>device authorization information</li>
                <li>error, diagnostic, performance, and security logs</li>
                <li>cookie and similar technology identifiers</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6">3.3 Payment Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                Payments may be processed by third-party payment processors, including Stripe where implemented.
                LBS generally does not receive or store full payment-card numbers, CVV codes, or full bank
                credentials. We may receive transaction identifiers, billing contact information, card type, last
                four digits, payment status, subscription status, refunds, chargebacks, and related records.
              </p>

              <h3 className="text-lg font-semibold mt-6">3.4 Sensitive Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                Depending on the service, information may include government identification, precise work records,
                employment-related data, private documents, or other information that may be sensitive.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The current Work-A-Beez design is described as PIN-based and restricted to authorized devices. This
                Policy does not authorize collection of fingerprints, face geometry, voiceprints, retina or iris
                scans, or precise geolocation. LBS will not introduce biometric or precise-location collection
                without completing legal review, updating notices, and obtaining any required consent.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. How We Use Information</h2>
              <p className="text-muted-foreground leading-relaxed">We may use information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>provide, operate, maintain, and secure our websites, applications, and services</li>
                <li>create and administer accounts</li>
                <li>authenticate users and authorized devices</li>
                <li>process purchases, subscriptions, appointments, reservations, and refunds</li>
                <li>deliver digital products, courses, study tools, and consulting services</li>
                <li>administer practice tests and display study progress</li>
                <li>support workforce scheduling, timekeeping, attendance, PTO, payroll-related reporting, messages, and analytics</li>
                <li>coordinate testing-center appointments and comply with testing-sponsor requirements</li>
                <li>perform notarial acts and maintain legally required records</li>
                <li>prepare passport photographs and perform business-center document services</li>
                <li>respond to questions and provide support</li>
                <li>send transactional notices, security alerts, service messages, and account communications</li>
                <li>send marketing communications where permitted and subject to opt-out rights</li>
                <li>prevent fraud, abuse, unauthorized access, and security incidents</li>
                <li>troubleshoot, analyze performance, and improve products</li>
                <li>create aggregated or deidentified information</li>
                <li>enforce agreements</li>
                <li>comply with legal, accounting, tax, regulatory, testing, and contractual obligations</li>
                <li>establish, exercise, or defend legal claims</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                We do not use employer-controlled Work-A-Beez employee data to advertise products to employees.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Website- and Service-Specific Practices</h2>

              <h3 className="text-lg font-semibold">5.1 LBSconnect.net</h3>
              <p className="text-muted-foreground leading-relaxed">
                LBSconnect may collect information from consulting prospects, government and commercial clients,
                subcontractors, digital-product purchasers, course participants, newsletter subscribers, and website
                visitors.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Project information may be governed by a separate nondisclosure agreement, master services
                agreement, statement of work, purchase order, subcontract, or government contract. When those
                documents impose stricter confidentiality or data-handling requirements, those requirements control.
              </p>

              <h3 className="text-lg font-semibold mt-6">5.2 MyEasyPass.net</h3>
              <p className="text-muted-foreground leading-relaxed">
                MyEasyPass may collect account data, purchases, practice answers, scores, timing, topic performance,
                study history, language preferences, and bootcamp-related information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Practice scores are educational indicators only and are not official licensing-exam results. LBS
                does not control official eligibility, testing, scoring, licensing, or certification decisions.
              </p>

              <h3 className="text-lg font-semibold mt-6">5.3 Work-A-Beez.net</h3>
              <p className="text-muted-foreground leading-relaxed">
                Work-A-Beez customers may upload and manage employee and contractor information. For this
                information:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>the customer determines what information is entered and why it is processed;</li>
                <li>the customer is responsible for providing employee notices and obtaining required permissions;</li>
                <li>LBS processes the information to provide the service, secure it, support users, comply with law, and follow documented customer instructions;</li>
                <li>users seeking access, correction, or deletion of employer-controlled information should normally contact their employer first.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                LBS separately controls business-contact, billing, security, support, and account-relationship
                information used for its own legitimate business operations.
              </p>

              <h3 className="text-lg font-semibold mt-6">5.4 LBS4.com and Physical Services</h3>
              <p className="text-muted-foreground leading-relaxed">
                LBS4 may collect appointment, payment, communication, identification, service, and transaction
                information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Testing sponsors may separately collect and control candidate accounts, exam eligibility,
                identification, test delivery, scores, incident reports, and monitoring information. Their privacy
                notices and candidate rules also apply.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For traditional notarial acts, the commissioned notary must maintain a record book containing
                information required by Texas law. Notary records may be public records. LBS does not provide legal
                advice and does not decide whether a document is legally sufficient.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For passport photos and business-center documents, LBS seeks to retain files only as long as
                reasonably necessary to complete the requested service, troubleshoot immediate service issues,
                process payment, and satisfy legal obligations. See the Business-Center Document Handling Notice.
              </p>

              <h3 className="text-lg font-semibold mt-6">5.5 Employment Verification Services (New-Hire Verification &amp; Form I-9 Support)</h3>
              <p className="text-muted-foreground leading-relaxed">
                LBS's New-Hire Verification &amp; Form I-9 Support services may involve processing sensitive
                employment-eligibility information on behalf of employer clients, including full legal names, home
                addresses, dates of birth, Social Security numbers, citizenship or immigration attestations, Alien
                Registration Numbers, USCIS Numbers, I-94 information, passport information, Employment
                Authorization Documents, other government-issued identity documents, Form I-9 information, and
                E-Verify case information and case numbers.
              </p>
              <p className="text-muted-foreground leading-relaxed">For this category of information:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>the employer client determines what employee information is submitted and remains the employer of record and the custodian responsible for its own Form I-9 compliance;</li>
                <li>LBS acts as the employer's E-Verify Employer Agent and, when separately requested, as the employer's Form I-9 Authorized Representative — LBS does not make hiring, termination, compensation, or other employment decisions, and does not provide immigration legal advice;</li>
                <li>LBS uses this information only as reasonably necessary to provide the contracted services, perform E-Verify functions, perform requested Form I-9 services, maintain legally or operationally necessary records, protect its systems, and comply with applicable law;</li>
                <li>LBS does not sell this information, use it for advertising, use it for unrelated profiling, or sell Social Security numbers or identity-document information;</li>
                <li>sensitive verification information is intended to be submitted through LBS's secure employer portal rather than by ordinary, unsecured email;</li>
                <li>LBS maintains administrative, technical, and physical safeguards reasonably appropriate to the sensitivity of this information, described further in Section 10 (Security) below;</li>
                <li>if LBS discovers unauthorized access to this information constituting, or reasonably suspected to constitute, a security incident, LBS will investigate, take reasonable mitigation measures, and notify affected parties as required by applicable law, including applicable Texas data-security and breach-notification requirements;</li>
                <li>the employer client remains responsible for legally required Form I-9 and E-Verify recordkeeping and for producing its records to government agencies when legally required; LBS may separately maintain copies, audit records, case documentation, and verification records reasonably necessary to perform its services, document its performance, comply with E-Verify requirements, resolve disputes, or satisfy applicable law, and may securely delete such information once it is no longer reasonably required for those purposes, subject to any longer retention period required by law;</li>
                <li>information about this service's terms — including the distinction between LBS's role and an employer's own responsibilities, and LBS's government-program-fee disclosures — is set out in the New-Hire Verification &amp; Form I-9 Support Services Agreement, which does not conflict with this Policy;</li>
                <li>an employee or job applicant whose information is processed through this service and who has questions about it should generally contact their prospective or current employer first, since the employer controls the underlying employment relationship and instructs LBS's processing on their behalf.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                E-Verify is a federal program operated by the U.S. Department of Homeland Security in partnership
                with the Social Security Administration. LBS is an independent private company, is not a government
                agency, and is not sponsored, endorsed, certified, approved, or recommended by DHS, USCIS, SSA, or
                E-Verify; where accurate and supported by its current enrollment, LBS may state that it
                participates in E-Verify as an E-Verify Employer Agent.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Cookies and Similar Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">We may use:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>essential cookies for security, authentication, checkout, and core functionality;</li>
                <li>preference cookies to remember settings;</li>
                <li>analytics technologies to understand site and application performance;</li>
                <li>security technologies to detect fraud and abuse.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Additional details appear in the Corporate Cookie Policy.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. How We Disclose Information</h2>
              <p className="text-muted-foreground leading-relaxed">We may disclose information to:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>cloud hosting, database, storage, and infrastructure providers</li>
                <li>authentication and security providers</li>
                <li>payment processors</li>
                <li>email and communication providers</li>
                <li>analytics, diagnostics, and performance providers</li>
                <li>customer support and scheduling providers</li>
                <li>professional advisers, insurers, auditors, and contractors</li>
                <li>testing sponsors and certification organizations</li>
                <li>government agencies, courts, regulators, and law enforcement where legally required</li>
                <li>a buyer, successor, lender, investor, or adviser in a proposed or completed corporate transaction</li>
                <li>other parties at your direction or with your permission</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Service providers are permitted to receive information only for legitimate service purposes and
                should be subject to appropriate confidentiality and security obligations.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell personal information for money.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Aggregated and Deidentified Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may create and use aggregated or deidentified information for analytics, product improvement,
                capacity planning, security, benchmarking, and business operations. We will take reasonable measures
                designed to prevent deidentified data from being associated with an identifiable person and will not
                knowingly attempt to reidentify it except as permitted by law to test deidentification safeguards.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">9. Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain information for periods reasonably necessary for the purposes described in this Policy,
                considering:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>the duration of the account or customer relationship</li>
                <li>the sensitivity and volume of the information</li>
                <li>legal, tax, accounting, employment, testing, notary, and contractual requirements</li>
                <li>security, backup, fraud-prevention, and dispute-resolution needs</li>
                <li>customer instructions where LBS acts as a processor</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">Examples:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>transaction and tax records may be retained for legally and operationally appropriate periods;</li>
                <li>Work-A-Beez customer data may be retained during the subscription and for a limited export or recovery period after termination;</li>
                <li>employer payroll and time records should be retained according to the employer's legal obligations and configured retention requirements;</li>
                <li>traditional notary records are retained by the commissioned notary as required by Texas law;</li>
                <li>online-notary recordings, if offered, require separate statutory retention;</li>
                <li>passport-photo and document-service working files should ordinarily be deleted promptly after service completion;</li>
                <li>Form I-9 and E-Verify verification records processed through New-Hire Verification &amp; Form I-9 Support are retained only as long as reasonably necessary for those services, legal compliance, and E-Verify obligations, subject to the employer client's own independent Form I-9 recordkeeping duties (see Section 5.5);</li>
                <li>backups may persist for a limited cycle before being overwritten.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Detailed proposed periods appear in the Records Retention Schedule.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">10. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use administrative, technical, and physical safeguards designed to protect information. Measures
                may include access controls, authentication, encryption in transit, encryption at rest where
                appropriate, tenant separation, logging, backups, vendor management, employee confidentiality
                obligations, and incident-response procedures.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No system can guarantee absolute security. You are responsible for using strong credentials,
                protecting account access, maintaining secure devices, and promptly reporting suspected misuse.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">11. Your Privacy Choices and Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                Depending on your relationship with LBS and applicable law, you may request to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>know whether we process your personal information</li>
                <li>access or obtain a copy of certain information</li>
                <li>correct inaccurate information</li>
                <li>delete certain information</li>
                <li>opt out of marketing email or SMS</li>
                <li>opt out of qualifying targeted advertising, sale, or profiling if those activities occur</li>
                <li>appeal certain privacy-request decisions where required</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Submit requests to <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a> with the subject line "Privacy Request" or use the published Privacy Request Form.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We may verify identity before acting. Authorized agents may be required to provide proof of
                authority. We may deny or limit requests where permitted by law, including where we cannot verify
                identity, must retain the information, need it to provide a requested service, or process it solely
                on behalf of an employer or other customer.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For Work-A-Beez employee records controlled by an employer, contact the employer first. We will
                support the employer's response where contractually and legally required.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We will not discriminate against a person for exercising applicable privacy rights.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">12. Marketing Communications</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may unsubscribe from marketing email using the link in the message or by contacting us. You may
                opt out of marketing SMS by replying STOP, where available. Transactional, security, account,
                appointment, testing, and service messages may still be sent when necessary.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">13. Children and Minors</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our general online services are not directed to children under 13, and we do not knowingly allow
                children under 13 to independently create accounts or submit personal information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Testing services may be used by minors where permitted by a testing sponsor and authorized by a
                parent, guardian, school, or sponsoring organization. In those cases, information may be handled
                under the testing sponsor's rules and applicable law.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                MyEasyPass and paid account services are intended for adults unless an authorized parent, guardian,
                school, or organization establishes or supervises access.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you believe a child under 13 submitted information without appropriate authorization, contact us.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">14. International Users</h2>
              <p className="text-muted-foreground leading-relaxed">
                LBS operates from the United States. Information may be processed in the United States and other
                countries where service providers operate. Those countries may have different privacy laws. If
                international operations expand, LBS will implement additional contractual and transfer safeguards
                where required.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">15. Third-Party Links and Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our properties may link to third-party websites and services. We do not control their privacy
                practices. Review their notices before submitting information.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">16. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Policy to reflect legal, technical, or business changes. We will post the revised
                version and update the effective date. For material changes, we may provide additional notice
                through email, account notifications, checkout, or another appropriate method.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">17. Contact Us</h2>
              <div className="bg-muted/30 rounded-lg p-6 space-y-2">
                <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
                <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
                <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
                <p className="text-muted-foreground">Phone: 281-836-5357</p>
                <p className="text-muted-foreground">
                  Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
                </p>
                <p className="text-muted-foreground">For privacy requests, use the subject line "Privacy Request".</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
