import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import InsuranceExamPrepHub from "@/pages/InsuranceExamPrepHub";
import WebsiteDesignLanding from "@/pages/WebsiteDesignLanding";
import NewHireVerification from "@/pages/employer/NewHireVerification";
import EmployerServiceAgreement from "@/pages/employer/ServiceAgreement";
import EmployerClientIntake from "@/pages/employer/ClientIntake";
import EmployerPricingSheet from "@/pages/employer/PricingSheet";
import PortalLogin from "@/pages/i9-portal/PortalLogin";
import PortalRegister from "@/pages/i9-portal/PortalRegister";
import PortalDashboard from "@/pages/i9-portal/PortalDashboard";
import PortalBusinessIntake from "@/pages/i9-portal/PortalBusinessIntake";
import PortalHiringSites from "@/pages/i9-portal/PortalHiringSites";
import PortalBilling from "@/pages/i9-portal/PortalBilling";
import PortalAppointments from "@/pages/i9-portal/PortalAppointments";
import PortalNewHireRequests from "@/pages/i9-portal/PortalNewHireRequests";
import PortalNewHireRequestNew from "@/pages/i9-portal/PortalNewHireRequestNew";
import PortalNewHireRequestDetail from "@/pages/i9-portal/PortalNewHireRequestDetail";
import PortalAdminCompanies from "@/pages/i9-portal/PortalAdminCompanies";
import PortalAdminCompanyDetail from "@/pages/i9-portal/PortalAdminCompanyDetail";
import { PORTAL_ROUTES } from "@/lib/i9Portal";
import CorporateLanding from "@/pages/corporate/Landing";
import CorporatePrograms from "@/pages/corporate/Programs";
import CorporateEnroll from "@/pages/corporate/Enroll";
import CorporateActivated from "@/pages/corporate/Activated";
import CorporateBook from "@/pages/corporate/Book";
import CorporateAdmin from "@/pages/admin/CorporateAdmin";
import CorporatePortal from "@/pages/corporate/Portal";
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // Let same-page anchor links (e.g. /#section-faq) handle their own scroll.
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Analytics />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug">
          {() => <ServiceDetail />}
        </Route>
        <Route path="/notary-houston-77090">
          {() => <ServiceDetail slugOverride="notary-service" />}
        </Route>
        <Route path="/passport-photos-houston-77090">
          {() => <ServiceDetail slugOverride="passport-photos" />}
        </Route>
        <Route path="/certiport-testing-center-houston">
          {() => <ServiceDetail slugOverride="certification-exam-testing" />}
        </Route>
        <Route path="/texas-insurance-exam-prep-houston" component={InsuranceExamPrepHub} />
        <Route path="/website-design-houston-77090" component={WebsiteDesignLanding} />
        <Route path="/for-businesses" component={ForBusinesses} />
        <Route path="/employer-services/new-hire-verification" component={NewHireVerification} />
        <Route path="/employer-services/new-hire-verification/agreement" component={EmployerServiceAgreement} />
        <Route path="/employer-services/new-hire-verification/intake" component={EmployerClientIntake} />
        <Route path="/employer-services/new-hire-verification/pricing-sheet" component={EmployerPricingSheet} />
        <Route path={PORTAL_ROUTES.login} component={PortalLogin} />
        <Route path={PORTAL_ROUTES.register} component={PortalRegister} />
        <Route path={PORTAL_ROUTES.dashboard} component={PortalDashboard} />
        <Route path={PORTAL_ROUTES.businessIntake} component={PortalBusinessIntake} />
        <Route path={PORTAL_ROUTES.hiringSites} component={PortalHiringSites} />
        <Route path={PORTAL_ROUTES.billing} component={PortalBilling} />
        <Route path={PORTAL_ROUTES.appointments} component={PortalAppointments} />
        <Route path={PORTAL_ROUTES.newRequest} component={PortalNewHireRequestNew} />
        <Route path={PORTAL_ROUTES.requests} component={PortalNewHireRequests} />
        <Route path={`${PORTAL_ROUTES.requests}/:id`} component={PortalNewHireRequestDetail} />
        <Route path={PORTAL_ROUTES.adminCompanies} component={PortalAdminCompanies} />
        <Route path={`${PORTAL_ROUTES.adminCompanies}/:id`} component={PortalAdminCompanyDetail} />
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
