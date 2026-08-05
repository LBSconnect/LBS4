import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import CompactServiceCard from "@/components/CompactServiceCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { services } from "@/lib/services";
import {
  Building2,
  ArrowRight,
  Globe,
  Stamp,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import websiteDesignImg from "@assets/service-website-design.jpg";

const notaryService = services.find((s) => s.id === "notary")!;
const passportService = services.find((s) => s.id === "passport")!;

const gridServices = [
  notaryService,
  passportService,
];

export default function ForBusinesses() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Business Services in Houston TX | For Businesses"
        canonical="/for-businesses"
        description="LBS Business Services Center helps Houston small businesses with Corporate Notary subscriptions, New-Hire Verification & Form I-9 support, website & application design, notary services, and passport photos."
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

      {/* 1. Corporate Notary Program */}
      <section className="py-14 bg-muted/30" data-testid="section-corporate-notary-feature">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-card border border-border/50 rounded-md p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 text-[#0D1B3D] dark:text-[#0077FF] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Stamp className="w-3.5 h-3.5" /> Need Ongoing Support?
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
            <div className="h-56 md:h-64 rounded-md overflow-hidden">
              <img
                src={notaryService.image}
                alt="Corporate Notary Program"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                data-testid="img-corporate-notary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. New-Hire Verification & Form I-9 Support */}
      <section className="py-14 bg-background" data-testid="section-employer-verification-feature">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-card border border-border/50 rounded-md p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 text-[#0D1B3D] dark:text-[#0077FF] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" /> Employer Services
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">New-Hire Verification &amp; Form I-9 Support</h2>
              <p className="text-muted-foreground">
                LBS is enrolled as an E-Verify Employer Agent and provides E-Verify case-management and Form
                I-9 administrative support for participating employers, from client enrollment and case
                creation to document examination, case monitoring, and monthly reporting.
              </p>
              <ul className="space-y-2">
                {[
                  "Monthly plans from $49/month, or pay-as-you-go",
                  "In-office and mobile document examination",
                  "Mismatch-notice administration and case tracking",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/employer-services/new-hire-verification">
                <Button
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-employer-verification-learn-more"
                >
                  Explore Employer Services
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="h-56 md:h-64 rounded-md overflow-hidden bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] flex items-center justify-center">
              <ShieldCheck className="w-20 h-20 text-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Website / Application Design Services */}
      <section className="py-14 bg-muted/30" data-testid="section-website-design-feature">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-card border border-border/50 rounded-md p-8 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 text-[#0D1B3D] dark:text-[#0077FF] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Globe className="w-3.5 h-3.5" /> Website / Application Design
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Website &amp; Application Design Services</h2>
              <p className="text-muted-foreground">
                Practical website and application design for Houston small businesses and entrepreneurs.
                Tell us about your business and what you need, and we'll follow up with a free custom quote.
                No fixed packages, no obligation.
              </p>
              <ul className="space-y-2">
                {[
                  "Free initial consultation on every project",
                  "Custom quote, no fixed packages",
                  "Mobile-friendly, responsive design",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/website-design-houston-77090">
                <Button
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-quote-website-design"
                >
                  Request a Free Quote
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="h-56 md:h-64 rounded-md overflow-hidden">
              <img
                src={websiteDesignImg}
                alt="Website and Application Design"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                data-testid="img-website-design-feature"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Everyday Business Services */}
      <section className="py-14 bg-background" data-testid="section-business-services-grid">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl font-bold">Everyday Business Services</h2>
            <p className="text-muted-foreground">
              Walk in during business hours. No appointment needed for most services.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {gridServices.map((service) => (
              <CompactServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                slug={service.slug}
                href={service.link ?? `/services/${service.slug}`}
                icon={<service.icon className="w-5 h-5" />}
              />
            ))}
            <CompactServiceCard
              slug="website-design"
              title="Website Design"
              description="Practical website design for Houston small businesses and entrepreneurs."
              image={websiteDesignImg}
              href="/website-design-houston-77090"
              icon={<Globe className="w-5 h-5" />}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
