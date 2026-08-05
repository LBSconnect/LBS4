import { Link } from "wouter";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

export default function Footer() {
  const serviceLinks = [
    { href: "/notary-houston-77090", label: "Notary Service" },
    { href: "/passport-photos-houston-77090", label: "Passport Photos" },
    { href: "/website-design-houston-77090", label: "Website Design" },
    { href: "/certiport-testing-center-houston", label: "Certiport Exams" },
    { href: "/texas-insurance-exam-prep-houston", label: "Texas Insurance Exam Prep" },
    { href: "/employer-services/new-hire-verification", label: "New-Hire Verification & I-9 Support" },
  ];

  return (
    <footer className="bg-[#0D1B3D] text-white/90">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="LBS Logo"
                className="h-12 w-12 object-contain rounded-md bg-white/10 p-1"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="text-lg font-bold text-white">LBS</h3>
                <p className="text-xs text-white/60">Business Services Center</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              LBS Business Services Center, a division of Linton Business Solutions LLC (LBS). Your
              trusted partner for business services and professional testing in Houston,
              Texas.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Our Services" },
                { href: "/for-businesses", label: "For Businesses" },
                { href: "/corporate", label: "Corporate Notary" },
                { href: "/about", label: "About Us" },
                { href: "/resources", label: "Resources" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className="text-sm text-white/70 cursor-pointer transition-colors hover:text-white"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <a
                href="https://time-keeper-tnb8.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-time-keeper"
              >
                Time Keeper
              </a>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Our Services
            </h4>
            <nav className="flex flex-col gap-2.5">
              {serviceLinks.map((service) => (
                <Link key={service.href} href={service.href}>
                  <span
                    className="text-sm text-white/70 cursor-pointer transition-colors hover:text-white"
                    data-testid={`link-footer-service-${service.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {service.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Contact Info
            </h4>
            <div className="space-y-3">
              <a
                href="https://maps.google.com/?q=616+FM+1960+Rd+W+Ste+101+Houston+TX+77090"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-address"
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#FF2D55]" />
                <span>
                  616 FM 1960 Road West<br />
                  Suite 101<br />
                  Houston, Texas 77090-3048
                </span>
              </a>
              <a
                href="tel:2818365357"
                className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-phone"
              >
                <Phone className="w-4 h-4 shrink-0 text-[#FF2D55]" />
                281-836-5357
              </a>
              <a
                href="mailto:info@lbsconnect.net"
                className="flex items-center gap-2.5 text-sm text-white/70 transition-colors hover:text-white"
                data-testid="link-footer-email"
              >
                <Mail className="w-4 h-4 shrink-0 text-[#FF2D55]" />
                info@lbsconnect.net
              </a>
              <div className="flex items-start gap-2.5 text-sm text-white/70">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#FF2D55]" />
                <span>
                  Mon – Fri: 8:00 AM – 5:00 PM<br />
                  Sat: 8:00 AM – 4:00 PM<br />
                  Closed Sun
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Linton Business Solutions LLC (LBS). All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {[
              { href: "/privacy-policy", label: "Privacy Policy" },
              { href: "/terms-of-use", label: "Terms of Use" },
              { href: "/cookie-policy", label: "Cookie Policy" },
              { href: "/notice-at-collection", label: "Notice at Collection" },
              { href: "/privacy-request", label: "Privacy Request" },
              { href: "/accessibility-statement", label: "Accessibility" },
              { href: "/copyright-dmca-policy", label: "Copyright & DMCA" },
              { href: "/electronic-communications-terms", label: "Electronic Communications" },
              { href: "/booking-cancellation-policy", label: "Booking & Cancellation" },
              { href: "/candidate-rules-surveillance-notice", label: "Candidate Rules" },
              { href: "/document-handling-notice", label: "Document Handling" },
            ].map((link, i, arr) => (
              <span key={link.href} className="flex items-center gap-3">
                <Link href={link.href}>
                  <span
                    className="cursor-pointer hover:text-white transition-colors"
                    data-testid={`link-footer-legal-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    {link.label}
                  </span>
                </Link>
                {i < arr.length - 1 && <span className="text-white/30">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
