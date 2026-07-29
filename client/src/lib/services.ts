import {
  Stamp,
  Camera,
  Award,
  BookOpen,
  Printer,
  ScanLine,
  Send,
  Briefcase,
} from "lucide-react";

export interface ServiceInfo {
  id: string;
  slug: string;
  link?: string; // optional override for the card CTA link
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  features: string[];
  image?: string;
  price: string;
  priceLabel: string;
  icon: typeof Stamp;
  stripeProductName: string;
  saturdayOnly?: boolean;
  /** "business" = walk-in / everyday office services; "testing" = Pearson VUE, Certiport, exam prep */
  category: "business" | "testing";
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
    icon: Stamp,
    stripeProductName: "Notary Service",
    category: "business",
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
  },
  {
    id: "printing-copies",
    slug: "printing-copies",
    title: "Printing & Copies",
    shortTitle: "Printing & Copies",
    description:
      "Black-and-white and color printing, plus document copies — no appointment needed.",
    longDescription:
      "Get black-and-white or color printing and document copies at LBS Business Services Center. Bring a digital file (USB, email, or cloud link) or an original document to copy, and we'll take care of the rest while you wait.",
    features: [
      "Black & white and color printing",
      "Single and multi-page copies",
      "Print from USB or email",
      "Walk-ins welcome",
      "No appointment needed",
      "Payment collected in office",
    ],
    price: "",
    priceLabel: "",
    icon: Printer,
    stripeProductName: "Printing & Copies",
    category: "business",
  },
  {
    id: "scanning",
    slug: "scanning",
    title: "Document Scanning",
    shortTitle: "Scanning",
    description:
      "Convert paper documents into clear digital files — no appointment needed.",
    longDescription:
      "Turn paper documents into clear, organized digital files at LBS Business Services Center. Bring the physical documents you'd like scanned along with a USB drive or an email address to receive the files.",
    features: [
      "Digitize documents and records",
      "Multi-page document support",
      "Receive files by USB or email",
      "Walk-ins welcome",
      "No appointment needed",
      "Payment collected in office",
    ],
    price: "",
    priceLabel: "",
    icon: ScanLine,
    stripeProductName: "Document Scanning",
    category: "business",
  },
  {
    id: "faxing",
    slug: "faxing",
    title: "Fax Services",
    shortTitle: "Faxing",
    description:
      "Send and receive faxes quickly and securely — no appointment needed.",
    longDescription:
      "Send and receive important documents with convenient fax services at LBS Business Services Center. Bring the document you'd like to send along with the recipient's fax number, and we'll handle the rest.",
    features: [
      "Send documents by fax",
      "Receive incoming faxes",
      "Confirmation of transmission",
      "Walk-ins welcome",
      "No appointment needed",
      "Payment collected in office",
    ],
    price: "",
    priceLabel: "",
    icon: Send,
    stripeProductName: "Fax Services",
    category: "business",
  },
  {
    id: "resume-services",
    slug: "resume-services",
    title: "Resume Services",
    shortTitle: "Resume Services",
    description:
      "Professional help preparing or improving your resume to stand out to employers.",
    longDescription:
      "Get help presenting your skills, experience, and qualifications clearly to employers. Bring your existing resume (if you have one), your work history, and your target job or industry, and our team will help you put together a clear, professional resume.",
    features: [
      "Resume writing and review",
      "Guidance on formatting and content",
      "Tailored to your target role",
      "Walk-ins welcome",
      "No appointment needed",
      "Payment collected in office",
    ],
    price: "",
    priceLabel: "",
    icon: Briefcase,
    stripeProductName: "Resume Services",
    category: "business",
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
