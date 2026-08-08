import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  CheckCircle2,
  Loader2,
  Send,
  FileWarning,
  ArrowLeft,
} from "lucide-react";
import {
  EMPLOYER_BASE_ROUTE,
  EMPLOYER_AGREEMENT_ROUTE,
  onboardingChecklist,
  FEDERAL_CONTRACTOR_OPTIONS,
  INTAKE_PLAN_OPTIONS,
  ADD_ON_OPTIONS,
  EVERIFY_FOOTER_DISCLAIMER,
} from "@/lib/employerServices";

const emptyForm = {
  companyLegalName: "",
  dba: "",
  ein: "",
  companyAddress: "",
  mailingAddress: "",
  hiringLocations: "",
  industry: "",
  naicsCategory: "",
  employeeCount: "",
  averageMonthlyHires: "",
  federalContractorStatus: "" as (typeof FEDERAL_CONTRACTOR_OPTIONS)[number] | "",
  authorizedSignerName: "",
  authorizedSignerEmail: "",
  primaryAdministratorName: "",
  primaryAdministratorEmail: "",
  billingContactName: "",
  billingContactEmail: "",
  selectedPlan: "",
  requestedAddOns: [] as string[],
  preferredStartDate: "",
  acknowledgment: false,
};

function preselectedPlan(): string {
  if (typeof window === "undefined") return "";
  const raw = new URLSearchParams(window.location.search).get("plan");
  const match = INTAKE_PLAN_OPTIONS.find((p) => p.id === raw);
  return match ? match.id : "";
}

export default function ClientIntake() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm, selectedPlan: preselectedPlan() });

  useEffect(() => {
    trackEvent("employer_intake_view");
  }, []);

  const intakeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/employer-intake", data);
      return await res.json();
    },
    onSuccess: () => {
      trackEvent("employer_intake_submit", { plan: formData.selectedPlan });
      toast({
        title: "Onboarding Information Received",
        description: "Our team will follow up about next steps.",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit onboarding information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleAddOn = (addOn: string) => {
    setFormData((f) => ({
      ...f,
      requestedAddOns: f.requestedAddOns.includes(addOn)
        ? f.requestedAddOns.filter((a) => a !== addOn)
        : [...f.requestedAddOns, addOn],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.federalContractorStatus || !formData.selectedPlan) {
      toast({
        title: "Missing information",
        description: "Please select federal-contractor status and a plan.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.acknowledgment) {
      toast({
        title: "Acknowledgment required",
        description: "Please confirm you've read the employer responsibilities before submitting.",
        variant: "destructive",
      });
      return;
    }
    intakeMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Employer Onboarding Checklist & Client Intake | LBS"
        canonical="/employer-services/new-hire-verification/intake"
        description="Business-level onboarding checklist and client intake for LBS New-Hire Verification & Form I-9 Support. No employee Form I-9 data is collected on this page."
        noIndex
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-intake-hero">
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          {/* whitespace-normal: this label is long enough that forcing it onto
              one line (the Button default) pushed the page past 320px wide. */}
          <Link href={EMPLOYER_BASE_ROUTE}>
            <Button variant="ghost" size="sm" className="text-white/80 mb-4 whitespace-normal text-left h-auto" data-testid="button-back-employer-services">
              <ArrowLeft className="w-4 h-4 mr-1 shrink-0" />
              Back to New-Hire Verification &amp; Form I-9 Support
            </Button>
          </Link>
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
              <ClipboardList className="w-4 h-4 text-[#FF2D55]" />
              Employer Onboarding
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Employer Onboarding Checklist &amp; Client Intake</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              Business-level information LBS uses to enroll your company as a participating client. This page
              never collects employee Form I-9 data, Social Security numbers, or identity documents.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background" data-testid="section-onboarding-checklist">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <h2 className="text-2xl font-bold">What LBS May Ask For</h2>
          <p className="text-muted-foreground">
            To enroll your business as a participating client, LBS may ask for:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onboardingChecklist.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm bg-muted/30 rounded-md px-4 py-3" data-testid={`item-checklist-${item.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <CheckCircle2 className="w-4 h-4 text-[#FF6A00] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic">
            LBS does not collect sensitive employee records (Form I-9 documents, SSNs, immigration status, or
            identity-document copies) on this page. See the{" "}
            <Link href={EMPLOYER_AGREEMENT_ROUTE} className="text-[#0D1B3D] dark:text-[#0077FF] underline underline-offset-2">
              service agreement
            </Link>{" "}
            for secure-communication terms used once your company is a client.
          </p>
        </div>
      </section>

      <section className="py-8 bg-muted/30" data-testid="section-intake-form">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-md px-4 py-3 mb-6 text-sm text-amber-800 dark:text-amber-300">
            <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Do not enter employee Form I-9 information, Social Security numbers, identity documents, immigration records, or other sensitive employee information on this page.</span>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center py-10 space-y-4" data-testid="div-intake-success">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold">Onboarding Information Received</h3>
                  <p className="text-muted-foreground">
                    Our employer-services team will follow up about next steps, including the E-Verify
                    Memorandum of Understanding and the LBS service agreement.
                  </p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ ...emptyForm, selectedPlan: preselectedPlan() }); }} data-testid="button-submit-another-intake">
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-employer-intake">
                  <h2 className="text-xl font-bold">Client Intake</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ci-legal-name">Company Legal Name *</Label>
                      <Input id="ci-legal-name" required value={formData.companyLegalName} onChange={(e) => setFormData({ ...formData, companyLegalName: e.target.value })} data-testid="input-company-legal-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-dba">DBA (if applicable)</Label>
                      <Input id="ci-dba" value={formData.dba} onChange={(e) => setFormData({ ...formData, dba: e.target.value })} data-testid="input-dba" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-ein">EIN</Label>
                      <Input id="ci-ein" placeholder="XX-XXXXXXX" value={formData.ein} onChange={(e) => setFormData({ ...formData, ein: e.target.value })} data-testid="input-ein" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-industry">Industry *</Label>
                      <Input id="ci-industry" required value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} data-testid="input-intake-industry" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ci-address">Company Address *</Label>
                    <Input id="ci-address" required placeholder="Street, city, state, ZIP" value={formData.companyAddress} onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })} data-testid="input-intake-company-address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ci-mailing">Mailing Address (if different)</Label>
                    <Input id="ci-mailing" placeholder="Street, city, state, ZIP" value={formData.mailingAddress} onChange={(e) => setFormData({ ...formData, mailingAddress: e.target.value })} data-testid="input-mailing-address" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ci-locations">Hiring Locations *</Label>
                      <Input id="ci-locations" required placeholder="e.g. 1, or list cities" value={formData.hiringLocations} onChange={(e) => setFormData({ ...formData, hiringLocations: e.target.value })} data-testid="input-intake-hiring-locations" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-naics">NAICS Category</Label>
                      <Input id="ci-naics" placeholder="e.g. 561320" value={formData.naicsCategory} onChange={(e) => setFormData({ ...formData, naicsCategory: e.target.value })} data-testid="input-naics" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-employee-count">Employee Count *</Label>
                      <Input id="ci-employee-count" required placeholder="e.g. 35" value={formData.employeeCount} onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })} data-testid="input-intake-employee-count" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-avg-hires">Average Monthly Hires *</Label>
                      <Input id="ci-avg-hires" required placeholder="e.g. 4" value={formData.averageMonthlyHires} onChange={(e) => setFormData({ ...formData, averageMonthlyHires: e.target.value })} data-testid="input-average-monthly-hires" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ci-federal-contractor-status">Federal-Contractor Status *</Label>
                    <Select required value={formData.federalContractorStatus} onValueChange={(v) => setFormData({ ...formData, federalContractorStatus: v as typeof formData.federalContractorStatus })}>
                      <SelectTrigger id="ci-federal-contractor-status" data-testid="select-federal-contractor-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {FEDERAL_CONTRACTOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-5">
                    <h3 className="font-semibold">Contacts</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="ci-signer-name">Authorized Signer Name *</Label>
                        <Input id="ci-signer-name" required value={formData.authorizedSignerName} onChange={(e) => setFormData({ ...formData, authorizedSignerName: e.target.value })} data-testid="input-authorized-signer-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ci-signer-email">Authorized Signer Email *</Label>
                        <Input id="ci-signer-email" type="email" required value={formData.authorizedSignerEmail} onChange={(e) => setFormData({ ...formData, authorizedSignerEmail: e.target.value })} data-testid="input-authorized-signer-email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ci-admin-name">Primary Administrator Name *</Label>
                        <Input id="ci-admin-name" required value={formData.primaryAdministratorName} onChange={(e) => setFormData({ ...formData, primaryAdministratorName: e.target.value })} data-testid="input-primary-administrator-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ci-admin-email">Primary Administrator Email *</Label>
                        <Input id="ci-admin-email" type="email" required value={formData.primaryAdministratorEmail} onChange={(e) => setFormData({ ...formData, primaryAdministratorEmail: e.target.value })} data-testid="input-primary-administrator-email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ci-billing-name">Billing Contact Name *</Label>
                        <Input id="ci-billing-name" required value={formData.billingContactName} onChange={(e) => setFormData({ ...formData, billingContactName: e.target.value })} data-testid="input-billing-contact-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ci-billing-email">Billing Contact Email *</Label>
                        <Input id="ci-billing-email" type="email" required value={formData.billingContactEmail} onChange={(e) => setFormData({ ...formData, billingContactEmail: e.target.value })} data-testid="input-billing-contact-email" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <h3 className="font-semibold">Plan &amp; Start Date</h3>
                    <div className="space-y-2">
                      <Label htmlFor="ci-selected-plan">Selected Plan *</Label>
                      <Select required value={formData.selectedPlan} onValueChange={(v) => setFormData({ ...formData, selectedPlan: v })}>
                        <SelectTrigger id="ci-selected-plan" data-testid="select-intake-plan">
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTAKE_PLAN_OPTIONS.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Requested Add-Ons</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ADD_ON_OPTIONS.map((addOn) => (
                          <label key={addOn} className="flex items-center gap-2.5 text-sm bg-background border border-border/50 rounded-md px-3 py-2 cursor-pointer">
                            <Checkbox
                              checked={formData.requestedAddOns.includes(addOn)}
                              onCheckedChange={() => toggleAddOn(addOn)}
                              data-testid={`checkbox-addon-${addOn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            />
                            {addOn}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ci-start-date">Preferred Start Date</Label>
                      <Input id="ci-start-date" type="date" value={formData.preferredStartDate} onChange={(e) => setFormData({ ...formData, preferredStartDate: e.target.value })} data-testid="input-preferred-start-date" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 border-t border-border/50 pt-5">
                    <Checkbox
                      id="ci-acknowledgment"
                      checked={formData.acknowledgment}
                      onCheckedChange={(v) => setFormData({ ...formData, acknowledgment: v === true })}
                      className="mt-0.5"
                      data-testid="checkbox-intake-acknowledgment"
                    />
                    <Label htmlFor="ci-acknowledgment" className="text-sm font-normal leading-snug text-muted-foreground">
                      I acknowledge that my company remains responsible for Form I-9 compliance, that LBS provides
                      administrative support and not legal advice, and that our company will complete an E-Verify
                      Memorandum of Understanding and a signed LBS service agreement as part of enrollment.
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                    disabled={intakeMutation.isPending}
                    data-testid="button-submit-intake"
                  >
                    {intakeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Onboarding Information
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8 bg-background border-t border-border/50" data-testid="section-employer-disclaimer">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs text-muted-foreground leading-relaxed text-center" data-testid="text-employer-disclaimer">
            {EVERIFY_FOOTER_DISCLAIMER}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
