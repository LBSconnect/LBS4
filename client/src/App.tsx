import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Analytics from "@/components/Analytics";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import ForBusinesses from "@/pages/ForBusinesses";
import Resources from "@/pages/Resources";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfUse from "@/pages/TermsOfUse";
import CookiePolicy from "@/pages/CookiePolicy";
import NoticeAtCollection from "@/pages/NoticeAtCollection";
import PrivacyRequest from "@/pages/PrivacyRequest";
import AccessibilityStatement from "@/pages/AccessibilityStatement";
import CopyrightDmcaPolicy from "@/pages/CopyrightDmcaPolicy";
import ElectronicCommunicationsTerms from "@/pages/ElectronicCommunicationsTerms";
import BookingCancellationPolicy from "@/pages/BookingCancellationPolicy";
import CandidateRulesSurveillanceNotice from "@/pages/CandidateRulesSurveillanceNotice";
import DocumentHandlingNotice from "@/pages/DocumentHandlingNotice";
import Book from "@/pages/Book";
import CorporateLanding from "@/pages/corporate/Landing";
import CorporatePrograms from "@/pages/corporate/Programs";
import CorporateEnroll from "@/pages/corporate/Enroll";
import CorporateActivated from "@/pages/corporate/Activated";
import CorporateBook from "@/pages/corporate/Book";
import CorporateAdmin from "@/pages/admin/CorporateAdmin";
import CorporatePortal from "@/pages/corporate/Portal";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <>
      <Analytics />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/for-businesses" component={ForBusinesses} />
        <Route path="/resources" component={Resources} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-use" component={TermsOfUse} />
        <Route path="/cookie-policy" component={CookiePolicy} />
        <Route path="/notice-at-collection" component={NoticeAtCollection} />
        <Route path="/privacy-request" component={PrivacyRequest} />
        <Route path="/accessibility-statement" component={AccessibilityStatement} />
        <Route path="/copyright-dmca-policy" component={CopyrightDmcaPolicy} />
        <Route path="/electronic-communications-terms" component={ElectronicCommunicationsTerms} />
        <Route path="/booking-cancellation-policy" component={BookingCancellationPolicy} />
        <Route path="/candidate-rules-surveillance-notice" component={CandidateRulesSurveillanceNotice} />
        <Route path="/document-handling-notice" component={DocumentHandlingNotice} />
        <Route path="/book" component={Book} />
        <Route path="/corporate" component={CorporateLanding} />
        <Route path="/corporate/programs" component={CorporatePrograms} />
        <Route path="/corporate/enroll" component={CorporateEnroll} />
        <Route path="/corporate/activated" component={CorporateActivated} />
        <Route path="/corporate/book" component={CorporateBook} />
        <Route path="/admin/corporate" component={CorporateAdmin} />
        <Route path="/corporate/portal" component={CorporatePortal} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
