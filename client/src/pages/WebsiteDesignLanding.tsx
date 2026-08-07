import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronDown,
  Globe,
  Send,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { testimonials } from "@/lib/testimonials";
import websiteDesignImg from "@assets/service-website-design.jpg";

const MAPS_URL = "https://maps.google.com/?q=616+FM+1960+Rd+W+Ste+101+Houston+TX+77090";
const SERVICE_AREA_ZIPS = ["77090", "77060", "77066", "77067", "77068", "77069"];
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const FAQS = [
  {
    q: "Do you offer website design near me in Houston?",
    a: "Yes. LBS Business Services Center provides website design for small businesses and entrepreneurs from our office at 616 FM 1960 Road West, Suite 101, Houston, TX 77090.",
  },
  {
    q: "How much does website design cost?",
    a: "Every project is quoted individually based on scope and features. Tell us about your business and what you need using the form below, and we'll follow up with a free custom quote. No obligation.",
  },
  {
    q: "How long does a website project take?",
    a: "Timelines vary by project scope. We'll give you a realistic timeline as part of your free quote once we understand your needs.",
  },
  {
    q: "Do I need an appointment for a website design consultation?",
    a: "Consultations are by appointment. Call 281-836-5357 or submit the form below and we'll reach out to schedule a time that works for you.",
  },
  {
    q: "Can you help with an existing website, not just new builds?",
    a: "Yes. Tell us about your current site and what you'd like changed or improved in the project details field below.",
  },
];

export default function WebsiteDesignLanding() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  // Set when the widget script fails to load/render, or never finishes
  // within a reasonable window (blocked by an ad/privacy blocker, network
  // issue, or a misconfigured/domain-restricted site key). Without this,
  // the submit button below stayed hard-disabled forever with no
  // explanation the moment this third-party script had any trouble — a
  // fully-completed form could never be submitted. Falling back to "let
  // them submit" is safe: the server still does its own captcha
  // verification when RECAPTCHA_SECRET_KEY is configured, and returns a
  // real, visible error via the existing onError toast if that fails — so
  // this only removes a silent, unrecoverable dead end.
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    details: "",
  });

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;

    if (document.querySelector('script[src*="recaptcha"]')) {
      if (window.grecaptcha && window.grecaptcha.render) {
        renderCaptcha();
      }
      return;
    }

    const loadTimeout = window.setTimeout(() => setCaptchaError(true), 8000);
    window.onRecaptchaLoad = () => {
      window.clearTimeout(loadTimeout);
      setCaptchaLoaded(true);
      renderCaptcha();
    };

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(loadTimeout);
      setCaptchaError(true);
    };
    document.head.appendChild(script);

    return () => {
      window.clearTimeout(loadTimeout);
      window.onRecaptchaLoad = () => {};
    };
  }, []);

  const renderCaptcha = () => {
    if (captchaRef.current && window.grecaptcha && window.grecaptcha.render) {
      try {
        captchaRef.current.innerHTML = "";
        window.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
          // Fires when the widget itself can't reach Google (network issue,
          // or the site key is domain-restricted and this domain isn't on
          // its allowlist) — a more reliable signal for this than try/catch
          // below, which only guards the synchronous "already rendered"
          // case and would otherwise leave the button dead with no feedback.
          "error-callback": () => setCaptchaError(true),
        });
      } catch (e) {
        // Captcha might already be rendered
      }
    }
  };

  useEffect(() => {
    if (captchaLoaded) renderCaptcha();
  }, [captchaLoaded]);

  const quoteMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; service: string; message: string; captchaToken?: string }) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quote Request Sent!",
        description: "We'll follow up with a free custom quote as soon as possible.",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send your request. Please try again.",
        variant: "destructive",
      });
      if (window.grecaptcha) window.grecaptcha.reset();
      setCaptchaToken(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      toast({
        title: "Please complete the captcha",
        description: "Verify that you are not a robot.",
        variant: "destructive",
      });
      return;
    }

    const message = [
      formData.businessName ? `Business Name: ${formData.businessName}` : null,
      "Website Needs:",
      formData.details,
    ].filter(Boolean).join("\n\n");

    quoteMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      service: "website-design",
      message,
      captchaToken: captchaToken || undefined,
    });
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Website Design",
    "description": "Practical website design for Houston small businesses and entrepreneurs, with free custom quotes.",
    "url": "https://www.lbs4.com/website-design-houston-77090",
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.lbs4.com/#business",
      "name": "Linton Business Solutions LLC",
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Website Design in Houston TX | Free Custom Quote"
        canonical="/website-design-houston-77090"
        description="Practical website design for Houston small businesses and entrepreneurs. Request a free custom quote from LBS Business Services Center near FM 1960."
        schema={schema}
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${websiteDesignImg})` }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link href="/for-businesses">
            <Button variant="ghost" size="sm" className="text-white/80 mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Business Services
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white" data-testid="text-detail-title">
                Website Design in Houston, TX
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Practical website design for Houston small businesses and entrepreneurs. Tell us
                about your project below for a free custom quote.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-sm text-white/90" data-testid="text-visit-note">
                  Consultations by appointment
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

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-xl overflow-hidden">
                <img
                  src={websiteDesignImg}
                  alt="Website Design"
                  className="w-full h-64 md:h-80 object-cover"
                  loading="lazy"
                  decoding="async"
                  data-testid="img-service-detail"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">About This Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We build practical, effective websites for Houston-area small businesses and
                  entrepreneurs who need an online presence that works. From a simple business
                  site to something more custom, we'll scope your project and provide a free
                  quote before any work begins. No fixed packages, no surprises.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Custom quote, no fixed packages",
                    "Mobile-friendly, responsive design",
                    "Built for Houston small businesses",
                    "Consultation to scope your project",
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-[#FF6A00] mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4" data-testid="section-service-area">
                <h2 className="text-2xl font-bold">Proudly Serving the Houston Area</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Located at 616 FM 1960 Road West, Suite 101, near the FM 1960 &amp; I-45
                  corridor, we serve customers within approximately 5–8 miles of our office,
                  including the {SERVICE_AREA_ZIPS.join(", ")} ZIP codes.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div
                className="rounded-md bg-[#FF6A00]/10 border border-[#FF6A00]/30 px-4 py-3 text-sm font-semibold text-[#0D1B3D] dark:text-white"
                data-testid="text-service-offer"
              >
                Free initial consultation on every website project
              </div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-bold text-[#0D1B3D] dark:text-white">
                      Free Quote
                    </div>
                    <div className="text-sm text-muted-foreground">Custom pricing based on your project</div>
                  </div>

                  <div className="border-t border-border/50 pt-5">
                    {submitted ? (
                      <div className="text-center py-6 space-y-3" data-testid="div-form-success">
                        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-7 h-7 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-lg">Request Sent!</h3>
                        <p className="text-sm text-muted-foreground">
                          Thank you. We'll follow up with a free custom quote as soon as possible.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSubmitted(false);
                            setCaptchaToken(null);
                            setFormData({ name: "", email: "", phone: "", businessName: "", details: "" });
                            setTimeout(() => renderCaptcha(), 100);
                          }}
                          data-testid="button-send-another"
                        >
                          Request Another Quote
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-website-quote">
                        <h3 className="font-semibold text-lg">Request a Free Quote</h3>
                        <div>
                          <Label htmlFor="wd-name" className="text-sm">Full Name *</Label>
                          <Input
                            id="wd-name"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            data-testid="input-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wd-email" className="text-sm">Email *</Label>
                          <Input
                            id="wd-email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            data-testid="input-email"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wd-phone" className="text-sm">Phone *</Label>
                          <Input
                            id="wd-phone"
                            type="tel"
                            placeholder="(123) 456-7890"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                            data-testid="input-phone"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wd-business" className="text-sm">Business Name (optional)</Label>
                          <Input
                            id="wd-business"
                            placeholder="Your business name"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            data-testid="input-business-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wd-details" className="text-sm">Website Needs *</Label>
                          <Textarea
                            id="wd-details"
                            placeholder="Tell us about your business and what you need: new site, redesign, e-commerce, etc."
                            rows={4}
                            value={formData.details}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            required
                            data-testid="input-details"
                          />
                        </div>

                        {RECAPTCHA_SITE_KEY && (
                          <div className="flex flex-col items-center gap-2">
                            <div ref={captchaRef} data-testid="recaptcha-container" />
                            {captchaError && (
                              <p className="text-xs text-muted-foreground text-center" data-testid="text-captcha-fallback">
                                Verification widget couldn't load — you can still submit; we'll verify your request on our end.
                              </p>
                            )}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                          disabled={quoteMutation.isPending || (RECAPTCHA_SITE_KEY ? !captchaToken && !captchaError : false)}
                          data-testid="button-submit-quote"
                        >
                          {quoteMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Request a Free Quote
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <h3 className="font-semibold text-sm">Visit Us</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#FF6A00]" />
                        <span>
                          616 FM 1960 Road West, Suite 101
                          <br />
                          Houston, Texas 77090-3048
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0 text-[#FF6A00]" />
                        <a href="tel:2818365357">281-836-5357</a>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#FF6A00]" />
                        <span>
                          Mon – Fri: 8 AM – 5 PM
                          <br />
                          Sat: 8 AM – 4 PM
                          <br />
                          Closed Sun
                        </span>
                      </div>
                    </div>
                    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="sm" className="w-full gap-1.5" data-testid="button-map-directions">
                        <MapPin className="w-4 h-4" />
                        Get Directions &amp; Parking Info
                      </Button>
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Free customer parking is available directly in front of our suite.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/30" data-testid="section-service-faq">
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
                  data-testid={`button-service-faq-${i}`}
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

      <section className="py-14 bg-background" data-testid="section-service-reviews">
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
