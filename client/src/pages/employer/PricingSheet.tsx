import { useEffect } from "react";
import { Link } from "wouter";
import { trackEvent } from "@/components/Analytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Phone, Mail, MapPin } from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";
import {
  EMPLOYER_BASE_ROUTE,
  monthlyPlans,
  monthlyPlansNote,
  payAsYouGoServices,
  payAsYouGoNote,
  featuredPackage,
  EVERIFY_FOOTER_DISCLAIMER,
} from "@/lib/employerServices";

export default function PricingSheet() {
  useEffect(() => {
    trackEvent("pricing_sheet_view");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Employer Services Pricing Sheet | LBS Houston"
        canonical="/employer-services/new-hire-verification/pricing-sheet"
        description="Print-friendly pricing sheet for LBS New-Hire Verification & Form I-9 Support: monthly plans, pay-as-you-go rates, setup fees, and mobile travel notes."
      />
      <div className="print:hidden">
        <Header />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 w-full print:py-0 print:px-0 print:max-w-none">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 print:hidden">
          <Link href={EMPLOYER_BASE_ROUTE}>
            <Button variant="ghost" size="sm" data-testid="button-back-from-pricing-sheet">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to New-Hire Verification &amp; Form I-9 Support
            </Button>
          </Link>
          <Button size="sm" className="gap-1.5 bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full" onClick={() => window.print()} data-testid="button-print-pricing-sheet">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
        </div>

        <div className="print:p-8">
          <div className="flex items-center gap-4 border-b-2 border-[#0D1B3D] pb-6 mb-6">
            <img src={logoImg} alt="Linton Business Solutions LLC logo" className="h-14 w-14 object-contain rounded-md" />
            <div>
              <h1 className="text-2xl font-bold text-[#0D1B3D]">LBS New-Hire Verification &amp; Form I-9 Support</h1>
              <p className="text-sm text-muted-foreground">Employer Services Pricing Sheet · Linton Business Solutions LLC</p>
            </div>
          </div>

          <section className="mb-8" data-testid="section-print-featured">
            <h2 className="text-lg font-bold text-[#0D1B3D] mb-2">Most Popular: {featuredPackage.name}</h2>
            <p className="text-sm mb-1">
              <strong className="text-xl">{featuredPackage.price}</strong> {featuredPackage.priceSuffix} — {featuredPackage.setupNote}
            </p>
            <ul className="text-sm list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {featuredPackage.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-8" data-testid="section-print-monthly-plans">
            <h2 className="text-lg font-bold text-[#0D1B3D] mb-3">Monthly Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {monthlyPlans.map((plan) => (
                <div key={plan.id} className="border border-border rounded-md p-4 break-inside-avoid">
                  <p className="font-bold text-[#0D1B3D]">{plan.name}{plan.badge ? ` (${plan.badge})` : ""}</p>
                  <p className="text-xl font-extrabold text-[#0D1B3D]">{plan.price}<span className="text-xs font-normal text-muted-foreground">/month</span></p>
                  <p className="text-xs text-muted-foreground mb-2">{plan.setupNote}</p>
                  <ul className="text-xs list-disc pl-4 space-y-0.5">
                    {plan.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">{plan.additionalCase}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{monthlyPlansNote}</p>
          </section>

          <section className="mb-8" data-testid="section-print-pay-as-you-go">
            <h2 className="text-lg font-bold text-[#0D1B3D] mb-3">Pay-As-You-Go Services</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {payAsYouGoServices.map((item) => (
                  <tr key={item.label} className="border-b border-border">
                    <td className="py-2 pr-4">{item.label}</td>
                    <td className="py-2 text-right font-semibold text-[#0D1B3D] whitespace-nowrap">{item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-3">{payAsYouGoNote}</p>
          </section>

          <section className="mb-8" data-testid="section-print-notes">
            <h2 className="text-lg font-bold text-[#0D1B3D] mb-2">Setup Fees &amp; Mobile Travel</h2>
            <p className="text-sm text-muted-foreground">
              New client enrollment includes a one-time setup fee (starting at $99; $99 flat on the Business
              plan). Mobile document-examination appointments start at $95 plus applicable travel charges based
              on distance and scheduling.
            </p>
          </section>

          <section className="mb-8 border-t border-border pt-6" data-testid="section-print-contact">
            <h2 className="text-lg font-bold text-[#0D1B3D] mb-3">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#FF6A00]" /> 616 FM 1960 Road West, Suite 101, Houston, TX 77090</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#FF6A00]" /> 281-836-5357</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#FF6A00]" /> info@lbsconnect.net</p>
            </div>
          </section>

          <p className="text-xs text-muted-foreground border-t border-border pt-4" data-testid="text-print-disclaimer">
            {EVERIFY_FOOTER_DISCLAIMER}
          </p>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
