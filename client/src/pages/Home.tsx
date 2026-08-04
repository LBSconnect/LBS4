import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  MapPin,
  Phone,
  Shield,
  Clock,
  Users,
  Award,
  ChevronDown,
  Zap,
  Headset,
  Globe,
  BadgeCheck,
  Lock,
  Smile,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { services } from "@/lib/services";
import { testimonials } from "@/lib/testimonials";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";
import heroImg from "@assets/hero.png";

const businessServices = services.filter((s) => s.category === "business");

const SERVICE_ICON_COLORS: Record<string, string> = {
  "notary": "#8A2BE2",
  "passport": "#8A2BE2",
  "website-design": "#0077FF",
  "certification": "#FF6A00",
  "life-insurance-bootcamp": "#FF2D55",
};

const CORE_SERVICE_ORDER = ["notary", "passport"];

const certificationService = services.find((s) => s.id === "certification")!;
const lifeInsuranceBootcampService = services.find((s) => s.id === "life-insurance-bootcamp")!;

const coreServiceStrip = [
  ...CORE_SERVICE_ORDER.map((id) => businessServices.find((s) => s.id === id)!).map((s) => ({
    icon: s.icon,
    title: s.shortTitle,
    tagline:
      s.id === "notary" ? "Certified & Confidential" :
      s.id === "passport" ? "Fast & Compliant" :
      "",
    href: s.link ?? `/services/${s.slug}`,
    color: SERVICE_ICON_COLORS[s.id],
  })),
  { icon: Globe, title: "Website Design", tagline: "Modern & Effective", href: "/website-design-houston-77090", color: SERVICE_ICON_COLORS["website-design"] },
  {
    icon: certificationService.icon,
    title: certificationService.shortTitle,
    tagline: "Pearson VUE & Certiport",
    href: certificationService.link ?? "/services/certification-exam-testing",
    color: SERVICE_ICON_COLORS["certification"],
  },
  {
    icon: lifeInsuranceBootcampService.icon,
    title: lifeInsuranceBootcampService.shortTitle,
    tagline: "Saturday Mornings",
    href: "/services?filter=bootcamp",
    color: SERVICE_ICON_COLORS["life-insurance-bootcamp"],
  },
];

const whyChooseItems = [
  { icon: BadgeCheck, title: "Professional & Reliable", description: "Quality services you can count on, every time." },
  { icon: Users, title: "Experienced Team", description: "Skilled professionals ready to help." },
  { icon: Lock, title: "Secure & Confidential", description: "Your documents and information are safe." },
  { icon: MapPin, title: "Convenient & Local", description: "Serving our community with pride." },
];

const faqs = [
  {
    q: "Do I need to register with Pearson VUE or Certiport before booking here?",
    a: "Yes — create your account and purchase your exam voucher directly at pearsonvue.com or certiport.com first. Then book your seat here at LBS. We serve as your authorized local testing location.",
  },
  {
    q: "What ID do I need to bring?",
    a: "A valid government-issued photo ID — driver's license, passport, or state ID. Your name must match your exam registration exactly. This is a strict Pearson VUE and Certiport requirement.",
  },
  {
    q: "Can I walk in for notary or passport photos?",
    a: "Yes. Walk-ins are always welcome for notary services and passport photos during regular business hours (Mon–Fri 8 AM–5 PM, Sat 8 AM–4 PM). No appointment needed.",
  },
  {
    q: "How far in advance do I need to schedule a testing appointment?",
    a: "We recommend booking at least 48–72 hours in advance to secure your preferred time slot. Saturday bootcamp seats fill quickly — book at least a week ahead when possible.",
  },
  {
    q: "Where do I park?",
    a: "Free parking is available directly in front of our suite at 616 FM 1960 Road West, Suite 101, Houston, Texas 77090. We're in a strip center with plenty of spots.",
  },
  {
    q: "What happens if I need to reschedule?",
    a: "Contact us at least 24 hours before your appointment to reschedule at no charge. For Pearson VUE exams, their reschedule policy applies — check your confirmation email from them for details.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <SEO
        canonical="/"
        description="LBS Business Services Center provides notary services, passport photos, and website design in Houston, Texas, plus authorized Pearson VUE & Certiport exam testing."
      />
      <Header />

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-hero">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
                <Shield className="w-4 h-4 text-[#FF2D55]" />
                One Stop. Many Solutions.
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                data-testid="text-hero-title"
              >
                Your{" "}
                <span className="bg-gradient-to-r from-[#FF6A00] via-[#FF2D55] to-[#8A2BE2] bg-clip-text text-transparent">
                  Business.
                </span>
                <br className="hidden sm:block" /> Our Solutions.
              </h1>
              <p
                className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg"
                data-testid="text-hero-subtitle"
              >
                Professional services that help you save time, stay productive, and keep your business moving, right here in Houston, Texas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/book">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white text-base px-8 rounded-full"
                    data-testid="button-hero-book"
                  >
                    Book a Service
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white bg-white/5 backdrop-blur-sm rounded-full"
                    data-testid="button-hero-browse"
                  >
                    Browse Services
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4">
                {[
                  { icon: Zap, label: "Fast & Reliable Service" },
                  { icon: Headset, label: "Professional Support" },
                  { icon: Users, label: "Trusted by Our Community" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-white/80">
                    <item.icon className="w-4 h-4 text-[#FF2D55]" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                  src={heroImg}
                  alt="LBS Business Services Center"
                  className="w-full h-[420px] object-cover"
                  data-testid="img-hero"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE BUSINESS SERVICES ── */}
      <section className="py-8 bg-background border-b border-border/50" data-testid="section-core-services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 max-w-3xl mx-auto gap-x-4 gap-y-8">
            {coreServiceStrip.map((item) => (
              <Link key={item.title} href={item.href}>
                <div
                  className="flex flex-col items-center text-center gap-2 cursor-pointer group"
                  data-testid={`link-core-service-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-colors"
                    style={{ borderColor: `${item.color}26`, color: item.color }}
                  >
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.tagline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services?filter=business">
              <Button variant="outline" size="sm" className="text-sm" data-testid="button-view-all-services">
                View all business services
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXAM TESTING SERVICES (secondary operation) ── */}
      <section className="py-14 bg-background border-y border-border/50" data-testid="section-testing-services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF2D55]">More Services</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Exam Testing Services</h2>
                <p className="text-white/75 leading-relaxed max-w-2xl">
                  Professional exam testing and preparation services provided in a quiet, secure, and focused
                  environment. Testing operations are managed separately from our walk-in business services.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/certiport-testing-center-houston"
                    aria-label="View Pearson VUE testing information"
                    className="bg-white rounded-lg px-4 py-2.5 flex items-center gap-2 hover-elevate"
                  >
                    <Shield className="w-5 h-5 text-[#0D1B3D]" />
                    <span className="text-sm font-semibold text-[#0D1B3D]">Pearson VUE</span>
                  </Link>
                  <Link
                    href="/certiport-testing-center-houston"
                    aria-label="View Certiport testing information"
                    className="bg-white rounded-lg px-4 py-2.5 flex items-center gap-2 hover-elevate"
                  >
                    <Award className="w-5 h-5 text-[#0D1B3D]" />
                    <span className="text-sm font-semibold text-[#0D1B3D]">Certiport</span>
                  </Link>
                </div>
              </div>
              <div className="flex lg:justify-end">
                <Link href="/certiport-testing-center-houston">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white bg-white/5 backdrop-blur-sm rounded-full"
                    data-testid="button-view-testing-info"
                  >
                    View Testing Info
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-muted/30" data-testid="section-testimonials">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6A00]">What Our Clients Say</p>
            <h2 className="text-3xl md:text-4xl font-bold">Real Results, Real People</h2>
            <p className="text-muted-foreground text-lg">
              Join hundreds of Houston professionals who passed their exams at LBS.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50 bg-card flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1 space-y-4">
                  <div className="text-[#fbbf24] text-sm tracking-widest">★★★★★</div>
                  <p className="text-sm text-foreground leading-relaxed italic flex-1 line-clamp-5">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="w-9 h-9 rounded-full bg-[#0D1B3D] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.service}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-muted-foreground">
            See more reviews on{" "}
            <a
              href="https://g.page/r/lbs-test-exam-center/review"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0D1B3D] dark:text-[#0077FF] font-medium hover:underline"
            >
              Google
            </a>
          </p>
        </div>
      </section>

      {/* ── WHY CHOOSE LBS ── */}
      <section className="py-14 bg-background" data-testid="section-why-choose">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-[#FF6A00]" />
            <h2 className="text-2xl md:text-3xl font-bold text-center" data-testid="text-why-heading">
              Why Choose LBS?
            </h2>
            <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-[#FF6A00]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {whyChooseItems.map((item) => (
              <div key={item.title} className="text-center space-y-3" data-testid={`card-why-${item.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                <div className="w-16 h-16 mx-auto rounded-2xl border-2 border-[#0D1B3D]/15 dark:border-[#0077FF]/30 flex items-center justify-center text-[#0D1B3D] dark:text-[#0077FF]">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="max-w-md mx-auto">
            <Card className="border-border/50">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <img src={logoImg} alt="LBS" className="w-14 h-14 object-contain rounded-md" loading="lazy" decoding="async" />
                  <div>
                    <h3 className="text-lg font-bold text-[#0D1B3D] dark:text-white">Visit Us Today</h3>
                    <p className="text-sm text-muted-foreground">Walk-ins welcome for most services</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6A00] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-sm text-muted-foreground">
                        616 FM 1960 Road West, Suite 101<br />Houston, Texas 77090-3048
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#FF6A00] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <a href="tel:2818365357" className="text-sm text-muted-foreground hover:text-foreground">
                        281-836-5357
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#FF6A00] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Mon – Fri: 8:00 AM – 5:00 PM<br />
                        Sat: 8:00 AM – 4:00 PM<br />
                        Closed Sun
                      </p>
                    </div>
                  </div>
                </div>
                <Link href="/contact">
                  <Button
                    className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white mt-4 rounded-full"
                    data-testid="button-contact-cta"
                  >
                    Get Directions & Contact
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── BUSINESS SOLUTIONS ── */}
      <section className="py-14 bg-background" data-testid="section-business-solutions">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-muted/30 rounded-2xl p-8 md:p-12">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF6A00]">Solutions for Your Business</p>
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-business-solutions-heading">
                Services That Help Your Business Grow.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                From everyday essentials to specialized business solutions, we help you save time and focus on what
                matters most.
              </p>
              <Link href="/for-businesses">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-explore-business-solutions"
                >
                  Explore Business Solutions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/images/business-collaboration.png"
                alt="Business professionals collaborating"
                className="w-full h-72 md:h-80 object-cover"
                loading="lazy"
                decoding="async"
                data-testid="img-business-solutions"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 bg-muted/30" data-testid="section-faq">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6A00]">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know before you arrive.</p>
          </div>
          <div className="max-w-2xl mx-auto divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-card">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-[#FF6A00] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Still have questions?{" "}
              <a href="tel:2818365357" className="text-[#FF6A00] font-semibold hover:underline">
                Call us at 281-836-5357
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CONTACT BAR ── */}
      <section className="py-8 bg-[#0D1B3D]" data-testid="section-cta">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <a href="tel:2818365357" className="flex items-center gap-4" data-testid="button-cta-call">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF6A00] to-[#FF2D55] flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF2D55]">We're Here to Help</p>
                <p className="text-2xl font-bold text-white">281-836-5357</p>
                <p className="text-sm text-[#FF2D55] font-medium">Walk-ins Welcome &nbsp;|&nbsp; Open to the Public</p>
              </div>
            </a>
            <div className="flex items-center gap-4 md:justify-end">
              <div className="w-14 h-14 rounded-full border-2 border-white/30 flex items-center justify-center shrink-0">
                <Smile className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-white">Friendly. Local. Professional.</p>
                <p className="text-sm text-white/70">Our goal is simple: deliver exceptional service with a personal touch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── MOBILE STICKY CTA BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-2.5 p-3 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg" data-testid="mobile-sticky-bar">
        <a href="tel:2818365357" className="flex-1">
          <Button variant="outline" className="w-full gap-2 font-semibold text-sm h-11 rounded-full" size="sm">
            <Phone className="w-4 h-4" />
            Call
          </Button>
        </a>
        <Link href="/book" className="flex-[2]">
          <Button
            className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white font-bold text-sm h-11 rounded-full"
            size="sm"
          >
            Book a Service
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
