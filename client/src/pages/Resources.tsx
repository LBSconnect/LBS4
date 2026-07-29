import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Link } from "wouter";
import {
  HelpCircle,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  FileText,
  Mail,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const resourceLinks = [
  {
    icon: HelpCircle,
    title: "Frequently Asked Questions",
    description: "Answers to common questions about scheduling, walk-ins, ID requirements, and more.",
    href: "/#section-faq",
    external: false,
  },
  {
    icon: GraduationCap,
    title: "Exam Prep with MyEasyPass",
    description: "Independent online practice tests for Texas Real Estate, Insurance, and other licensing exams.",
    href: "https://www.myeasypass.net",
    external: true,
  },
  {
    icon: Briefcase,
    title: "Business Services Overview",
    description: "Printing, scanning, notary, passport photos, faxing, resume services and website design.",
    href: "/services?filter=business",
    external: false,
  },
  {
    icon: ShieldCheck,
    title: "Testing Center Info",
    description: "Pearson VUE, Certiport, exam prep Boot Camps, and appointment preparation details.",
    href: "/services/certification-exam-testing",
    external: false,
  },
  {
    icon: FileText,
    title: "Privacy Policy & Terms of Use",
    description: "Review how we handle your information and the terms that govern our services.",
    href: "/privacy-policy",
    external: false,
  },
  {
    icon: Mail,
    title: "Contact Us",
    description: "Reach out with questions, or to request a quote for Website Design or Resume Services.",
    href: "/contact",
    external: false,
  },
];

export default function Resources() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Resources"
        canonical="/resources"
        description="Helpful resources from LBS Business Services Center: FAQs, exam prep links, service overviews, and contact information."
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e]" data-testid="section-resources-hero">
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="text-resources-title">
            Resources
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Helpful links and answers to common questions about LBS Business Services Center.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background flex-1" data-testid="section-resources-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resourceLinks.map((item) => {
              const testId = `link-resource-${item.title.toLowerCase().replace(/\s/g, "-")}`;
              const content = (
                <div
                  className="h-full border border-border/50 rounded-md p-6 space-y-3 hover:border-[#1e3a6e]/40 hover:shadow-md transition-all cursor-pointer"
                  data-testid={testId}
                >
                  <div className="w-12 h-12 rounded-md bg-[#1e3a6e]/10 dark:bg-[#4a72c4]/20 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-[#1e3a6e] dark:text-[#6b9aed]" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#e85d40]">
                    {item.external ? "Visit site" : "Learn more"}
                    {item.external ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              );

              return item.external ? (
                <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              ) : (
                <Link key={item.title} href={item.href}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
