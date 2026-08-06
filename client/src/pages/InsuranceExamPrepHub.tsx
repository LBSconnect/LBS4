import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { services } from "@/lib/services";
import { testimonials } from "@/lib/testimonials";

const MAPS_URL = "https://maps.google.com/?q=616+FM+1960+Rd+W+Ste+101+Houston+TX+77090";
const SERVICE_AREA_ZIPS = ["77090", "77060", "77066", "77067", "77068", "77069"];

const FAQS = [
  {
    q: "Where can I find Texas insurance exam prep in Houston?",
    a: "LBS Business Services Center runs intensive Saturday morning Boot Camps for the Texas Life Insurance and Property & Casualty license exams at 616 FM 1960 Road West, Suite 101, Houston, TX 77090, near the FM 1960 and I-45 corridor.",
  },
  {
    q: "What is the difference between the Life Insurance and Property & Casualty Boot Camps?",
    a: "The Texas Life Insurance Exam Boot Camp runs 8:00 AM–10:00 AM and focuses on the Life Insurance license exam. The Texas Property & Casualty Exam Boot Camp runs 10:30 AM–12:30 PM and focuses on the P&C license exam. Both meet every Saturday and are taught by expert instructors.",
  },
  {
    q: "How much does a Boot Camp session cost?",
    a: "Each Boot Camp session is $99, paid online when you book your seat.",
  },
  {
    q: "Do I need to register in advance?",
    a: "Yes. Boot Camp seats are limited and fill quickly. Registration and online payment are required to reserve your spot. Walk-ins cannot be accommodated for Boot Camp sessions.",
  },
  {
    q: "Does attending a Boot Camp guarantee I'll pass my exam?",
    a: "Boot Camps are educational preparation only. Attendance does not guarantee passing, and registration does not include your official state licensing exam appointment unless separately arranged.",
  },
];

export default function InsuranceExamPrepHub() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const lifeInsurance = services.find((s) => s.id === "life-insurance-bootcamp")!;
  const propertyCasualty = services.find((s) => s.id === "property-casualty-bootcamp")!;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Texas Insurance Exam Prep",
    "description": "Saturday morning Boot Camps preparing candidates for the Texas Life Insurance and Property & Casualty licensing exams in Houston, Texas.",
    "url": "https://www.lbs4.com/texas-insurance-exam-prep-houston",
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.lbs4.com/#business",
      "name": "LBS Test & Exam Center",
      "telephone": "+12818365357",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "616 FM 1960 Rd W, Ste 101",
        "addressLocality": "Houston",
        "addressRegion": "TX",
        "postalCode": "77090-3048",
        "addressCountry": "US"
      }
    },
    "areaServed": [
      { "@type": "City", "name": "Houston", "addressRegion": "TX" },
      ...SERVICE_AREA_ZIPS.map((zip) => ({ "@type": "PostalAddress", "postalCode": zip, "addressCountry": "US" })),
    ],
    "offers": [
      { "@type": "Offer", "name": "Texas Life Insurance Exam Boot Camp", "price": "99", "priceCurrency": "USD", "url": "https://www.lbs4.com/services/life-insurance-boot-camp" },
      { "@type": "Offer", "name": "Texas Property & Casualty Exam Boot Camp", "price": "99", "priceCurrency": "USD", "url": "https://www.lbs4.com/services/property-casualty-boot-camp" },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Texas Insurance Exam Prep in Houston TX | Life Insurance & P&C Boot Camps"
        canonical="/texas-insurance-exam-prep-houston"
        description="Texas insurance exam prep in Houston: Saturday morning Life Insurance and Property & Casualty license exam Boot Camps, $99/session, near FM 1960. Expert instructors, small classes."
        schema={schema}
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link href="/services?filter=bootcamp">
            <Button variant="ghost" size="sm" className="text-white/80 mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Services
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white" data-testid="text-hub-title">
                Texas Insurance Exam Prep in Houston
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Intensive Saturday morning Boot Camps preparing you for the Texas Life Insurance and
                Property &amp; Casualty licensing exams, taught by expert instructors near FM 1960.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-sm text-white/90">
                  Registration required, Saturday sessions only, no walk-ins
                </span>
                <a href="tel:2818365357">
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full"
                    data-testid="button-click-to-call"
                  >
                    <Phone className="w-4 h-4 mr-1.5" />
                    Call 281-836-5357
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-md bg-[#FF6A00]/10 border border-[#FF6A00]/30 px-4 py-3 text-sm font-semibold text-[#0D1B3D] dark:text-white mb-8 text-center max-w-2xl mx-auto" data-testid="text-hub-offer">
            Small class sizes and study materials included with every Boot Camp session
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[lifeInsurance, propertyCasualty].map((camp) => (
              <div key={camp.id} className="bg-card border border-border/50 rounded-md p-6 md:p-8 space-y-4" data-testid={`card-hub-${camp.id}`}>
                <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center">
                  <camp.icon className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                </div>
                <h2 className="text-xl font-bold">{camp.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{camp.longDescription}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-[#FF6A00] shrink-0" />
                  <span>Saturdays, {camp.id === "life-insurance-bootcamp" ? "8:00 AM – 10:00 AM" : "10:30 AM – 12:30 PM"}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[#0D1B3D] dark:text-white">{camp.price}</span>
                  <span className="text-sm text-muted-foreground">{camp.priceLabel}</span>
                </div>
                <ul className="space-y-1.5">
                  {camp.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/services/${camp.slug}`}>
                  <Button
                    className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                    data-testid={`button-book-${camp.id}`}
                  >
                    Book This Camp
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-card border border-border/50 rounded-md p-6 md:p-8 flex flex-col md:flex-row items-start gap-4 max-w-5xl mx-auto">
            <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-lg">Visit Us</h3>
              <p className="text-sm text-muted-foreground">
                616 FM 1960 Road West, Suite 101, Houston, Texas 77090-3048. Free customer parking is
                available directly in front of our suite.
              </p>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 mt-1" data-testid="button-map-directions">
                  <MapPin className="w-4 h-4" />
                  Get Directions &amp; Parking Info
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-10 max-w-3xl mx-auto text-center space-y-3" data-testid="section-service-area">
            <h2 className="text-xl font-bold">Proudly Serving the Houston Area</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Located near the FM 1960 &amp; I-45 corridor, we serve candidates within approximately 5–8
              miles of our office, including the {SERVICE_AREA_ZIPS.join(", ")} ZIP codes.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/30" data-testid="section-hub-faq">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Common Questions</p>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-card">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  data-testid={`button-hub-faq-${i}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-[#FF6A00] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-background" data-testid="section-hub-reviews">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">What Our Clients Say</p>
            <h2 className="text-3xl font-bold">Customer Reviews</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border border-border/50 rounded-md p-6 space-y-3">
                <div className="text-[#BD4F00] dark:text-[#FF8A3D] text-sm" aria-hidden="true">★★★★★</div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">{t.quote}</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 rounded-full bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center text-xs font-bold text-[#0D1B3D] dark:text-[#0077FF]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.service}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
