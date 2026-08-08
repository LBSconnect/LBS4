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
    description: "LBS Business Services Center provides notary services, passport photos, and website design in Houston, Texas, plus authorized Pearson VUE & Certiport exam testing.",
  },
  "/services": {
    title: withSuffix("Business Services in Houston TX"),
    description: "Notary services, passport photos, and website design at LBS Business Services Center. Authorized Pearson VUE & Certiport exam testing also available at 616 FM 1960 Road West. Call 281-836-5357.",
  },
  "/about": {
    title: withSuffix("About LBS Business Services Center | Linton Business Solutions Houston TX"),
    description: "LBS4 is the Skilling Services & Business Center for Linton Business Solutions LLC, offering notary services, passport photos, website design, and authorized Pearson VUE & Certiport testing in Houston, Texas.",
  },
  "/contact": {
    title: withSuffix("Contact LBS Business Services Center Houston TX | 281-836-5357"),
    description: "Contact LBS Business Services Center at 616 FM 1960 Road West, Suite 101, Houston, Texas 77090. Call 281-836-5357 or email info@lbsconnect.net. Open Mon–Fri 8 AM–5 PM, Sat 8 AM–4 PM.",
  },
  "/book": {
    title: withSuffix("Book an Appointment | LBS Business Services Center Houston TX"),
    description: "Book notary service, passport photos, an exam testing appointment, or an insurance exam boot camp at LBS Business Services Center in Houston, Texas. Online scheduling available 24/7. Call 281-836-5357.",
  },
  "/resources": {
    title: withSuffix("Resources"),
    description: "Helpful resources from LBS Business Services Center: FAQs, exam prep links, service overviews, and contact information.",
  },
  "/website-design-houston-77090": {
    title: withSuffix("Website Design in Houston TX | Free Custom Quote"),
    description: "Practical website design for Houston small businesses and entrepreneurs. Request a free custom quote from LBS Business Services Center near FM 1960.",
  },
  "/for-businesses": {
    title: withSuffix("Business Services in Houston TX | For Businesses"),
    description: "LBS Business Services Center helps Houston small businesses with Corporate Notary subscriptions, New-Hire Verification & Form I-9 support, website & application design, notary services, and passport photos.",
  },
  "/texas-insurance-exam-prep-houston": {
    title: withSuffix("Texas Insurance Exam Prep in Houston TX | Life Insurance & P&C Boot Camps"),
    description: "Texas insurance exam prep in Houston: Saturday morning Life Insurance and Property & Casualty license exam Boot Camps, $99/session, near FM 1960. Expert instructors, small classes.",
  },
  "/notary-houston-77090": {
    title: withSuffix("Notary Service in Houston TX"),
    description: "Certified notary public services for documents, affidavits, and legal papers at LBS Business Services Center, 616 FM 1960 Road West, Houston, TX. Walk-ins welcome.",
  },
  "/passport-photos-houston-77090": {
    title: withSuffix("Passport Photos in Houston TX"),
    description: "Compliant U.S. passport and visa photos at LBS Business Services Center, 616 FM 1960 Road West, Houston, TX. Walk-ins welcome, no appointment needed.",
  },
  "/certiport-testing-center-houston": {
    title: withSuffix("Testing Center | Pearson VUE & Certiport Exam Testing in Houston TX"),
    description: "The LBS Testing Center offers authorized Pearson VUE & Certiport exam testing, Texas insurance license Boot Camps, and MyEasyPass exam prep in Houston, Texas.",
  },
  "/services/life-insurance-boot-camp": {
    title: withSuffix("Texas Life Insurance Exam Boot Camp in Houston TX"),
    description: "Prepare for your Texas Life Insurance license exam with our intensive Saturday morning Boot Camp at LBS Business Services Center in Houston, Texas.",
  },
  "/services/property-casualty-boot-camp": {
    title: withSuffix("Texas Property & Casualty Exam Boot Camp in Houston TX"),
    description: "Prepare for your Texas Property & Casualty insurance license exam with our intensive Saturday morning Boot Camp at LBS Business Services Center in Houston, Texas.",
  },
  "/employer-services/new-hire-verification": {
    title: withSuffix("New-Hire Verification & Form I-9 Support | LBS Houston"),
    description: "LBS helps Houston employers manage Form I-9 administrative workflows, E-Verify cases, case tracking, employee document examination, mismatch notices, and monthly onboarding reports.",
  },
  "/employer-services/new-hire-verification/pricing-sheet": {
    title: withSuffix("Employer Services Pricing Sheet | LBS Houston"),
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
    title: withSuffix("LBS Enterprise Corporate Notary Services Houston TX"),
    description: "Dedicated corporate notary services for Houston businesses. Monthly subscription plans: Bronze, Silver, Gold. Priority scheduling, account management, scan-to-email.",
  },
  "/corporate/programs": {
    title: withSuffix("Corporate Notary Plans: Bronze, Silver, Gold | LBS Houston"),
    description: "Compare LBS corporate notary subscription plans. Bronze $250/mo (15 acts), Silver $400/mo (25 acts), Gold $750/mo (100 acts). Serving Houston, Texas businesses.",
  },
  "/privacy-policy": {
    title: withSuffix("Privacy Policy"),
    description: "Privacy Policy for Linton Business Solutions LLC (LBS), covering lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com. How we collect, use, disclose, retain, and protect information.",
  },
  "/terms-of-use": {
    title: withSuffix("Terms of Service"),
    description: "LBS4 Test, Exam, and Business Center Terms of Service: testing-center appointments, sponsored examinations, boot camps, notary services, passport photos, and website design services.",
  },
  "/cookie-policy": {
    title: withSuffix("Cookie Policy"),
    description: "Cookie Policy for Linton Business Solutions LLC (LBS), covering lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com. What cookies and similar technologies we use and your choices.",
  },
  "/notice-at-collection": {
    title: withSuffix("Notice at Collection"),
    description: "Notice at Collection for Linton Business Solutions LLC (LBS): categories of personal information we collect, our purposes for collecting it, and your rights.",
  },
  "/accessibility-statement": {
    title: withSuffix("Accessibility Statement"),
    description: "Linton Business Solutions LLC (LBS) is committed to making its websites, applications, digital products, and physical services reasonably accessible to people with disabilities.",
  },
  "/copyright-dmca-policy": {
    title: withSuffix("Copyright and DMCA Policy"),
    description: "Copyright and DMCA Policy for Linton Business Solutions LLC (LBS): ownership of LBS content, customer content rights, and the process for copyright complaints and counter-notices.",
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
    description: "Submit a privacy request to Linton Business Solutions LLC (LBS): access, correction, deletion, opt-out, or appeal requests for lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com.",
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
  // after the description meta tag.
  out = out.replace(
    /(<meta name="description" content="[^"]*" \/>)/,
    `$1\n    <link rel="canonical" href="${url}" />`
  );
  if (meta.noIndex) {
    out = out.replace(
      /(<link rel="canonical"[^>]*\/>)/,
      `$1\n    <meta name="robots" content="noindex, nofollow" />`
    );
  }
  return out;
}
