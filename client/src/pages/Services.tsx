import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import CompactServiceCard from "@/components/CompactServiceCard";
import { services } from "@/lib/services";
import { Shield, ArrowRight } from "lucide-react";
import websiteDesignImg from "@assets/service-website-design.jpg";

function getNextSaturday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilSat = day === 6 ? 7 : 6 - day;
  const next = new Date(today);
  next.setDate(today.getDate() + daysUntilSat);
  return next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getUrlFilter(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("filter");
}

export default function Services() {
  const nextSat = getNextSaturday();
  const filter = getUrlFilter();

  const visibleServices = filter === "bootcamp"
    ? services.filter((s) => s.saturdayOnly)
    : filter === "testing"
    ? services.filter((s) => s.category === "testing")
    : services.filter((s) => s.category === "business");

  const showWebsiteDesignCard = filter !== "bootcamp" && filter !== "testing";

  const pageTitle =
    filter === "bootcamp" ? "Exam Prep Bootcamps" :
    filter === "testing" ? "Exam Testing Services" :
    filter === "business" ? "Business Services" :
    "LBS Services";

  const sectionHeading =
    filter === "bootcamp" ? "Exam Prep Bootcamps" :
    filter === "testing" ? "Exam Testing Services" :
    "Everyday Business Services";

  const sectionDescription =
    filter === "bootcamp" ? "Saturday morning Boot Camps for Texas insurance licensing exams." :
    filter === "testing" ? "Authorized Pearson VUE and Certiport exam testing at our Houston location." :
    "Notary services, passport photos, and website design. Walk in during business hours, no appointment needed for most services.";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Business Services in Houston TX"
        canonical="/services"
        description="Notary services, passport photos, and website design at LBS Business Services Center. Authorized Pearson VUE & Certiport exam testing also available at 616 FM 1960 Road West. Call 281-836-5357."
      />
      <Header />

      <section className="relative py-12 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-services-hero">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <Shield className="w-4 h-4 text-[#FF2D55]" />
            Professional Services
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-white"
            data-testid="text-services-title"
          >
            {pageTitle}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            From notary and passport photos to exam testing, we provide
            everything you need in one convenient location.
          </p>
        </div>
      </section>

      <section className="py-12 bg-background" data-testid="section-services-list">
        <div className="max-w-7xl mx-auto px-6">
          {filter && (
            <div className="mb-6">
              <a href="/services" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to all services
              </a>
            </div>
          )}
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl font-bold" data-testid="text-services-list-heading">{sectionHeading}</h2>
            <p className="text-muted-foreground">{sectionDescription}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleServices.map((service) => (
              <CompactServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                priceNote={service.priceNote}
                slug={service.slug}
                href={service.link ?? `/services/${service.slug}`}
                icon={<service.icon className="w-5 h-5" />}
                badge={service.saturdayOnly ? `Next: ${nextSat}` : undefined}
              />
            ))}
            {showWebsiteDesignCard && (
              <CompactServiceCard
                slug="website-design"
                title="Website Design"
                description="Practical website design for Houston small businesses and entrepreneurs."
                image={websiteDesignImg}
                href="/website-design-houston-77090"
              />
            )}
            {showWebsiteDesignCard && (
              <CompactServiceCard
                slug="testing-center"
                title="Testing Center"
                description="Authorized Pearson VUE & Certiport exam testing, insurance license Boot Camps, and exam prep."
                image="/images/hero-testing-center.png"
                href="/certiport-testing-center-houston"
              />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
