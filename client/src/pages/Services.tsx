import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ServiceCard from "@/components/ServiceCard";
import { services, getServiceBySlug } from "@/lib/services";
import { Shield, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";

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

const testingAndExamRow = [
  { service: getServiceBySlug("certification-exam-testing"), href: "/certiport-testing-center-houston" },
  { service: getServiceBySlug("life-insurance-boot-camp"), href: "/services/life-insurance-boot-camp" },
  { service: getServiceBySlug("property-casualty-boot-camp"), href: "/services/property-casualty-boot-camp" },
];

export default function Services() {
  const nextSat = getNextSaturday();
  const filter = getUrlFilter();

  const visibleServices = filter === "bootcamp"
    ? services.filter((s) => s.saturdayOnly)
    : filter === "testing"
    ? services.filter((s) => s.category === "testing")
    : services.filter((s) => s.category === "business");

  const showTestingBlock = !filter;

  const pageTitle =
    filter === "bootcamp" ? "Exam Prep Bootcamps" :
    filter === "testing" ? "Exam Testing Services" :
    "Business Services";

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleServices.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                image={service.image}
                price={service.price}
                priceLabel={service.priceLabel}
                priceNote={service.priceNote}
                slug={service.slug}
                href={service.link}
                icon={<service.icon className="w-5 h-5" />}
                badge={service.saturdayOnly ? `Next: ${nextSat}` : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {showTestingBlock && (
      <section className="py-12 bg-muted/30" data-testid="section-testing-exam-programs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl font-bold">Testing &amp; Exam Programs</h2>
            <p className="text-muted-foreground">
              Authorized exam testing, insurance license Boot Camps, and independent exam prep.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {testingAndExamRow.map(({ service, href }) => service && (
              <Link key={service.id} href={href}>
                <div
                  className="group border border-border/50 bg-card rounded-xl overflow-hidden hover-elevate cursor-pointer h-full"
                  data-testid={`card-testing-row-${service.id}`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    {service.price && (
                      <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm">
                        <span className="text-sm font-bold text-[#0D1B3D] dark:text-white">{service.price}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm font-semibold leading-tight">{service.shortTitle}</h3>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <a
              href="https://www.myeasypass.net"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="card-testing-row-myeasypass"
            >
              <div className="group border border-border/50 bg-card rounded-xl overflow-hidden hover-elevate cursor-pointer h-full">
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-white border-b border-border/50">
                  <img
                    src="/images/myeasypass-logo.png"
                    alt="MyEasyPass.net Exam Cram"
                    className="w-full h-full object-contain p-6"
                    loading="lazy"
                    decoding="async"
                  />
                  <ExternalLink className="absolute top-2 right-2 w-4 h-4 text-muted-foreground" />
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="text-sm font-semibold leading-tight">MyEasyPass.net Exam Cram</h3>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                    Online practice tests for Texas licensing exams.
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>
      )}

      <Footer />
    </div>
  );
}
