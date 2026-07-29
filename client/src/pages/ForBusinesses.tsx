import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { services } from "@/lib/services";
import {
  Building2,
  ArrowRight,
  Globe,
  FileText,
  Stamp,
  CheckCircle2,
} from "lucide-react";

const notaryService = services.find((s) => s.id === "notary")!;
const passportService = services.find((s) => s.id === "passport")!;
const printingCopiesService = services.find((s) => s.id === "printing-copies")!;
const scanningService = services.find((s) => s.id === "scanning")!;
const resumeService = services.find((s) => s.id === "resume-services")!;

const gridServices = [
  notaryService,
  passportService,
  {
    ...printingCopiesService,
    title: "Printing, Copies & Faxing",
    shortTitle: "Printing, Copies & Faxing",
    description: "Black-and-white and color printing, document copies, and fax services. No appointment needed.",
  },
  scanningService,
  resumeService,
];

export default function ForBusinesses() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Business Services in Houston TX | For Businesses"
        canonical="/for-businesses"
        description="LBS Business Services Center helps Houston small businesses with printing, notary, resume support, website design, and our Corporate Notary subscription program. Explore business solutions today."
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-for-businesses-hero">
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Building2 className="w-4 h-4 text-[#FF2D55]" />
            For Businesses
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="text-for-businesses-title">
            Solutions for Your Business
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            From everyday essentials to specialized business solutions, we help
            you save time and focus on what matters most.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background" data-testid="section-business-services-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl font-bold">Everyday Business Services</h2>
            <p className="text-muted-foreground">
              Walk in during business hours. No appointment needed for most services.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridServices.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                slug={service.slug}
                icon={<service.icon className="w-5 h-5" />}
              />
            ))}
            <ServiceCard
              title="Website Design"
              description="Practical website design for Houston small businesses and entrepreneurs. Request a free quote."
              slug="website-design"
              href="/contact?service=website-design"
              icon={<Globe className="w-5 h-5" />}
              buttonLabel="Request a Quote"
            />
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/30" data-testid="section-corporate-notary-feature">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-card border border-border/50 rounded-md p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 text-[#0D1B3D] dark:text-[#0077FF] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Stamp className="w-3.5 h-3.5" /> Ongoing Support
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Corporate Notary Program</h2>
              <p className="text-muted-foreground">
                Need notary support on an ongoing basis? Our Corporate Notary
                subscription plans give your business predictable access to
                notary services, with a client portal to manage your account.
              </p>
              <ul className="space-y-2">
                {[
                  "Subscription plans for regular notary needs",
                  "Dedicated client portal",
                  "Priority scheduling for enrolled businesses",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/corporate">
                <Button
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-corporate-notary-learn-more"
                >
                  View Plans & Pricing
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="h-56 md:h-64 rounded-md bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                <Stamp className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-background" data-testid="section-quote-services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl font-bold">Request a Quote</h2>
            <p className="text-muted-foreground">
              Tell us about your project and we'll follow up to discuss scope and next steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="border border-border/50 rounded-md p-6 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center mx-auto">
                <Globe className="w-7 h-7 text-[#0D1B3D] dark:text-[#0077FF]" />
              </div>
              <h3 className="font-semibold text-lg">Website Design</h3>
              <p className="text-sm text-muted-foreground">
                Practical website design for Houston small businesses and
                entrepreneurs. Tell us about your business and what you need.
              </p>
              <Link href="/contact?service=website-design">
                <Button
                  size="sm"
                  className="w-full mt-2 bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-quote-website-design"
                >
                  Request a Quote
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="border border-border/50 rounded-md p-6 space-y-3 text-center">
              <div className="w-14 h-14 rounded-full bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7 text-[#0D1B3D] dark:text-[#0077FF]" />
              </div>
              <h3 className="font-semibold text-lg">Resume Services</h3>
              <p className="text-sm text-muted-foreground">
                Prefer to reach out ahead of time instead of walking in? Send
                us your details and we'll follow up.
              </p>
              <Link href="/contact?service=resume-services">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  data-testid="button-quote-resume-services"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
