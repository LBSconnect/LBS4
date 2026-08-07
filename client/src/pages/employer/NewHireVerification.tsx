import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/components/Analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardCheck,
  FilePlus2,
  CalendarClock,
  FolderCheck,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  Car,
  BarChart3,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Loader2,
  Send,
  ShieldCheck,
  Building2,
  ScrollText,
  FileWarning,
  Printer,
} from "lucide-react";
import {
  EMPLOYER_AGREEMENT_ROUTE,
  EMPLOYER_INTAKE_ROUTE,
  EMPLOYER_PRICING_SHEET_ROUTE,
  EVERIFY_AGENT_DESCRIPTION,
  EVERIFY_FOOTER_DISCLAIMER,
  NO_LEGAL_ADVICE_NOTE,
  CONSENT_TEXT,
  SENSITIVE_DATA_WARNING,
  DESIRED_SERVICE_OPTIONS,
  CONSULTATION_METHOD_OPTIONS,
  EMPLOYEE_COUNT_OPTIONS,
  NEW_HIRES_PER_MONTH_OPTIONS,
  HIRING_LOCATIONS_OPTIONS,
  managedServices,
  monthlyPlans,
  featuredPackage,
  monthlyPlansNote,
  payAsYouGoServices,
  payAsYouGoNote,
  howItWorksSteps,
  industriesServed,
  compliancePoints,
  employerFaqs,
  employerPainPoints,
  whatLbsHandlesCards,
  gettingStartedSteps,
  diyComparisonRows,
  whyPayHeadlinePoints,
  postEnrollmentTimeline,
  securityTrustPoints,
  employersServedCards,
} from "@/lib/employerServices";
import { PORTAL_ROUTES } from "@/lib/i9Portal";

const MAPS_URL = "https://maps.google.com/?q=616+FM+1960+Rd+W+Ste+101+Houston+TX+77090";
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const MANAGED_ICONS: Record<string, typeof ClipboardCheck> = {
  ClipboardCheck,
  FilePlus2,
  CalendarClock,
  FolderCheck,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  Car,
  BarChart3,
  GraduationCap,
};

const YES_NO_NOT_SURE_OPTIONS = ["Yes", "No", "Not Sure"] as const;
type YesNoNotSure = (typeof YES_NO_NOT_SURE_OPTIONS)[number];
function toApiYesNoNotSure(v: YesNoNotSure | ""): "yes" | "no" | "not_sure" | "" {
  if (v === "Yes") return "yes";
  if (v === "No") return "no";
  if (v === "Not Sure") return "not_sure";
  return "";
}

const emptyForm = {
  contactName: "",
  companyName: "",
  businessEmail: "",
  businessPhone: "",
  companyAddress: "",
  industry: "",
  employeeCount: "",
  newHiresPerMonth: "",
  hiringLocations: "",
  alreadyEnrolledInEverify: "" as YesNoNotSure | "",
  usesAnotherEmployerAgent: "" as YesNoNotSure | "",
  federalContractorStatus: "" as YesNoNotSure | "",
  desiredService: "" as (typeof DESIRED_SERVICE_OPTIONS)[number] | "",
  preferredConsultationMethod: "" as (typeof CONSULTATION_METHOD_OPTIONS)[number] | "",
  message: "",
  consent: false,
};

export default function NewHireVerification() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formStarted, setFormStarted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  // Set when the widget script fails to load/render, or never finishes
  // within a reasonable window (blocked by an ad/privacy blocker, network
  // issue, or a misconfigured/domain-restricted site key). Without this,
  // the submit button below stayed hard-disabled forever with no
  // explanation the moment this third-party script had any trouble —
  // a fully-completed form could never be submitted. Falling back to
  // "let them submit" is safe: the server (server/i9Routes.ts) still does
  // its own captcha verification when RECAPTCHA_SECRET_KEY is configured,
  // and returns a real, visible error via the existing onError toast if
  // that fails — so this only removes a silent, unrecoverable dead end.
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    trackEvent("employer_verification_page_view");
  }, []);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    if (document.querySelector('script[src*="recaptcha"]')) {
      if (window.grecaptcha && window.grecaptcha.render) renderCaptcha();
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

  const consultationMutation = useMutation({
    mutationFn: async (data: typeof formData & { captchaToken?: string }) => {
      // Maps this page's field names onto the I-9 lead schema (server/i9Schema.ts) —
      // kept as a mapping step, rather than renaming the form's own state, to avoid
      // an invasive rename across this file's ~900 lines for a same-page-only detail.
      const payload = {
        contactName: data.contactName,
        companyName: data.companyName,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        companyAddress: data.companyAddress,
        industry: data.industry,
        employeeCount: data.employeeCount,
        monthlyHires: data.newHiresPerMonth,
        hiringLocations: data.hiringLocations,
        alreadyEnrolledInEverify: toApiYesNoNotSure(data.alreadyEnrolledInEverify),
        usesAnotherEmployerAgent: toApiYesNoNotSure(data.usesAnotherEmployerAgent),
        federalContractorStatus: toApiYesNoNotSure(data.federalContractorStatus),
        desiredService: data.desiredService,
        preferredConsultationMethod: data.preferredConsultationMethod,
        message: data.message,
        consentToContact: data.consent,
        captchaToken: data.captchaToken,
      };
      const res = await apiRequest("POST", "/api/i9/leads", payload);
      return await res.json();
    },
    onSuccess: () => {
      trackEvent("employer_consultation_form_submit", { desired_service: formData.desiredService });
      if (formData.desiredService === "Mobile document examination") {
        trackEvent("mobile_service_request");
      }
      if (formData.desiredService === "In-office document examination") {
        trackEvent("in_office_appointment_request");
      }
      toast({
        title: "Consultation Request Sent!",
        description: "We'll follow up within one business day.",
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

  const handleFieldStart = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackEvent("employer_consultation_form_start");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.desiredService || !formData.preferredConsultationMethod) {
      toast({
        title: "Missing information",
        description: "Please select a desired service and preferred consultation method.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.alreadyEnrolledInEverify || !formData.usesAnotherEmployerAgent || !formData.federalContractorStatus) {
      toast({
        title: "Missing information",
        description: "Please answer the E-Verify enrollment, Employer Agent, and federal contractor questions.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.consent) {
      toast({
        title: "Consent required",
        description: "Please confirm you agree to be contacted before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (RECAPTCHA_SITE_KEY && !captchaToken) {
      toast({
        title: "Please complete the captcha",
        description: "Verify that you are not a robot.",
        variant: "destructive",
      });
      return;
    }

    consultationMutation.mutate({
      ...formData,
      captchaToken: captchaToken || undefined,
    });
  };

  const handlePlanClick = (planId: string, planName: string) => {
    trackEvent("pricing_plan_select", { plan: planId, plan_name: planName });
  };

  const handlePhoneClick = () => {
    trackEvent("phone_click", { location: "employer_services_page" });
  };

  const handleConsultationClick = (location: string) => {
    trackEvent("employer_consultation_cta_click", { location });
  };

  const canonicalPath = "/employer-services/new-hire-verification";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": "https://www.lbs4.com/#business",
        "name": "LBS Business Services Center",
        "alternateName": "Linton Business Solutions LLC",
        "telephone": "+12818365357",
        "priceRange": "$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "616 FM 1960 Rd W, Ste 101",
          "addressLocality": "Houston",
          "addressRegion": "TX",
          "postalCode": "77090-3048",
          "addressCountry": "US",
        },
        "areaServed": { "@type": "City", "name": "Houston", "addressRegion": "TX" },
      },
      {
        "@type": "Service",
        "name": "New-Hire Verification & Form I-9 Support",
        "serviceType": "E-Verify case management and Form I-9 administrative support",
        "description": EVERIFY_AGENT_DESCRIPTION,
        "url": `https://www.lbs4.com${canonicalPath}`,
        "provider": { "@id": "https://www.lbs4.com/#business" },
        "areaServed": { "@type": "City", "name": "Houston", "addressRegion": "TX" },
        "disambiguatingDescription":
          "Administrative case-management and Form I-9 support service. LBS is not DHS, USCIS, or a government agency, and does not sell or grant access to E-Verify.",
        "offers": monthlyPlans.map((plan) => ({
          "@type": "Offer",
          "name": `${plan.name} Plan`,
          "price": plan.price.replace(/[^0-9.]/g, ""),
          "priceCurrency": "USD",
          "url": `https://www.lbs4.com${canonicalPath}#pricing`,
        })),
      },
      {
        "@type": "FAQPage",
        "mainEntity": employerFaqs.map((faq) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": { "@type": "Answer", "text": faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.lbs4.com/" },
          { "@type": "ListItem", "position": 2, "name": "For Businesses", "item": "https://www.lbs4.com/for-businesses" },
          { "@type": "ListItem", "position": 3, "name": "New-Hire Verification & Form I-9 Support", "item": `https://www.lbs4.com${canonicalPath}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="New-Hire Verification & Form I-9 Support | LBS Houston"
        canonical={canonicalPath}
        description="LBS helps Houston employers manage Form I-9 administrative workflows, E-Verify cases, case tracking, employee document examination, mismatch notices, and monthly onboarding reports."
        schema={schema}
      />
      <Header />

      <section className="relative py-16 md:py-20 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-employer-hero">
        <div className="absolute inset-0 bg-[url('/images/business-collaboration.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <Breadcrumb>
            <BreadcrumbList className="mb-6 text-white/60">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/for-businesses" className="hover:text-white transition-colors">For Businesses</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/40" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white/90">New-Hire Verification</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <ShieldCheck className="w-4 h-4 text-[#FF2D55]" />
              Employer Services
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">New-Hire Verification for Employers</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight" data-testid="text-employer-hero-title">
              You Hire Them.<br className="hidden sm:block" /> We'll Handle the Verification Workflow.
            </h1>
            <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
              Form I-9 support and E-Verify case management for employers who want a simpler way to manage
              new-hire verification.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href={PORTAL_ROUTES.register}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                  data-testid="button-hero-start-onboarding"
                  onClick={() => trackEvent("employer_enrollment_cta_click", { location: "hero" })}
                >
                  Start Employer Enrollment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#consultation" onClick={() => { handleConsultationClick("hero"); trackEvent("verification_specialist_click", { location: "hero" }); }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white bg-white/5 backdrop-blur-sm rounded-full"
                  data-testid="button-hero-talk-to-specialist"
                >
                  Talk to a Verification Specialist
                </Button>
              </a>
            </div>
            <div className="pt-1">
              <Link href={PORTAL_ROUTES.login}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                  data-testid="button-hero-client-portal-login"
                  onClick={() => trackEvent("portal_login_click", { location: "hero" })}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Employer Login
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-sm text-white/70" data-testid="text-hero-trust-line">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#FF2D55]" /> Secure Information Handling</span>
              <span className="flex items-center gap-1.5"><FolderCheck className="w-4 h-4 text-[#FF2D55]" /> Organized Verification Records</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#FF2D55]" /> Employer-Agent Support</span>
              <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-[#FF2D55]" /> Human Assistance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── EMPLOYER PAIN ── */}
      <section className="py-16 bg-background" data-testid="section-employer-pain">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-3 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Stop Chasing New-Hire Verification Tasks</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            You have employees to onboard and a business to run. LBS helps manage the administrative
            verification workflow so your team can spend less time processing cases and more time running
            the business.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {employerPainPoints.map((point) => {
            const Icon = MANAGED_ICONS[point.icon] ?? ClipboardCheck;
            return (
              <div key={point.title} className="border border-border/50 bg-card rounded-xl p-5 space-y-2.5" data-testid={`card-pain-${point.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <Icon className="w-5 h-5 text-[#FF6A00]" />
                <h3 className="font-semibold text-sm">{point.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{point.copy}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── WHAT LBS HANDLES (summary) ── */}
      <section className="py-16 bg-muted/30" data-testid="section-what-lbs-handles">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">What You're Paying For</p>
            <h2 className="text-3xl md:text-4xl font-bold">What LBS Handles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whatLbsHandlesCards.map((card) => {
              const Icon = MANAGED_ICONS[card.icon] ?? ClipboardCheck;
              return (
                <div key={card.title} className="border border-border/50 bg-card rounded-xl p-6 space-y-3 hover-elevate" data-testid={`card-handles-${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <div className="w-11 h-11 rounded-xl bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center text-[#0D1B3D] dark:text-[#0077FF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GETTING STARTED (3-step) ── */}
      <section className="py-16 bg-background" data-testid="section-getting-started">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Getting Started Is Simple</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {gettingStartedSteps.map((s) => (
              <div key={s.step} className="text-center space-y-3" data-testid={`step-getting-started-${s.step}`}>
                <div className="text-4xl font-extrabold text-[#BD4F00] dark:text-[#FF8A3D]" aria-hidden="true">{s.step}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.copy}</p>
              </div>
            ))}
          </div>
          <div className="text-center pt-10">
            <Link href={PORTAL_ROUTES.register}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                data-testid="button-getting-started-start-enrollment"
                onClick={() => trackEvent("employer_enrollment_cta_click", { location: "getting_started" })}
              >
                Start Employer Enrollment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT LBS MANAGES ── */}
      <section className="py-16 bg-background" data-testid="section-what-lbs-manages">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Employer Support</p>
            <h2 className="text-3xl md:text-4xl font-bold">What LBS Manages for Your Business</h2>
            <p className="text-muted-foreground">{EVERIFY_AGENT_DESCRIPTION}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {managedServices.map((item) => {
              const Icon = MANAGED_ICONS[item.icon] ?? ClipboardCheck;
              return (
                <div
                  key={item.title}
                  className="border border-border/50 bg-card rounded-xl p-6 space-y-3 hover-elevate"
                  data-testid={`card-managed-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center text-[#0D1B3D] dark:text-[#0077FF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.copy}</p>
                  {item.disclaimer && (
                    <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                      {item.disclaimer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PACKAGE ── */}
      <section className="py-16 bg-muted/30" data-testid="section-featured-package">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-[#BD4F00] text-white rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide">
              Most Popular
            </span>
          </div>
          <Card className="border-2 border-[#FF6A00] shadow-lg overflow-hidden" data-testid="card-featured-package">
            <CardContent className="p-8 md:p-10 space-y-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B3D] dark:text-white">{featuredPackage.name}</h2>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-extrabold text-[#0D1B3D] dark:text-white">{featuredPackage.price}</span>
                <span className="text-muted-foreground pb-2">{featuredPackage.priceSuffix}</span>
              </div>
              <p className="text-sm text-muted-foreground">{featuredPackage.setupNote}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2">
                {featuredPackage.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link href={`${EMPLOYER_INTAKE_ROUTE}?plan=business`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                    onClick={() => handlePlanClick("business", "LBS Employee Onboarding Compliance")}
                    data-testid="button-featured-start-enrollment"
                  >
                    Start Employer Enrollment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#consultation" onClick={() => handleConsultationClick("featured_package")}>
                  <Button size="lg" variant="outline" className="rounded-full" data-testid="button-featured-schedule">
                    Schedule a Consultation
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── MONTHLY PLANS ── */}
      <section id="pricing" className="py-16 bg-background scroll-mt-20" data-testid="section-monthly-plans">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Monthly Plans</p>
            <h2 className="text-3xl md:text-4xl font-bold">Choose the Plan That Fits Your Hiring Volume</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
            {monthlyPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-card border-2 overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col ${
                  plan.badge ? "border-[#FF6A00] shadow-md" : "border-border/50"
                }`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.badge && (
                  <div className="text-center py-2 text-xs font-bold uppercase tracking-widest text-white bg-[#BD4F00]">
                    {plan.badge}
                  </div>
                )}
                <div className="p-6 space-y-5 flex flex-col flex-1">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[#0D1B3D] dark:text-white">{plan.name}</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-[#0D1B3D] dark:text-white">{plan.price}</span>
                      <span className="text-muted-foreground pb-1">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.setupNote}</p>
                  </div>
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#FF6A00]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">{plan.additionalCase}</p>
                  <Link href={`${EMPLOYER_INTAKE_ROUTE}?plan=${plan.id}`}>
                    <Button
                      className={`w-full rounded-full ${
                        plan.badge
                          ? "bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white"
                          : "bg-[#0D1B3D] text-white hover:bg-[#0D1B3D]/90"
                      }`}
                      onClick={() => handlePlanClick(plan.id, plan.name)}
                      data-testid={`button-plan-${plan.id}`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto mt-10" data-testid="text-monthly-plans-note">
            {monthlyPlansNote}
          </p>
          <div className="text-center mt-8 border-t border-border/40 pt-8 max-w-lg mx-auto">
            <p className="font-medium mb-3">Hiring 25+ employees per month?</p>
            <a href="#consultation" onClick={() => { handleConsultationClick("volume_pricing"); trackEvent("volume_pricing_click", { location: "pricing" }); }}>
              <Button variant="outline" className="rounded-full" data-testid="button-request-volume-pricing">
                Request Volume Pricing
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── E-VERIFY IS FREE. YOUR TIME ISN'T. ── */}
      <section className="py-16 bg-[#0D1B3D]" data-testid="section-why-pay-lbs">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-bold text-white">E-Verify Is Free.<br className="hidden sm:block" /> Your Time Isn't.</h2>
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Employers can participate in E-Verify directly without paying LBS. LBS charges for the professional
            administrative services surrounding the verification workflow — the tasks below are what businesses
            otherwise manage themselves:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2 text-left">
            {whyPayHeadlinePoints.map((point) => (
              <div key={point} className="flex items-start gap-2 text-sm text-white/90 bg-white/5 rounded-md px-3 py-2.5" data-testid={`chip-why-pay-${point.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <p className="text-white font-medium pt-2">LBS handles much of the administrative workflow for you.</p>
        </div>
      </section>

      {/* ── DIY VS. LBS COMPARISON ── */}
      <section className="py-16 bg-background" data-testid="section-diy-comparison">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Handle It Yourself — Or Let LBS Manage the Workflow</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm" data-testid="table-diy-comparison">
              <thead>
                <tr className="bg-muted/50 text-left">
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Do It Yourself</th>
                  <th className="px-4 py-3 font-semibold">LBS Employer-Agent Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card">
                {diyComparisonRows.map((row) => (
                  <tr key={row.task} data-testid={`row-diy-${row.task.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                    <td className="px-4 py-3 font-medium">{row.task}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.diy}</td>
                    <td className="px-4 py-3 text-[#0D1B3D] dark:text-white font-medium">{row.lbs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
            LBS does not take on the employer's legal responsibility for its employment decisions or Form I-9/E-Verify obligations.
          </p>
          <div className="text-center pt-6">
            <Link href={PORTAL_ROUTES.register}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                data-testid="button-diy-comparison-start-enrollment"
                onClick={() => trackEvent("employer_enrollment_cta_click", { location: "diy_comparison" })}
              >
                Start Employer Enrollment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PAY-AS-YOU-GO ── */}
      <section className="py-16 bg-muted/30" data-testid="section-pay-as-you-go">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-8 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Pay-As-You-Go</p>
            <h2 className="text-3xl font-bold">Pay-As-You-Go Services</h2>
          </div>
          <div className="rounded-md border border-border/50 divide-y divide-border/50 overflow-hidden bg-card">
            {payAsYouGoServices.map((item) => (
              <div
                key={item.label}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-5 py-3.5 text-sm"
                data-testid={`row-payg-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <span>{item.label}</span>
                <span className="font-semibold text-[#0D1B3D] dark:text-white">{item.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">{payAsYouGoNote}</p>
          <div className="text-center mt-6">
            <Link href={EMPLOYER_PRICING_SHEET_ROUTE} onClick={() => trackEvent("pricing_sheet_view")}>
              <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-view-pricing-sheet">
                <Printer className="w-4 h-4" />
                View Print-Friendly Pricing Sheet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 bg-background" data-testid="section-how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">The Details</p>
            <h2 className="text-3xl md:text-4xl font-bold">Your Onboarding Workflow, Step by Step</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((s) => (
              <div key={s.step} className="text-center space-y-3" data-testid={`step-how-it-works-${s.step}`}>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D1B3D] text-white flex items-center justify-center text-xl font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT FOR EMPLOYERS LIKE YOU ── */}
      <section className="py-16 bg-background" data-testid="section-employers-served">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Who We Serve</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for Employers Like You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {employersServedCards.map((card) => {
              const Icon = MANAGED_ICONS[card.icon] ?? Building2;
              return (
                <div key={card.title} className="border border-border/50 bg-card rounded-xl p-6 space-y-3" data-testid={`card-served-${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <div className="w-11 h-11 rounded-xl bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center text-[#0D1B3D] dark:text-[#0077FF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECURITY AND TRUST ── */}
      <section className="py-16 bg-[#0D1B3D]" data-testid="section-security-trust">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF2D55]">Security &amp; Trust</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Sensitive Employee Information Deserves Serious Protection</h2>
            <p className="text-white/70">
              Employment verification may involve sensitive personal information. Here's how LBS approaches it.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {securityTrustPoints.map((point) => {
              const Icon = MANAGED_ICONS[point.icon] ?? ShieldCheck;
              return (
                <div key={point.title} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2.5" data-testid={`card-security-${point.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                  <Icon className="w-5 h-5 text-[#FF2D55]" />
                  <h3 className="font-semibold text-white text-sm">{point.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{point.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT HAPPENS AFTER I ENROLL ── */}
      <section className="py-16 bg-background" data-testid="section-post-enrollment-timeline">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">What Happens After I Enroll?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {postEnrollmentTimeline.map((t, i) => (
              <div key={t.label} className="relative border border-border/50 bg-card rounded-xl p-5 space-y-2" data-testid={`step-timeline-${t.label.toLowerCase()}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">{t.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.copy}</p>
                {i < postEnrollmentTimeline.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-7 top-6 w-4 h-4 text-muted-foreground/40" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6 max-w-xl mx-auto">
            Applicable federal E-Verify enrollment and MOU steps are completed as part of activation. LBS does not
            control federal system timing.
          </p>
        </div>
      </section>

      {/* ── INDUSTRIES SERVED ── */}
      <section className="py-16 bg-muted/30" data-testid="section-industries-served">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Industries</p>
            <h2 className="text-3xl md:text-4xl font-bold">Built for Employers That Hire Regularly</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {industriesServed.map((industry) => (
              <div
                key={industry}
                className="flex items-center gap-2.5 bg-card border border-border/50 rounded-md px-4 py-3 text-sm"
                data-testid={`chip-industry-${industry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <Building2 className="w-4 h-4 text-[#FF6A00] shrink-0" />
                <span>{industry}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IN-OFFICE DOCUMENT EXAMINATION ── */}
      <section className="py-16 bg-background" data-testid="section-in-office-examination">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF2D55]">Document Examination</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Send New Hires to LBS</h2>
                <p className="text-white/80 leading-relaxed">
                  Employers may designate an LBS representative to meet with a new employee at our Houston office
                  and physically examine the original documents presented for Form I-9 purposes. LBS can then
                  complete the employer-authorized examination process and, when included in the employer's
                  service plan, create the related E-Verify case.
                </p>
                <div className="flex items-start gap-2.5 bg-white/10 rounded-md px-4 py-3 text-white/90 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#FF2D55]" />
                  <span>616 FM 1960 Road West, Suite 101<br />Houston, Texas 77090</span>
                </div>
                <p className="text-xs text-white/60 italic max-w-2xl">
                  Form I-9 document examination is not a notarization. LBS performs this service only when properly
                  designated by the employer as its authorized representative.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <a href="#consultation" onClick={() => { handleConsultationClick("in_office"); trackEvent("in_office_appointment_request"); }}>
                    <Button className="bg-white text-[#0D1B3D] hover:bg-white/90 rounded-full" data-testid="button-book-in-office">
                      Book an In-Office Appointment
                    </Button>
                  </a>
                  <a href="#consultation" onClick={() => { handleConsultationClick("mobile"); trackEvent("mobile_service_request"); }}>
                    <Button variant="outline" className="border-white/30 text-white bg-white/5 backdrop-blur-sm rounded-full" data-testid="button-request-mobile">
                      Request Mobile Service
                    </Button>
                  </a>
                </div>
              </div>
              <div className="flex lg:justify-end">
                <div className="w-full lg:w-56 h-40 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck className="w-16 h-16 text-white/70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE & PRIVACY ── */}
      <section className="py-16 bg-muted/30" data-testid="section-compliance-privacy">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Compliance</p>
            <h2 className="text-3xl md:text-4xl font-bold">Consistent, Private and Employer-Directed</h2>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 space-y-3">
            {compliancePoints.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-1 shrink-0" />
                <p className="text-sm leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic text-center mt-6 max-w-2xl mx-auto">
            {NO_LEGAL_ADVICE_NOTE}
          </p>
        </div>
      </section>

      {/* ── LEAD FORM ── */}
      <section id="consultation" className="py-16 bg-background scroll-mt-20" data-testid="section-consultation-form">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-8 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Get Started</p>
            <h2 className="text-3xl font-bold">Request an Employer Consultation</h2>
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300" data-testid="text-form-sensitive-warning">
            <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{SENSITIVE_DATA_WARNING}</span>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-10 space-y-4" data-testid="div-form-success">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">Request Sent!</h3>
                  <p className="text-muted-foreground">
                    Thank you for reaching out. We'll follow up within one business day.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setCaptchaToken(null);
                      setFormData(emptyForm);
                      setFormStarted(false);
                      setTimeout(() => renderCaptcha(), 100);
                    }}
                    data-testid="button-send-another"
                  >
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-employer-consultation">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ec-contact-name">Contact Name *</Label>
                      <Input
                        id="ec-contact-name"
                        required
                        value={formData.contactName}
                        onFocus={handleFieldStart}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-company-name">Company Name *</Label>
                      <Input
                        id="ec-company-name"
                        required
                        value={formData.companyName}
                        onFocus={handleFieldStart}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        data-testid="input-company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-business-email">Business Email *</Label>
                      <Input
                        id="ec-business-email"
                        type="email"
                        required
                        value={formData.businessEmail}
                        onFocus={handleFieldStart}
                        onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                        data-testid="input-business-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ec-business-phone">Business Phone *</Label>
                      <Input
                        id="ec-business-phone"
                        type="tel"
                        required
                        value={formData.businessPhone}
                        onFocus={handleFieldStart}
                        onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                        data-testid="input-business-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ec-company-address">Company Address *</Label>
                    <Input
                      id="ec-company-address"
                      required
                      placeholder="Street, city, state, ZIP"
                      value={formData.companyAddress}
                      onFocus={handleFieldStart}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      data-testid="input-company-address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ec-industry">Industry *</Label>
                      <Input
                        id="ec-industry"
                        required
                        placeholder="e.g. Staffing, Construction, Home Health"
                        value={formData.industry}
                        onFocus={handleFieldStart}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        data-testid="input-industry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-employee-count">Approx. Number of Employees *</Label>
                      <Select
                        required
                        value={formData.employeeCount}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, employeeCount: v }); }}
                      >
                        <SelectTrigger id="select-employee-count" data-testid="select-employee-count">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_COUNT_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-new-hires-per-month">Approx. New Hires per Month *</Label>
                      <Select
                        required
                        value={formData.newHiresPerMonth}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, newHiresPerMonth: v }); }}
                      >
                        <SelectTrigger id="select-new-hires-per-month" data-testid="select-new-hires-per-month">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          {NEW_HIRES_PER_MONTH_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-hiring-locations">Number of Hiring Locations *</Label>
                      <Select
                        required
                        value={formData.hiringLocations}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, hiringLocations: v }); }}
                      >
                        <SelectTrigger id="select-hiring-locations" data-testid="select-hiring-locations">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          {HIRING_LOCATIONS_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="select-already-enrolled">Already Enrolled in E-Verify? *</Label>
                      <Select
                        required
                        value={formData.alreadyEnrolledInEverify}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, alreadyEnrolledInEverify: v as YesNoNotSure }); }}
                      >
                        <SelectTrigger id="select-already-enrolled" data-testid="select-already-enrolled">
                          <SelectValue placeholder="Select one" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_NOT_SURE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-uses-another-agent">Using Another Employer Agent? *</Label>
                      <Select
                        required
                        value={formData.usesAnotherEmployerAgent}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, usesAnotherEmployerAgent: v as YesNoNotSure }); }}
                      >
                        <SelectTrigger id="select-uses-another-agent" data-testid="select-uses-another-agent">
                          <SelectValue placeholder="Select one" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_NOT_SURE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-federal-contractor">Federal Contractor? *</Label>
                      <Select
                        required
                        value={formData.federalContractorStatus}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, federalContractorStatus: v as YesNoNotSure }); }}
                      >
                        <SelectTrigger id="select-federal-contractor" data-testid="select-federal-contractor">
                          <SelectValue placeholder="Select one" />
                        </SelectTrigger>
                        <SelectContent>
                          {YES_NO_NOT_SURE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="select-desired-service">Desired Service *</Label>
                      <Select
                        required
                        value={formData.desiredService}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, desiredService: v as typeof formData.desiredService }); }}
                      >
                        <SelectTrigger id="select-desired-service" data-testid="select-desired-service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIRED_SERVICE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="select-consultation-method">Preferred Consultation Method *</Label>
                      <Select
                        required
                        value={formData.preferredConsultationMethod}
                        onValueChange={(v) => { handleFieldStart(); setFormData({ ...formData, preferredConsultationMethod: v as typeof formData.preferredConsultationMethod }); }}
                      >
                        <SelectTrigger id="select-consultation-method" data-testid="select-consultation-method">
                          <SelectValue placeholder="Select a method" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSULTATION_METHOD_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ec-message">Message</Label>
                    <Textarea
                      id="ec-message"
                      rows={4}
                      placeholder="Tell us about your hiring process and what support you're looking for."
                      value={formData.message}
                      onFocus={handleFieldStart}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      data-testid="input-message"
                    />
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="ec-consent"
                      checked={formData.consent}
                      onCheckedChange={(v) => setFormData({ ...formData, consent: v === true })}
                      className="mt-0.5"
                      data-testid="checkbox-consent"
                    />
                    <Label htmlFor="ec-consent" className="text-sm font-normal leading-snug text-muted-foreground">
                      {CONSENT_TEXT}
                    </Label>
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
                    disabled={consultationMutation.isPending || (RECAPTCHA_SITE_KEY ? !captchaToken && !captchaError : false)}
                    data-testid="button-submit-consultation"
                  >
                    {consultationMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Consultation
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Have questions about employer onboarding requirements first? See the{" "}
            <Link href={EMPLOYER_INTAKE_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2 hover:opacity-80">
              employer onboarding checklist
            </Link>{" "}
            or the{" "}
            <Link href={EMPLOYER_AGREEMENT_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2 hover:opacity-80">
              draft service agreement
            </Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-muted/30" data-testid="section-employer-faq">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#BD4F00] dark:text-[#FF8A3D]">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-card">
            {employerFaqs.map((faq, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`employer-faq-panel-${i}`}
                  id={`employer-faq-trigger-${i}`}
                  data-testid={`button-employer-faq-${i}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 text-[#FF6A00] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div
                    id={`employer-faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`employer-faq-trigger-${i}`}
                    className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4"
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-14 bg-[#0D1B3D]" data-testid="section-employer-cta">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Ready to Take Verification Administration Off Your Plate?</h2>
          <p className="text-white/70">
            Enroll your company with LBS and create a simpler workflow for managing new-hire verification.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={PORTAL_ROUTES.register}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                data-testid="button-cta-start-onboarding"
                onClick={() => trackEvent("employer_enrollment_cta_click", { location: "closing_cta" })}
              >
                Start Employer Enrollment
              </Button>
            </Link>
            <a href="#consultation" onClick={() => { handleConsultationClick("bottom_cta"); trackEvent("verification_specialist_click", { location: "closing_cta" }); }}>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/5 backdrop-blur-sm rounded-full" data-testid="button-cta-talk-to-specialist">
                Talk to a Verification Specialist
              </Button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <a href="tel:2818365357" onClick={handlePhoneClick}>
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full" data-testid="button-cta-call">
                <Phone className="w-4 h-4 mr-2" />
                Call 281-836-5357
              </Button>
            </a>
            <Link href={PORTAL_ROUTES.login}>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                data-testid="button-cta-client-portal-login"
                onClick={() => trackEvent("portal_login_click", { location: "closing_cta" })}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Employer Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LEGAL / PROGRAM DISCLOSURES ── */}
      <section className="py-8 bg-background border-t border-border/50" data-testid="section-employer-disclaimer">
        <div className="max-w-4xl mx-auto px-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed text-center" data-testid="text-employer-disclaimer">
            {EVERIFY_FOOTER_DISCLAIMER} LBS fees are charges for LBS's administrative, employer-agent, case-management,
            Form I-9 support, documentation, and related professional services — not government E-Verify access fees.
            The employer retains responsibility for its own employment decisions and applicable Form I-9/E-Verify
            obligations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
            <Link href="/privacy-policy" className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2 hover:opacity-80">Privacy Policy</Link>
            <Link href="/terms-of-use" className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2 hover:opacity-80">Terms</Link>
            <Link href={EMPLOYER_AGREEMENT_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2 hover:opacity-80">Services Agreement</Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* ── STICKY MOBILE CTA ──
          Fixed to the bottom on small screens only; sits above the page's own
          content (no cookie banner/legal chrome to worry about — this site has
          none) and stays clear of the mobile nav, which is a top header here,
          not a bottom bar. */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0D1B3D]/95 backdrop-blur-sm border-t border-white/10 px-4 py-3" data-testid="bar-sticky-mobile-cta">
        <Link href={PORTAL_ROUTES.register}>
          <Button
            className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
            data-testid="button-sticky-start-enrollment"
            onClick={() => trackEvent("employer_enrollment_cta_click", { location: "sticky_mobile" })}
          >
            Start Employer Enrollment
          </Button>
        </Link>
      </div>
      <div className="sm:hidden h-16" aria-hidden="true" />
    </div>
  );
}
