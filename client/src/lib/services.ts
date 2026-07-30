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
  link?: string; // optional override for the card CTA link
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
    priceNote: "Per document rate",
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
      "Black-and-white and color printing, plus document copies. No appointment needed.",
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
    image: "/images/service-printing-office.png",
    price: "",
    priceLabel: "",
    priceNote: "Pay in office",
    startingRate: "From 20¢/side (B&W)",
    rateTable: [
      {
        label: "Black & White",
        rows: [
          { name: "Letter", price: "20¢/side" },
          { name: "Legal", price: "30¢/side" },
          { name: "11 × 17", price: "50¢/side" },
        ],
      },
      {
        label: "Full Color",
        rows: [
          { name: "Letter", price: "65¢/side" },
          { name: "Legal", price: "85¢/side" },
          { name: "11 × 17", price: "$1.25/side" },
        ],
      },
    ],
    rateNote: "Volume discounts available. $2 minimum printing transaction. Rates subject to change.",
    promo: "10% off print jobs over $25",
    policies: [
      { label: "Minimum Charge", items: ["$2.00 minimum for printing and copying."] },
      {
        label: "Payment",
        items: [
          "Payment is due when the service is completed.",
          "Large print jobs may require advance payment.",
          "Custom jobs may require a deposit.",
        ],
      },
      {
        label: "Customer Files",
        items: [
          "Customers are responsible for confirming that their file is correct before printing.",
          "LBS is not responsible for errors contained in customer-provided files.",
          "Reprints caused by customer file errors are charged at the regular rate.",
          "Reprints caused by LBS equipment or staff errors are provided at no charge.",
        ],
      },
      {
        label: "Privacy",
        items: [
          "Printed documents are handled confidentially.",
          "Customer files are deleted from LBS computers after the transaction.",
          "Sensitive documents are not left unattended.",
          "Unclaimed documents are securely destroyed after a defined retention period.",
        ],
      },
    ],
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
      "Convert paper documents into clear digital files. No appointment needed.",
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
    image: "/images/service-scanning-office.png",
    price: "",
    priceLabel: "",
    priceNote: "Pay in office",
    startingRate: "From $3 (up to 10 pages)",
    rateTable: [
      {
        label: "Document Scanning",
        rows: [
          { name: "Up to 10 pages", price: "$3" },
          { name: "Additional pages", price: "15¢ each" },
          { name: "Manual or flatbed scanning", price: "$1 per page" },
          { name: "Photo scanning", price: "$2 each" },
        ],
      },
    ],
    rateNote: "Rates subject to change.",
    policies: [
      { label: "Minimum Charge", items: ["$3.00 minimum for scanning."] },
      {
        label: "Payment",
        items: [
          "Payment is due when the service is completed.",
          "Large scan jobs may require advance payment.",
          "Custom jobs may require a deposit.",
        ],
      },
      {
        label: "Customer Files",
        items: [
          "Customers are responsible for confirming that their file is correct before scanning.",
          "LBS is not responsible for errors contained in customer-provided files.",
          "Re-scans caused by customer file errors are charged at the regular rate.",
          "Re-scans caused by LBS equipment or staff errors are provided at no charge.",
        ],
      },
      {
        label: "Privacy",
        items: [
          "Scanned documents are handled confidentially.",
          "Customer files are deleted from LBS computers after the transaction.",
          "Sensitive documents are not left unattended.",
          "Unclaimed documents are securely destroyed after a defined retention period.",
        ],
      },
    ],
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
      "Send and receive faxes quickly and securely. No appointment needed.",
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
    image: "/images/service-faxing-office.png",
    price: "",
    priceLabel: "",
    priceNote: "Pay in office",
    startingRate: "From $2 (first page)",
    rateTable: [
      {
        label: "Sending",
        rows: [
          { name: "First page", price: "$2" },
          { name: "Additional pages", price: "$1 each" },
        ],
      },
      {
        label: "Receiving",
        rows: [
          { name: "First page", price: "$1.50" },
          { name: "Additional pages", price: "75¢ each" },
        ],
      },
    ],
    rateNote: "Free cover sheet and confirmation included. Rates subject to change.",
    policies: [
      {
        label: "Minimum Charge",
        items: [
          "$2.00 minimum for outgoing faxing.",
          "$1.50 minimum for received faxing.",
        ],
      },
      {
        label: "Payment",
        items: [
          "Payment is due when the service is completed.",
          "Large fax jobs may require advance payment.",
          "Custom jobs may require a deposit.",
        ],
      },
      {
        label: "Customer Files",
        items: [
          "Customers are responsible for confirming that their file is correct before faxing.",
          "LBS is not responsible for errors contained in customer-provided files.",
          "Re-sends caused by customer file errors are charged at the regular rate.",
          "Re-sends caused by LBS equipment or staff errors are provided at no charge.",
        ],
      },
      {
        label: "Privacy",
        items: [
          "Faxed documents are handled confidentially.",
          "Customer files are deleted from LBS computers after the transaction.",
          "Sensitive documents are not left unattended.",
          "Unclaimed documents are securely destroyed after a defined retention period.",
        ],
      },
    ],
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
    image: "/images/service-resume-office.png",
    price: "",
    priceLabel: "",
    priceNote: "Pay in office",
    icon: Briefcase,
    stripeProductName: "Resume Services",
    category: "business",
  },
];

export function getServiceBySlug(slug: string): ServiceInfo | undefined {
  return services.find((s) => s.slug === slug);
}
