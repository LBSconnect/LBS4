import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, Mail, MapPin, ChevronDown, Building2, ShieldCheck, Stamp, Globe } from "lucide-react";
import logoImg from "@assets/lbs-logo-optimized.png";

const CORPORATE_ENABLED = import.meta.env.VITE_CORPORATE_ENABLED === "true";

// Nav order: Home, Services, [For Businesses dropdown], [Notary Pro-Plans / Corporate], Testing Center, Contact, About Us
const navLinksStart = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

// Mirrors the section order on /for-businesses: Corporate Notary Program,
// New-Hire Verification & Form I-9 Support, then Website & Application
// Design Services. Icons match the badge icon each service already uses
// on that page, for a consistent look.
const businessDropdownLinks = [
  { href: "/corporate", label: "Corporate Notary Program", icon: Stamp },
  { href: "/employer-services/new-hire-verification", label: "New-Hire Verification & I-9 Support", icon: ShieldCheck },
  { href: "/website-design-houston-77090", label: "Website & Application Design", icon: Globe },
];

const navLinksMid = [
  { href: "/certiport-testing-center-houston", label: "Testing Center" },
];

const navLinksEnd = [
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About Us" },
];

const corporateMainLinks = [
  { href: "/corporate", label: "Overview" },
  { href: "/corporate/programs", label: "Plans & Pricing" },
  { href: "/corporate/enroll", label: "Enroll Now" },
];

const corporateAccountLinks = [
  { href: "/corporate/portal", label: "Client Portal", bg: "bg-[#FF6A00] hover:bg-[#b8973b]", text: "text-[#0D1B3D] font-semibold" },
  { href: "/admin/corporate", label: "Admin Dashboard", bg: "bg-[#0D1B3D] hover:bg-[#0D1B3D]", text: "text-white font-semibold" },
];

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [corpOpen, setCorpOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);
  const corpRef = useRef<HTMLDivElement>(null);
  const bizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (corpRef.current && !corpRef.current.contains(e.target as Node)) {
        setCorpOpen(false);
      }
      if (bizRef.current && !bizRef.current.contains(e.target as Node)) {
        setBizOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);

    // Keyboard-only users need a way to dismiss an open dropdown without a
    // mouse click outside it — Escape is the standard convention for
    // disclosure widgets like these (WCAG 2.1.1 Keyboard).
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCorpOpen(false);
        setBizOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#0D1B3D] text-white/90 text-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6 flex-wrap">
            <a
              href="tel:2818365357"
              className="flex items-center gap-1.5 transition-colors"
              data-testid="link-phone-top"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>281-836-5357</span>
            </a>
            <a
              href="mailto:info@lbsconnect.net"
              className="flex items-center gap-1.5 transition-colors"
              data-testid="link-email-top"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>info@lbsconnect.net</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>616 FM 1960 Road West, Suite 101, Houston, Texas 77090-3048</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-background border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-logo">
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                src={logoImg}
                alt="Linton Business Solutions LLC logo"
                className="h-12 w-12 object-contain rounded-md"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#0D1B3D] dark:text-white leading-tight">
                  LBS
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Business Services Center
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
            {/* asChild throughout this nav: an <a> (Link) wrapping a <button>
                (Button) is two nested interactive elements at the same
                position, which both axe's target-size check and manual
                keyboard testing (Tab landing on the untagged outer <a> before
                the inner <button>, doubling the stops per link) flagged as
                real problems on the "Book a Service" CTA — see below. Same
                fix applied to every plain nav link here, since they all share
                the identical nested structure. */}
            {navLinksStart.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={location === link.href ? "default" : "ghost"}
                size="sm"
                className={
                  location === link.href
                    ? "bg-[#0D1B3D] text-white"
                    : "text-foreground"
                }
              >
                <Link href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {link.label}
                </Link>
              </Button>
            ))}

            {/* For Businesses dropdown */}
            <div className="relative" ref={bizRef}>
              <Button
                variant={location.startsWith("/for-businesses") || location.startsWith("/employer-services") || location.startsWith("/website-design") ? "default" : "ghost"}
                size="sm"
                className={`gap-1 ${
                  location.startsWith("/for-businesses") || location.startsWith("/employer-services") || location.startsWith("/website-design")
                    ? "bg-[#0D1B3D] text-white"
                    : "text-foreground"
                }`}
                onClick={() => setBizOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={bizOpen}
                data-testid="link-nav-for-businesses"
              >
                For Businesses
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${bizOpen ? "rotate-180" : ""}`} />
              </Button>
              {bizOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border/50 rounded-xl shadow-lg py-1 z-50">
                  {businessDropdownLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <span
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-[#f8f9fb] cursor-pointer transition-colors"
                        onClick={() => setBizOpen(false)}
                        data-testid={`link-nav-dropdown-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        <link.icon className="w-4 h-4 text-[#FF6A00] shrink-0" />
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Corporate dropdown — feature gated */}
            {CORPORATE_ENABLED && (
              <div className="relative" ref={corpRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground gap-1"
                  onClick={() => setCorpOpen((o) => !o)}
                  aria-haspopup="true"
                  aria-expanded={corpOpen}
                  data-testid="link-nav-corporate"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Notary Pro-Plans
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${corpOpen ? "rotate-180" : ""}`} />
                </Button>
                {corpOpen && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border/50 rounded-xl shadow-lg py-1 z-50">
                    {corporateMainLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-[#f8f9fb] cursor-pointer transition-colors"
                          onClick={() => setCorpOpen(false)}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border/50" />
                    {corporateAccountLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <span
                          className={`block mx-2 my-0.5 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${link.bg} ${link.text}`}
                          onClick={() => setCorpOpen(false)}
                        >
                          {link.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {navLinksMid.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={location === link.href ? "default" : "ghost"}
                size="sm"
                className={
                  location === link.href
                    ? "bg-[#0D1B3D] text-white"
                    : "text-foreground"
                }
              >
                <Link href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {link.label}
                </Link>
              </Button>
            ))}

            {navLinksEnd.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={location === link.href ? "default" : "ghost"}
                size="sm"
                className={
                  location === link.href
                    ? "bg-[#0D1B3D] text-white"
                    : "text-foreground"
                }
              >
                <Link href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                  {link.label}
                </Link>
              </Button>
            ))}

            {/* asChild merges the Button's styling directly onto the <Link>'s
                anchor instead of nesting a <button> inside it. An <a> wrapping
                a <button> is two overlapping interactive elements at the same
                position — axe-core's target-size check (WCAG 2.5.8) flags the
                anchor as "obscured" by its own nested button here, right next
                to the "About Us" link. Single element, same visible styling. */}
            <Button
              asChild
              size="sm"
              className="ml-2 bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
            >
              <Link href="/book" data-testid="button-book-now">
                Book a Service
              </Link>
            </Button>
          </nav>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button size="icon" variant="ghost" data-testid="button-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImg}
                      alt="LBS Logo"
                      className="h-10 w-10 object-contain rounded-md"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <div className="font-bold text-[#0D1B3D] dark:text-white">LBS</div>
                      <div className="text-xs text-muted-foreground">Business Services Center</div>
                    </div>
                  </div>
                </div>
                <nav className="flex flex-col p-4 gap-1" data-testid="nav-mobile">
                  {/* asChild throughout — same nested <a>/<button> fix as the
                      desktop nav above. */}
                  {navLinksStart.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant={location === link.href ? "default" : "ghost"}
                      className={`w-full justify-start ${location === link.href ? "bg-[#0D1B3D] text-white" : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={link.href} data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  <div className="pt-2 pb-1 px-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3" /> For Businesses
                    </p>
                  </div>
                  {businessDropdownLinks.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant="ghost"
                      className="w-full justify-start gap-2.5 text-sm pl-4"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={link.href} data-testid={`link-mobile-dropdown-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                        <link.icon className="w-4 h-4 text-[#FF6A00] shrink-0" />
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  {CORPORATE_ENABLED && (
                    <>
                      <div className="pt-2 pb-1 px-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" /> Notary Pro-Plans
                        </p>
                      </div>
                      {corporateMainLinks.map((link) => (
                        <Button
                          key={link.href}
                          asChild
                          variant="ghost"
                          className="w-full justify-start text-sm pl-4"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                      <div className="my-1 border-t border-border/50" />
                      {corporateAccountLinks.map((link) => (
                        <Button
                          key={link.href}
                          asChild
                          className={`w-full justify-start text-sm ${link.bg} ${link.text}`}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                    </>
                  )}
                  {navLinksMid.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant={location === link.href ? "default" : "ghost"}
                      className={`w-full justify-start ${location === link.href ? "bg-[#0D1B3D] text-white" : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={link.href} data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  {navLinksEnd.map((link) => (
                    <Button
                      key={link.href}
                      asChild
                      variant={location === link.href ? "default" : "ghost"}
                      className={`w-full justify-start ${location === link.href ? "bg-[#0D1B3D] text-white" : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={link.href} data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s/g, "-")}`}>
                        {link.label}
                      </Link>
                    </Button>
                  ))}
                  {/* asChild — see the desktop "Book a Service" CTA above for why. */}
                  <Button
                    asChild
                    className="w-full mt-3 bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link href="/book" data-testid="button-mobile-book">
                      Book a Service
                    </Link>
                  </Button>
                </nav>
                <div className="mt-auto p-4 border-t border-border/50 space-y-3 text-sm text-muted-foreground">
                  <a href="tel:2818365357" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" /> 281-836-5357
                  </a>
                  <a href="mailto:info@lbsconnect.net" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> info@lbsconnect.net
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
