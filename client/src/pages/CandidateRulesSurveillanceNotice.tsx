import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { ShieldAlert } from "lucide-react";

export default function CandidateRulesSurveillanceNotice() {
  return (
    <>
      <SEO
        title="Candidate Rules and Surveillance Notice"
        canonical="/candidate-rules-surveillance-notice"
        description="LBS4 Candidate Rules and Surveillance Notice: what to bring, check-in, prohibited items, exam conduct, and monitoring in the testing center."
      />
      <LegalPageLayout
        icon={ShieldAlert}
        title="Candidate Rules and Surveillance Notice"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Before Arrival</h2>
          <p className="text-muted-foreground leading-relaxed">Candidates must:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>register with the examination sponsor;</li>
            <li>satisfy eligibility requirements;</li>
            <li>purchase any required exam or voucher;</li>
            <li>bring the exact identification required by the sponsor;</li>
            <li>arrive at least 15 minutes early or by the sponsor's stated time;</li>
            <li>review sponsor confirmation and candidate rules;</li>
            <li>arrange approved accommodations in advance.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Check-In</h2>
          <p className="text-muted-foreground leading-relaxed">LBS staff may:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>verify identity and appointment information;</li>
            <li>inspect permitted identification;</li>
            <li>obtain a signature, photograph, or digital confirmation element only where required and administered under the sponsor's approved system;</li>
            <li>require storage of personal belongings;</li>
            <li>inspect eyeglasses or permitted items as authorized by sponsor rules;</li>
            <li>explain center rules.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Prohibited Items</h2>
          <p className="text-muted-foreground leading-relaxed">Unless expressly authorized:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>phones, watches, cameras, recording devices, notes, books, calculators, bags, food, and personal items are prohibited in the testing room;</li>
            <li>weapons, illegal substances, and disruptive items are prohibited from the premises.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">During the Exam</h2>
          <p className="text-muted-foreground leading-relaxed">Candidates must:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>follow proctor instructions;</li>
            <li>remain in assigned areas;</li>
            <li>avoid communicating with others;</li>
            <li>avoid copying, memorizing for disclosure, photographing, recording, or transmitting exam content;</li>
            <li>request assistance through approved procedures;</li>
            <li>comply with break and restroom rules.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Surveillance and Monitoring</h2>
          <p className="text-muted-foreground leading-relaxed">
            Testing areas and sessions may be monitored by proctors and by video, audio, screen, identity, access,
            or incident-recording systems required by the sponsor.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Monitoring is used for exam integrity, safety, incident investigation, sponsor compliance, and legal
            obligations.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Information may be disclosed to the sponsor, regulator, security provider, law enforcement, or another
            authorized party. Sponsor privacy and retention rules may control.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Incidents</h2>
          <p className="text-muted-foreground leading-relaxed">Suspected misconduct may result in:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>warning or removal;</li>
            <li>termination of the examination;</li>
            <li>invalidation or review of results by the sponsor;</li>
            <li>loss of fees;</li>
            <li>suspension from future testing;</li>
            <li>reporting to regulators or law enforcement.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            LBS does not make final scoring or certification decisions.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Identification</h2>
          <p className="text-muted-foreground leading-relaxed">
            LBS should inspect only identification required for the service. Copies should not be made or retained
            unless required and authorized. Identification numbers should not be entered into traditional Texas
            notary records.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Consent for Minors</h2>
          <p className="text-muted-foreground leading-relaxed">
            Where a sponsor permits a minor candidate, the parent, guardian, school, or sponsor is responsible for
            required authorization. LBS does not knowingly create independent consumer accounts for children under
            13.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Questions</h2>
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
