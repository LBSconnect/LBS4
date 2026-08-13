// ─────────────────────────────────────────────────────────────────────────────
// Server-side title/description/canonical injection for the static routes
// below.
//
// Why this exists: this app is a pure client-rendered SPA (server/static.ts
// serves the identical, single dist/public/index.html for every route — no
// SSR). client/src/components/SEO.tsx (react-helmet-async) only ever updates
// the *browser* <head> after React mounts, which never reaches non-JS
// crawlers or — critically — link-preview bots (Facebook, X/Twitter,
// LinkedIn, Slack, iMessage, Discord) that fetch raw HTML and never execute
// JavaScript. Every route was therefore serving the identical Testing-Center
// title/description/OG data in its crawler/scraper-visible HTML, including
// pages that explicitly must not (e.g. /employer-services/new-hire-verification
// showing Pearson VUE/testing-center copy in every shared-link preview).
//
// This is the smallest reliable fix short of real SSR: a static lookup table
// (values copied verbatim from each page's own <SEO title=... description=...>
// props, so there's exactly one place per page's copy actually lives — this
// table is presentation-layer plumbing, not a second source of truth to keep
// in sync by hand beyond "matches what that page already declares") plus a
// plain string-replace over the already-built index.html for routes present
// in the table. Routes not listed here are untouched — identical behavior to
// before this file existed, so there's no regression surface for anything
// not explicitly covered.
//
// The client's <Helmet>-driven tags still run as before on top of this (for
// client-side navigation between routes, where this file has no reach) —
// they'll just be updating already-correct values instead of the generic
// default, so there's no conflict, only a redundant-but-harmless duplicate
// <meta name="description"> etc. after hydration on a fresh full-page load.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_SUFFIX = "LBS Business Services Center";
const BASE_URL = "https://www.lbs4.com";

interface RouteMeta {
  title: string;
  description: string;
  noIndex?: boolean;
}

function withSuffix(title: string): string {
  return `${title} | ${SITE_SUFFIX}`;
}

export const SEO_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: `${SITE_SUFFIX} Houston TX | Notary, Testing & More`,
    description: "Notary services, passport photos, and website design in Houston, Texas, plus authorized Pearson VUE & Certiport exam testing at LBS.",
  },
  "/services": {
    title: withSuffix("Business Services in Houston TX"),
    description: "Notary, passport photos, and website design at LBS Business Services Center. Pearson VUE & Certiport exam testing also available. Call 281-836-5357.",
  },
  "/about": {
    title: withSuffix("About Linton Business Solutions LLC"),
    description: "Linton Business Solutions LLC (LBS4): notary services, passport photos, website design, and authorized Pearson VUE & Certiport testing in Houston, TX.",
  },
  "/contact": {
    title: withSuffix("Contact Us | 281-836-5357"),
    description: "Contact LBS at 616 FM 1960 Road West, Suite 101, Houston, TX 77090. Call 281-836-5357. Open Mon–Fri 8 AM–5 PM, Sat 8 AM–4 PM.",
  },
  "/book": {
    title: withSuffix("Book an Appointment, Houston TX"),
    description: "Book notary service, passport photos, exam testing, or an insurance exam boot camp at LBS in Houston, Texas. Online scheduling 24/7. Call 281-836-5357.",
  },
  "/resources": {
    title: withSuffix("Resources"),
    description: "Helpful resources from LBS Business Services Center: FAQs, exam prep links, service overviews, and contact information.",
  },
  "/website-design-houston-77090": {
    title: withSuffix("Website Design in Houston TX"),
    description: "Practical website design for Houston small businesses and entrepreneurs. Request a free custom quote from LBS Business Services Center near FM 1960.",
  },
  "/for-businesses": {
    title: withSuffix("For Businesses: Notary, I-9 & Website Design"),
    description: "LBS helps Houston small businesses with Corporate Notary subscriptions, New-Hire Verification & Form I-9 support, website design, notary, and passport photos.",
  },
  "/texas-insurance-exam-prep-houston": {
    title: withSuffix("Insurance Exam Prep, Houston TX"),
    description: "Texas insurance exam prep in Houston: Saturday Life Insurance and Property & Casualty license Boot Camps, $99/session, near FM 1960.",
  },
  "/notary-houston-77090": {
    title: withSuffix("Notary Service in Houston TX"),
    description: "Certified notary public services for documents, affidavits, and legal papers at LBS, 616 FM 1960 Road West, Houston, TX. Walk-ins welcome.",
  },
  "/passport-photos-houston-77090": {
    title: withSuffix("Passport Photos in Houston TX"),
    description: "Compliant U.S. passport and visa photos at LBS Business Services Center, 616 FM 1960 Road West, Houston, TX. Walk-ins welcome, no appointment needed.",
  },
  "/certiport-testing-center-houston": {
    title: withSuffix("Pearson VUE & Certiport Testing Center"),
    description: "The LBS Testing Center offers authorized Pearson VUE & Certiport exam testing, Texas insurance license Boot Camps, and exam prep in Houston, Texas.",
  },
  "/services/life-insurance-boot-camp": {
    title: withSuffix("Texas Life Insurance Exam Boot Camp"),
    description: "Prepare for your Texas Life Insurance license exam with our intensive Saturday morning Boot Camp at LBS in Houston, Texas.",
  },
  "/services/property-casualty-boot-camp": {
    title: withSuffix("Texas Property & Casualty Exam Boot Camp"),
    description: "Prepare for your Texas Property & Casualty insurance exam with our Saturday morning Boot Camp at LBS in Houston, Texas.",
  },
  "/employer-services/new-hire-verification": {
    title: withSuffix("New-Hire Verification & Form I-9 Support"),
    description: "LBS helps Houston employers manage Form I-9 workflows, E-Verify cases, case tracking, document examination, and monthly onboarding reports.",
  },
  "/employer-services/new-hire-verification/pricing-sheet": {
    title: withSuffix("Employer Services Pricing Sheet"),
    description: "Print-friendly pricing sheet for LBS New-Hire Verification & Form I-9 Support: monthly plans, pay-as-you-go rates, setup fees, and mobile travel notes.",
  },
  "/employer-services/new-hire-verification/intake": {
    title: withSuffix("Employer Onboarding Checklist & Client Intake | LBS"),
    description: "Business-level onboarding checklist and client intake for LBS New-Hire Verification & Form I-9 Support. No employee Form I-9 data is collected on this page.",
    noIndex: true,
  },
  "/employer-services/new-hire-verification/agreement": {
    title: withSuffix("New-Hire Verification Services Agreement"),
    description: "Review the Linton Business Solutions LLC agreement governing employer E-Verify Employer Agent services and Form I-9 support for New-Hire Verification clients.",
    noIndex: true,
  },
  "/corporate": {
    title: withSuffix("Corporate Notary Services, Houston TX"),
    description: "Dedicated corporate notary services for Houston businesses. Monthly plans: Bronze, Silver, Gold. Priority scheduling, account management, scan-to-email.",
  },
  "/corporate/programs": {
    title: withSuffix("Corporate Notary Plans: Bronze, Silver, Gold"),
    description: "Compare LBS corporate notary plans: Bronze $250/mo (15 acts), Silver $400/mo (25 acts), Gold $750/mo (100 acts). Serving Houston, Texas.",
  },
  "/privacy-policy": {
    title: withSuffix("Privacy Policy"),
    description: "Privacy Policy for Linton Business Solutions LLC (LBS): how we collect, use, disclose, retain, and protect information across lbsconnect.net and lbs4.com.",
  },
  "/terms-of-use": {
    title: withSuffix("Terms of Service"),
    description: "LBS4 Terms of Service: testing-center appointments, sponsored exams, boot camps, notary services, passport photos, and website design services.",
  },
  "/cookie-policy": {
    title: withSuffix("Cookie Policy"),
    description: "Cookie Policy for Linton Business Solutions LLC (LBS): what cookies and similar technologies we use across our sites and your choices.",
  },
  "/notice-at-collection": {
    title: withSuffix("Notice at Collection"),
    description: "Notice at Collection for Linton Business Solutions LLC (LBS): categories of personal information we collect and our purposes for collecting it.",
  },
  "/accessibility-statement": {
    title: withSuffix("Accessibility Statement"),
    description: "Linton Business Solutions LLC (LBS) is committed to making its websites, apps, and physical services reasonably accessible to people with disabilities.",
  },
  "/copyright-dmca-policy": {
    title: withSuffix("Copyright and DMCA Policy"),
    description: "Copyright and DMCA Policy for Linton Business Solutions LLC (LBS): ownership of LBS content, customer content rights, and the complaint process.",
  },
  "/electronic-communications-terms": {
    title: withSuffix("Electronic Communications, Email, and SMS Terms"),
    description: "Electronic Communications, Email, and SMS Terms for Linton Business Solutions LLC (LBS): electronic delivery consent, marketing email rules, and SMS terms.",
  },
  "/booking-cancellation-policy": {
    title: withSuffix("Booking, Rescheduling, Cancellation, and Refund Policy"),
    description: "LBS4 Booking, Rescheduling, Cancellation, and Refund Policy: testing appointments, boot camps, notary, passport photos, and business-center jobs.",
  },
  "/document-handling-notice": {
    title: withSuffix("Business-Center Document Handling Notice"),
    description: "LBS4 Business-Center Document Handling Notice: how we handle files for passport photos and website design services.",
  },
  "/candidate-rules-surveillance-notice": {
    title: withSuffix("Candidate Rules and Surveillance Notice"),
    description: "LBS4 Candidate Rules and Surveillance Notice: what to bring, check-in, prohibited items, exam conduct, and monitoring in the testing center.",
  },
  "/privacy-request": {
    title: withSuffix("Privacy Request Procedure and Form"),
    description: "Submit a privacy request to Linton Business Solutions LLC (LBS): access, correction, deletion, opt-out, or appeal requests for your personal information.",
  },
  "/legal-notices": {
    title: withSuffix("Legal Notices & Agreements"),
    description: "One place for every Linton Business Solutions LLC policy, notice, and client agreement — Terms of Service, Privacy Policy, Cookie Policy, and more.",
  },
};

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rewrites <title>, <meta name="description">, the OG/Twitter title+
 *  description, og:url, and (new) <link rel="canonical"> in an already-built
 *  index.html for routes listed in SEO_ROUTES. Returns the input unchanged
 *  for any other path — that's the entire regression boundary: unlisted
 *  routes behave exactly as they did before this existed. */
export function injectSeoMeta(html: string, pathname: string): string {
  const meta = SEO_ROUTES[pathname];
  if (!meta) return html;

  const title = escapeHtmlAttr(meta.title);
  const description = escapeHtmlAttr(meta.description);
  const url = escapeHtmlAttr(`${BASE_URL}${pathname}`);

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${description}" />`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${title}" />`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${description}" />`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${title}" />`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${description}" />`
  );
  // No static <link rel="canonical"> exists in the base template (it was
  // client-only, same problem as everything else here) — insert one right
  // after the description meta tag. Tagged data-ssr so client/src/components/
  // SEO.tsx (react-helmet-async) can find and remove it on mount: Helmet's
  // reconciliation only tracks elements it previously rendered itself (via
  // its own data-rh attribute), so without this it can't see this
  // server-injected tag and would append a second, duplicate canonical
  // rather than replacing it once React hydrates.
  out = out.replace(
    /(<meta name="description" content="[^"]*" \/>)/,
    `$1\n    <link rel="canonical" href="${url}" data-ssr-canonical="true" />`
  );
  if (meta.noIndex) {
    // Replace the base template's permissive robots directive rather than
    // appending a second, conflicting <meta name="robots"> tag — the two
    // pages that set noIndex (business-intake checklist, service agreement)
    // otherwise ended up with both "index, follow, ..." and
    // "noindex, nofollow" in the same document.
    out = out.replace(
      /<meta name="robots" content="[^"]*" \/>/,
      `<meta name="robots" content="noindex, nofollow" />`
    );
  }
  return out;
}
