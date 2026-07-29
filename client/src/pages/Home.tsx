import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  Shield,
  Clock,
  Users,
  Award,
  ChevronDown,
  Zap,
  Headset,
  Building2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import ServiceCard from "@/components/ServiceCard";
import { services } from "@/lib/services";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

const businessServices = services.filter((s) => s.category === "business");

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
    a: "Free parking is available directly in front of our suite at 616 FM 1960 Rd W, Ste 101, Houston TX 77090. We're in a strip center with plenty of spots.",
  },
  {
    q: "What happens if I need to reschedule?",
    a: "Contact us at least 24 hours before your appointment to reschedule at no charge. For Pearson VUE exams, their reschedule policy applies — check your confirmation email from them for details.",
  },
];

const testimonials = [
  {
    initials: "KS",
    name: "Kelly Somes",
    service: "Google Review",
    quote:
      "I have no words to describe how great Linton Business Solutions was. The facility is clean, comfortable and very well managed. I was welcomed with a smile when I first walked in. Mr. Linton was so kind and welcoming — he definitely put me at ease. I had to take an exam and was very nervous. I've taken other tests at other testing centers and this was by far the best experience. Thank you Mr. Linton.",
  },
  {
    initials: "CF",
    name: "Cayla Fisch",
    service: "Google Review",
    quote:
      "They are absolutely amazing!!! So helpful in every way and literally my own personal cheerleaders!! They didn't let me give up and made sure I was gonna pass!! God send people and so thankful for them!!",
  },
  {
    initials: "KL",
    name: "Kel Living",
    service: "Google Review",
    quote:
      "I had a wonderful experience. Everyone was so nice. The process from setup all the way to pressing submit was great. They provide reassurance and speak positivity into you to help calm you before entering the testing area. And let's not forget the celebration they provide after you pass! Definitely will always be my site of choice!!! Thank you all for everything.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <SEO
        canonical="/"
        description="LBS Business Services Center provides printing, scanning, notary, passport photos, faxing, resume services and website design in Houston, Texas."
      />
      <Header />

      {/* ── HERO ── */}
      <section className="relative min-h-[480px] md:min-h-[560px] flex items-center bg-gradient-to-br from-[#0f1f3d] via-[#1a2d52] to-[#2a4f8e]" data-testid="section-hero">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <Shield className="w-4 h-4 text-[#f07050]" />
              One Stop. Many Solutions.
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              data-testid="text-hero-title"
            >
              Your{" "}
              <span className="bg-gradient-to-r from-[#e85d40] via-[#c9a84c] to-[#e8c86c] bg-clip-text text-transparent">
                Business.
              </span>
              <br className="hidden sm:block" /> Our Solutions.
            </h1>
            <p
              className="text-lg md:text-xl text-white/80 leading-relaxed max-w-lg"
              data-testid="text-hero-subtitle"
            >
              Professional services that help you save time, stay productive, and keep your business moving — right here in Houston, TX.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/book">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
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
                  className="border-white/30 text-white bg-white/5 backdrop-blur-sm"
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
                  <item.icon className="w-4 h-4 text-[#e8c86c]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE BUSINESS SERVICES ── */}
      <section className="py-14 bg-muted/30" data-testid="section-core-services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-core-services-heading">
              Explore Our Services
            </h2>
            <p className="text-muted-foreground text-lg">
              Everyday business essentials, all under one roof in Houston, TX.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessServices.map((service) => (
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
            {/* Website Design — quote-based, not a bookable calendar service */}
            <ServiceCard
              title="Website Design"
              description="Practical website design for Houston small businesses and entrepreneurs. Request a free quote."
              slug="website-design"
              href="/for-businesses"
              icon={<Building2 className="w-5 h-5" />}
              buttonLabel="Request a Quote"
            />
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
          <div className="rounded-2xl bg-gradient-to-br from-[#1a2d52] to-[#2a4f8e] p-8 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#e8c86c]">Secondary Operation</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Exam Testing Services</h2>
                <p className="text-white/75 leading-relaxed max-w-2xl">
                  Professional exam testing and preparation services provided in a quiet, secure, and focused
                  environment. Testing operations are managed separately from our walk-in business services.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/services/certification-exam-testing"
                    aria-label="View Pearson VUE testing information"
                    className="bg-white rounded-lg px-4 py-2.5 flex items-center gap-2 hover-elevate"
                  >
                    <Shield className="w-5 h-5 text-[#1e3a6e]" />
                    <span className="text-sm font-semibold text-[#1e3a6e]">Pearson VUE</span>
                  </Link>
                  <Link
                    href="/services/certification-exam-testing"
                    aria-label="View Certiport testing information"
                    className="bg-white rounded-lg px-4 py-2.5 flex items-center gap-2 hover-elevate"
                  >
                    <Award className="w-5 h-5 text-[#1e3a6e]" />
                    <span className="text-sm font-semibold text-[#1e3a6e]">Certiport</span>
                  </Link>
                </div>
              </div>
              <div className="flex lg:justify-end">
                <Link href="/services/certification-exam-testing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white bg-white/5 backdrop-blur-sm"
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
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">What Our Clients Say</p>
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
                  <p className="text-sm text-foreground leading-relaxed italic flex-1">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="w-9 h-9 rounded-full bg-[#1e3a6e] flex items-center justify-center text-white text-xs font-bold shrink-0">
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
              className="text-[#1e3a6e] dark:text-[#6b9aed] font-medium hover:underline"
            >
              Google
            </a>
          </p>
        </div>
      </section>

      {/* ── WHY CHOOSE LBS ── */}
      <section className="py-14 bg-background" data-testid="section-why-choose">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="text-why-heading">
                Why Choose LBS?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Quality services you can count on, from a team that knows what it takes to help your business succeed.
              </p>
              <div className="space-y-4">
                {[
                  "Professional and reliable — quality services you can count on, every time",
                  "Experienced team of skilled professionals ready to help",
                  "Secure and confidential handling of your documents and information",
                  "Convenient and local — serving Houston, TX with pride",
                  "Walk-in printing, notary, and passport photos — no appointment needed",
                  "Multiple professional business services under one roof",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="outline" size="lg" className="mt-4" data-testid="button-learn-about">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="border-border/50">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={logoImg} alt="LBS" className="w-16 h-16 object-contain rounded-md" />
                    <div>
                      <h3 className="text-xl font-bold text-[#1e3a6e] dark:text-white">Visit Us Today</h3>
                      <p className="text-sm text-muted-foreground">Walk-ins welcome for most services</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Address</p>
                        <p className="text-sm text-muted-foreground">
                          616 FM 1960 Rd W, Ste 101<br />Houston, TX 77090-3048
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Phone</p>
                        <a href="tel:2818365357" className="text-sm text-muted-foreground hover:text-foreground">
                          (281) 836-5357
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#e85d40] mt-0.5 shrink-0" />
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
                      className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white mt-4"
                      data-testid="button-contact-cta"
                    >
                      Get Directions & Contact
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS SOLUTIONS ── */}
      <section className="py-14 bg-background" data-testid="section-business-solutions">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-muted/30 rounded-2xl p-8 md:p-12">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Solutions for Your Business</p>
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
                  className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white"
                  data-testid="button-explore-business-solutions"
                >
                  Explore Business Solutions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Building2, label: "Corporate Notary Program" },
                { icon: Award, label: "Website Design" },
                { icon: Users, label: "Resume Services" },
                { icon: Headset, label: "Ongoing Business Support" },
              ].map((item) => (
                <div key={item.label} className="bg-card border border-border/50 rounded-xl p-5 text-center space-y-2">
                  <item.icon className="w-6 h-6 mx-auto text-[#1e3a6e] dark:text-[#6b9aed]" />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 bg-muted/30" data-testid="section-faq">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Common Questions</p>
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
                    className={`w-4 h-4 shrink-0 text-[#c9a84c] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
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
              <a href="tel:2818365357" className="text-[#e85d40] font-semibold hover:underline">
                Call us at (281) 836-5357
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-14 bg-gradient-to-r from-[#1e3a6e] to-[#2a4f8e]" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Ready When You Are</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Visit LBS Business Services Center
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Printing, notary, passport photos, faxing, resume help, website design, and exam testing — all at one Houston location.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/book">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white text-base px-8"
                data-testid="button-cta-book"
              >
                Book a Service
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="tel:2818365357" data-testid="button-cta-call">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call (281) 836-5357
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── MOBILE STICKY CTA BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-2.5 p-3 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg" data-testid="mobile-sticky-bar">
        <a href="tel:2818365357" className="flex-1">
          <Button variant="outline" className="w-full gap-2 font-semibold text-sm h-11" size="sm">
            <Phone className="w-4 h-4" />
            Call
          </Button>
        </a>
        <Link href="/book" className="flex-[2]">
          <Button
            className="w-full bg-gradient-to-r from-[#e85d40] to-[#f07050] text-white font-bold text-sm h-11"
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
