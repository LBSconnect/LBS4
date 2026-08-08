import { useState } from "react";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import CookiePreferences from "@/components/CookiePreferences";
import { EMPLOYER_AGREEMENT_ROUTE } from "@/lib/employerServices";
import {
  Scale,
  Shield,
  FileText,
  Cookie,
  Eye,
  FileCheck,
  Accessibility,
  Copyright,
  MessageSquare,
  CalendarClock,
  ShieldAlert,
  FolderLock,
  FileSignature,
  Settings2,
  type LucideIcon,
} from "lucide-react";

interface NoticeLink {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

interface NoticeGroup {
  heading: string;
  items: NoticeLink[];
}

// Single source of truth for "every policy, notice, and agreement on the
// site" — the footer now links here with one "Terms of Use" link instead of
// listing each document individually. Add new legal pages to one of these
// groups (or a new one) rather than only wiring them into the footer, so
// this index never drifts out of sync with what's actually published.
const GROUPS: NoticeGroup[] = [
  {
    heading: "Site Policies",
    items: [
      { href: "/terms-of-use", icon: FileText, label: "Terms of Service", description: "The terms governing use of the LBS website and in-person business-center services." },
      { href: "/privacy-policy", icon: Shield, label: "Privacy Policy", description: "How LBS collects, uses, and protects personal information across the site and services." },
      { href: "/cookie-policy", icon: Cookie, label: "Cookie Policy", description: "The cookies and analytics technology used on lbs4.com and how to control them." },
      { href: "/notice-at-collection", icon: Eye, label: "Notice at Collection", description: "Categories of personal information collected and the purposes for collecting them." },
      { href: "/privacy-request", icon: FileCheck, label: "Privacy Request", description: "Submit a request to access, correct, or delete your personal information." },
      { href: "/accessibility-statement", icon: Accessibility, label: "Accessibility Statement", description: "Our commitment to an accessible website and how to report a barrier." },
      { href: "/copyright-dmca-policy", icon: Copyright, label: "Copyright & DMCA Policy", description: "How to submit a copyright infringement notice or counter-notice." },
      { href: "/electronic-communications-terms", icon: MessageSquare, label: "Electronic Communications Terms", description: "Terms for email and SMS communications sent by LBS, including opt-out instructions." },
    ],
  },
  {
    heading: "Service Notices",
    items: [
      { href: "/booking-cancellation-policy", icon: CalendarClock, label: "Refund & Cancellation Policy", description: "Booking, rescheduling, cancellation, and refund terms for LBS services." },
      { href: "/candidate-rules-surveillance-notice", icon: ShieldAlert, label: "Candidate Rules & Surveillance Notice", description: "Conduct rules and recording/monitoring disclosures for testing candidates on-site." },
      { href: "/document-handling-notice", icon: FolderLock, label: "Document Handling Notice", description: "How documents brought to the business center are handled, stored, and disposed of." },
    ],
  },
  {
    heading: "Employer Services Agreements",
    items: [
      { href: EMPLOYER_AGREEMENT_ROUTE, icon: FileSignature, label: "New-Hire Verification & Form I-9 Support Services Agreement", description: "The agreement employer clients accept to enroll in LBS's E-Verify Employer Agent and Form I-9 support services." },
    ],
  },
];

export default function LegalNotices() {
  const [cookiePrefsOpen, setCookiePrefsOpen] = useState(false);

  return (
    <>
      <SEO
        title="Legal Notices & Agreements"
        canonical="/legal-notices"
        description="One place for every Linton Business Solutions LLC policy, notice, and client agreement — Terms of Service, Privacy Policy, Cookie Policy, and more."
      />
      <LegalPageLayout
        icon={Scale}
        title="Legal Notices & Agreements"
        meta="Linton Business Solutions LLC — every policy, notice, and client agreement in one place"
      >
        <p className="text-muted-foreground leading-relaxed" data-testid="text-legal-notices-intro">
          This page indexes every policy, notice, and client agreement LBS publishes. Select a document below to
          read its full text.
        </p>

        {GROUPS.map((group) => (
          <div key={group.heading} className="space-y-4">
            <h2 className="text-lg font-bold" style={{ color: "#0D1B3D" }}>{group.heading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-background hover:border-[#0D1B3D]/40 hover:shadow-sm transition-all no-underline"
                  data-testid={`link-legal-notice-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <item.icon className="w-5 h-5 text-[#FF2D55] mt-0.5 shrink-0" />
                  <span className="space-y-1">
                    <span className="block font-semibold text-sm text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground leading-relaxed">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-4">
          <h2 className="text-lg font-bold" style={{ color: "#0D1B3D" }}>Cookie Preferences</h2>
          <button
            type="button"
            onClick={() => setCookiePrefsOpen(true)}
            className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-background hover:border-[#0D1B3D]/40 hover:shadow-sm transition-all text-left w-full sm:w-auto sm:min-w-[320px]"
            data-testid="button-legal-notices-cookie-preferences"
          >
            <Settings2 className="w-5 h-5 text-[#FF2D55] mt-0.5 shrink-0" />
            <span className="space-y-1">
              <span className="block font-semibold text-sm text-foreground">Manage Cookie Preferences</span>
              <span className="block text-xs text-muted-foreground leading-relaxed">
                Turn analytics cookies on or off for this browser.
              </span>
            </span>
          </button>
        </div>
      </LegalPageLayout>
      <CookiePreferences open={cookiePrefsOpen} onOpenChange={setCookiePrefsOpen} />
    </>
  );
}
