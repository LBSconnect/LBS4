import {
  Stamp,
  Camera,
  Award,
  BookOpen,
} from "lucide-react";

export interface RateTableSection {
  label: string;
  rows: { name: string; price: string }[];
}

export interface PolicySection {
  label: string;
  items: string[];
}

export interface ServiceInfo {
  id: string;
  slug: string;
  /** Overrides the default /services/:slug card CTA and canonical page URL (e.g. a dedicated SEO landing page) */
  link?: string;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  features: string[];
  image?: string;
  price: string;
  priceLabel: string;
  /** Shown on the card in place of a price when the rate is variable/in-office (e.g. "Pay in office") */
  priceNote?: string;
  /** Headline rate shown in the booking sidebar for pay-at-office services (e.g. "From 20¢/side") */
  startingRate?: string;
  /** Full in-store rate breakdown shown under "About This Service" */
  rateTable?: RateTableSection[];
  /** Small disclaimer/footnote shown under the rate table (e.g. minimums, volume discounts) */
  rateNote?: string;
  /** Service policy sections (minimum charge, payment, customer files, privacy) shown under Pricing */
  policies?: PolicySection[];
  /** Short promo callout shown above the rate table (e.g. "10% off print jobs over $25") */
  promo?: string;
  icon: typeof Stamp;
  stripeProductName: string;
  saturdayOnly?: boolean;
  /** "business" = walk-in / everyday office services; "testing" = Pearson VUE, Certiport, exam prep */
  category: "business" | "testing";
  /** Short line shown near the price: "Walk-ins welcome" vs "Appointment recommended" */
  visitNote?: string;
  /** 3–5 service-specific FAQs shown in an accordion on the detail/landing page */
  faqs?: { q: string; a: string }[];
}

export const services: ServiceInfo[] = [
  {
    id: "certification",
    slug: "certification-exam-testing",
    title: "Certiport Exam Testing",
    shortTitle: "Certifications",
    description:
      "Professional exam testing environment for IT certifications including Pearson VUE, Certiport, and PMI exams.",
    longDescription:
      "Our authorized testing center provides a professional environment for certification exams. We support Pearson VUE, Certiport, and PMI exam programs, among others. Our facility meets all testing program requirements to ensure your exam experience is seamless.",
    features: [
      "Pearson VUE authorized center",
      "Certiport testing available",
      "PMI exam programs",
      "Secure testing environment",
      "Individual testing stations",
      "Flexible scheduling options",
    ],
    image: "/images/service-certification.png",
    price: "$35",
    priceLabel: "/session",
    icon: Award,
    stripeProductName: "Certiport Exam Testing",
    category: "testing",
    link: "/certiport-testing-center-houston",
    visitNote: "Appointment recommended — book your exam time online or by phone",
    promo: "Same-week scheduling available for most Pearson VUE and Certiport exams",
  },
  {
    id: "life-insurance-bootcamp",
    slug: "life-insurance-boot-camp",
    title: "Texas Life Insurance Exam Boot Camp",
    shortTitle: "Life Insurance Boot Camp",
    description:
      "Saturday morning Boot Camp for the Texas Life Insurance license exam. 8:00 AM – 10:00 AM.",
    longDescription:
      "Prepare for your Texas Life Insurance license exam with our intensive Saturday morning Boot Camp. Our expert instructors guide you through the key concepts, practice questions, and test-taking strategies you need to pass on your first attempt. Sessions run 8:00 AM – 10:00 AM every Saturday.",
    features: [
      "Expert-led instruction",
      "Texas Life Insurance exam focus",
      "Practice questions & test strategies",
      "Saturday mornings 8:00 AM – 10:00 AM",
      "Small class sizes",
      "Study materials provided",
    ],
    image: "/images/service-group-sessions.png",
    price: "$99",
    priceLabel: "/session",
    icon: BookOpen,
    stripeProductName: "Texas Life Insurance Exam Boot Camp",
    saturdayOnly: true,
    category: "testing",
    visitNote: "Registration required — Saturday sessions only, no walk-ins",
  },
  {
    id: "property-casualty-bootcamp",
    slug: "property-casualty-boot-camp",
    title: "Texas Property & Casualty Exam Boot Camp",
    shortTitle: "P&C Boot Camp",
    description:
      "Saturday morning Boot Camp for the Texas Property & Casualty insurance license exam. 10:30 AM – 12:30 PM.",
    longDescription:
      "Prepare for your Texas Property & Casualty insurance license exam with our intensive Saturday morning Boot Camp. Our expert instructors cover all exam topics, provide practice questions, and share proven test-taking strategies to help you pass with confidence. Sessions run 10:30 AM – 12:30 PM every Saturday.",
    features: [
      "Expert-led instruction",
      "Texas P&C insurance exam focus",
      "Practice questions & test strategies",
      "Saturday mornings 10:30 AM – 12:30 PM",
      "Small class sizes",
      "Study materials provided",
    ],
    image: "/images/service-exam-cram.png",
    price: "$99",
    priceLabel: "/session",
    icon: BookOpen,
    stripeProductName: "Texas Property & Casualty Exam Boot Camp",
    saturdayOnly: true,
    category: "testing",
    visitNote: "Registration required — Saturday sessions only, no walk-ins",
  },
  {
    id: "notary",
    slug: "notary-service",
    title: "Notary Service",
    shortTitle: "Notary",
    description:
      "Certified notary public services for documents, affidavits, and legal papers. Per document rate.",
    longDescription:
      "Our certified notary public is available to help you with all your notarization needs. From legal documents and affidavits to powers of attorney and real estate documents, we provide fast and professional notary services.",
    features: [
      "Certified Notary Public",
      "Legal documents & affidavits",
      "Powers of Attorney",
      "Real estate documents",
      "Same-day service available",
      "Walk-ins welcome",
    ],
    image: "/images/service-notary.png",
    price: "",
    priceLabel: "/document",
    priceNote: "Per document rate",
    icon: Stamp,
    stripeProductName: "Notary Service",
    category: "business",
    link: "/notary-houston-77090",
    visitNote: "Walk-ins welcome — no appointment needed",
    promo: "Same-day notary service — walk in during business hours, no appointment required",
    faqs: [
      {
        q: "Where can I find a notary near me in Houston?",
        a: "LBS Business Services Center is a walk-in notary location at 616 FM 1960 Road West, Suite 101, Houston, TX 77090, near the FM 1960 and I-45 corridor. We regularly serve customers from the 77060, 77066, 77067, 77068, and 77069 ZIP codes.",
      },
      {
        q: "Do I need an appointment for notary service?",
        a: "No. Walk-ins are welcome during business hours: Monday–Friday 8 AM–5 PM and Saturday 8 AM–4 PM.",
      },
      {
        q: "What do I need to bring to get a document notarized?",
        a: "Bring a valid, unexpired government-issued photo ID and your document. Do not sign the document before you arrive — you must sign it in front of the notary.",
      },
      {
        q: "How much does notary service cost?",
        a: "Notary service is billed per document at the time of service. Call 281-836-5357 for current per-document pricing.",
      },
      {
        q: "What kinds of documents can LBS notarize?",
        a: "We regularly notarize affidavits, powers of attorney, real estate documents, and other legal paperwork. The notary may decline an act when legal or ethical requirements aren't met.",
      },
    ],
  },
  {
    id: "passport",
    slug: "passport-photos",
    title: "Passport Photos",
    shortTitle: "Passport Photos",
    description:
      "Professional passport and visa photos meeting all government standards. Includes 2 printed photos.",
    longDescription:
      "Get professional passport and visa photos that meet all U.S. Department of State and international government standards. Our photos are taken with professional equipment and lighting to ensure they are accepted on the first submission.",
    features: [
      "Meets U.S. State Department standards",
      "International visa photo formats",
      "Professional lighting & equipment",
      "Includes 2 printed photos",
      "Digital copy available",
      "No appointment needed",
    ],
    image: "/images/service-passport.png",
    price: "$25",
    priceLabel: "/set",
    icon: Camera,
    stripeProductName: "Passport Photos",
    category: "business",
    link: "/passport-photos-houston-77090",
    visitNote: "Walk-ins welcome — no appointment needed",
    promo: "No appointment needed — most passport photos are ready in minutes",
    faqs: [
      {
        q: "Where can I get passport photos near me in Houston?",
        a: "LBS Business Services Center takes passport and visa photos at 616 FM 1960 Road West, Suite 101, Houston, TX 77090, near the FM 1960 and I-45 corridor. We regularly serve customers from the 77060, 77066, 77067, 77068, and 77069 ZIP codes.",
      },
      {
        q: "Do I need an appointment for passport photos?",
        a: "No. Walk-ins are welcome during business hours: Monday–Friday 8 AM–5 PM and Saturday 8 AM–4 PM.",
      },
      {
        q: "How much do passport photos cost?",
        a: "Passport and visa photos are $25 per set, which includes 2 printed photos.",
      },
      {
        q: "Are LBS passport photos guaranteed to be accepted?",
        a: "We use professional equipment and lighting to meet U.S. Department of State and international standards, but the receiving government or organization makes the final acceptance decision.",
      },
      {
        q: "What should I wear or bring for passport photos?",
        a: "Wear normal street clothes without a hat or head covering (unless worn daily for religious reasons), and confirm any current size, background, or submission requirements for your specific application before you arrive.",
      },
    ],
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
