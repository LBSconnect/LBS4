import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Shield,
  Award,
  Users,
  Target,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import logoImg from "@assets/Linton_Business_Solutions.gif_1771618422350.jpg";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="About LBS Business Services Center | Linton Business Solutions Houston TX"
        canonical="/about"
        description="LBS4 is the Skilling Services & Business Center for Linton Business Solutions LLC, offering notary services, passport photos, website design, and authorized Pearson VUE & Certiport testing in Houston, Texas."
      />
      <Header />

      <section className="relative py-12 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]" data-testid="section-about-hero">
        <div className="absolute inset-0 bg-[url('/images/hero-testing-center.png')] bg-cover bg-center opacity-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white" data-testid="text-about-title">
            About LBS
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            LBS4 is the Skilling Services &amp; Business Center for Linton Business Solutions LLC,
            providing professional testing and business services in Houston, Texas.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background" data-testid="section-about-story">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                LBS4 is the Skilling Services &amp; Business Center location and website for Linton
                Business Solutions LLC, known as LBS. The website and location was established to
                provide individuals, entrepreneurs, professionals, and local organizations with
                convenient access to essential business, career, and testing services all in one
                professional location.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, LBS operates as a business support center offering professional notary
                services, passport photos, website design, and practical solutions that help our
                customers complete important personal and business tasks with confidence.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We also serve the Houston community as an authorized professional testing center,
                providing a secure, quiet, and reliable environment for certification and licensing
                examinations. Through our testing, exam-preparation, and career-support services, we
                help individuals take meaningful steps toward new credentials, employment
                opportunities, and professional growth.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is simple: to make essential services more accessible, efficient, and
                stress-free. Whether you are notarizing an important document, obtaining compliant
                passport photos, building your online presence, preparing for a professional exam,
                or completing a certification test, our team is committed to providing dependable
                service and personalized support.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Conveniently located in North Houston, our facility combines modern technology with
                friendly, knowledgeable service to deliver a seamless experience for every customer
                who walks through our doors.
              </p>
            </div>
            <div className="flex justify-center">
              <Card className="max-w-sm w-full border-border/50">
                <CardContent className="p-8 text-center space-y-6">
                  <img
                    src={logoImg}
                    alt="Linton Business Solutions Logo"
                    className="w-32 h-32 object-contain mx-auto"
                    loading="lazy"
                    decoding="async"
                    data-testid="img-about-logo"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-[#0D1B3D] dark:text-white">
                      Linton Business Solutions
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      LLC (LBS)
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Professional testing, proctoring, and business services for
                    the greater Houston area.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-muted/30" data-testid="section-about-values">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl font-bold">Our Values</h2>
            <p className="text-muted-foreground">
              Everything we do is guided by our commitment to excellence and
              service.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Integrity",
                desc: "We operate with the highest ethical standards and maintain strict testing protocols.",
              },
              {
                icon: Award,
                title: "Excellence",
                desc: "We strive for perfection in every service we provide to our clients.",
              },
              {
                icon: Users,
                title: "Community",
                desc: "We're committed to serving and empowering our Houston community.",
              },
              {
                icon: Target,
                title: "Innovation",
                desc: "We continuously upgrade our technology and services to stay ahead.",
              },
            ].map((value) => (
              <Card key={value.title} className="border-border/50">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center mx-auto">
                    <value.icon className="w-7 h-7 text-[#0D1B3D] dark:text-[#0077FF]" />
                  </div>
                  <h3 className="font-semibold text-lg">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-background" data-testid="section-about-authorizations">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
            <h2 className="text-3xl font-bold">Authorizations & Partnerships</h2>
            <p className="text-muted-foreground">
              We are proud to be authorized by leading testing organizations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Pearson VUE",
                desc: "Authorized testing center for hundreds of certification programs worldwide. We deliver exams for IT, healthcare, finance, and many more industries.",
              },
              {
                name: "Certiport",
                desc: "Official testing center for Microsoft Office Specialist, Adobe Certified Professional, and other industry-leading certifications.",
              },
              {
                name: "PMI",
                desc: "Authorized center for Project Management Institute exams including PMP, CAPM, and other project management certifications.",
              },
            ].map((partner) => (
              <div
                key={partner.name}
                className="bg-card border border-border/50 rounded-md p-6 space-y-3"
                data-testid={`card-partner-${partner.name.toLowerCase().replace(/\s/g, "-")}`}
              >
                <CheckCircle2 className="w-8 h-8 text-[#FF6A00]" />
                <h3 className="font-semibold text-lg">{partner.name}</h3>
                <p className="text-sm text-muted-foreground">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 bg-muted/20" data-testid="section-naics-codes">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Industry Classifications (NAICS Codes)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            {[
              { code: "541611", label: "Administrative Management and General Management Consulting" },
              { code: "541512", label: "Computer Systems Design Services" },
              { code: "541519", label: "Other Computer Related Services" },
              { code: "561110", label: "Office Administrative Services" },
              { code: "561410", label: "Document Preparation Services" },
              { code: "561320", label: "Temporary Help Services" },
              { code: "492110", label: "Couriers and Express Delivery Services" },
              { code: "611430", label: "Professional and Management Development Training" },
              { code: "561920", label: "Convention and Trade Show Organizers" },
            ].map((item) => (
              <p key={item.code}>
                <span className="font-medium text-foreground/80">{item.code}:</span> {item.label}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-r from-[#0D1B3D] to-[#1A237E]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Ready to Experience the Difference?
          </h2>
          <p className="text-lg text-white/80">
            Visit our testing center today and see why professionals choose LBS.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                data-testid="button-about-cta-services"
              >
                Explore Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/5"
                data-testid="button-about-cta-contact"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
