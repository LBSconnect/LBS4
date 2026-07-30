import { useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Loader2,
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  ExternalLink,
  IdCard,
  ChevronDown,
  Award,
} from "lucide-react";
import { getServiceBySlug } from "@/lib/services";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const TESTING_CENTER_FAQS = [
  {
    q: "Where can I take my Texas Real Estate license exam in Houston?",
    a: "LBS is an authorized Pearson VUE testing center where you can take your Texas Real Estate license exam. Call (281) 836-5357 to schedule.",
  },
  {
    q: "Where can I take my Texas Insurance license exam in Houston?",
    a: "LBS is an authorized testing location for Texas Property & Casualty, Life Insurance, and General Lines Insurance license exams. Call (281) 836-5357.",
  },
  {
    q: "Is LBS an authorized Pearson VUE testing center?",
    a: "Yes. LBS is an authorized Pearson VUE and Certiport testing center in Houston, TX, offering a professional, secure environment for certification exams.",
  },
  {
    q: "Does LBS offer exam prep for Texas licensing exams?",
    a: "Yes. Through our Exam Cram partnership with MyEasyPass.net, we offer practice tests for Texas Real Estate, Property & Casualty Insurance, Life Insurance, and General Lines Insurance licensing exams.",
  },
  {
    q: "What are the hours for the LBS Testing Center?",
    a: "The LBS Testing Center is open Monday through Friday from 8:30 AM to 6:00 PM and Saturday from 9:00 AM to 3:00 PM. Closed Sunday.",
  },
  {
    q: "Is there a testing center on FM 1960 in Houston?",
    a: "Yes. LBS is located at 616 FM 1960 Rd W, Suite 101, Houston, TX 77090-3048, near the FM 1960 and I-45 corridor. We offer Pearson VUE, Certiport, and PMI exam testing.",
  },
];

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || "");
  const { toast } = useToast();

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const CERTIPORT_EXAMS = [
    "Adobe Certified Professional",
    "Agriscience and Technology Careers",
    "App Development with Swift Certification",
    "Autodesk Certified User",
    "Cisco Certified Support Technician",
    "Critical Career Skills",
    "Entrepreneurship and Small Business",
    "Health Sciences Careers",
    "Hospitality and Culinary Arts Careers",
    "IC3 Digital Literacy Certification",
    "Information Technology Specialist",
    "Intuit Certifications",
    "Meta Certification",
    "Microsoft Certified Educator",
    "Microsoft Certified Fundamentals",
    "Microsoft Office Specialist",
    "Project Management Institute",
    "Unity Certified User",
  ];

  const isCertiport = slug === "certification-exam-testing";
  const isPayAtOffice = !service?.price;
  const isBootcamp = !!service?.saturdayOnly;

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: Array<{
      id: string;
      name: string;
      description: string;
      prices: Array<{
        id: string;
        unit_amount: number;
        currency: string;
        recurring: any;
      }>;
    }>;
  }>({
    queryKey: ["/api/products-with-prices"],
  });

  // Fetch available time slots for selected date
  const { data: slotsData, isLoading: slotsLoading, isError: slotsError } = useQuery<{
    slots: string[];
    daysOpen: string[];
  }>({
    queryKey: ["/api/appointments/available-slots", selectedDate?.toISOString(), service?.slug],
    queryFn: async () => {
      if (!selectedDate) return { slots: [], daysOpen: [] };
      const res = await fetch(
        `/api/appointments/available-slots?date=${selectedDate.toISOString()}&service=${service?.slug ?? ""}`
      );
      if (!res.ok) throw new Error("Failed to load time slots");
      return res.json();
    },
    enabled: !!selectedDate,
    retry: 1,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json();
    },
    onSuccess: (data: { success: boolean; checkoutUrl?: string; message?: string }) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setBookingSuccess(true);
        toast({
          title: "Appointment Booked!",
          description: "You will receive a confirmation email shortly.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Error",
        description: error.message || "Unable to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Service Not Found</h1>
            <p className="text-muted-foreground">
              The service you're looking for doesn't exist.
            </p>
            <Link href="/services">
              <Button data-testid="button-back-services">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const matchingProduct = productsData?.data?.find(
    (p) =>
      p.name.toLowerCase().includes(service.shortTitle.toLowerCase()) ||
      service.stripeProductName.toLowerCase() === p.name.toLowerCase()
  );

  const price = matchingProduct?.prices?.[0];

  // Disable days based on service type
  const disabledDays = (date: Date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    if (service?.saturdayOnly) return day !== 6; // Boot camps: Saturdays only
    return day === 0; // Closed Sunday
  };

  // Always display in Central Time (business timezone: Houston, TX)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Chicago",
    });
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !customerName || !customerEmail || !customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a date and time.",
        variant: "destructive",
      });
      return;
    }

    if (isCertiport && !selectedExam) {
      toast({
        title: "Missing Information",
        description: "Please select the exam you are registering for.",
        variant: "destructive",
      });
      return;
    }

    if (isBootcamp && !price) {
      toast({
        title: "Payment Required",
        description: "Boot Camp bookings require online payment. Please call (281) 836-5357 to complete your registration.",
        variant: "destructive",
      });
      return;
    }

    const examNote = isCertiport && selectedExam ? `Exam: ${selectedExam}` : "";
    const combinedNotes = [examNote, notes].filter(Boolean).join("\n\n") || undefined;

    const appointmentData = {
      customerName,
      customerEmail,
      customerPhone,
      serviceName: service.title,
      serviceSlug: service.slug,
      serviceId: matchingProduct?.id,
      priceId: price?.id,
      priceAmount: price?.unit_amount,
      appointmentDate: selectedTime,
      payNow: isPayAtOffice ? false : (isBootcamp ? true : !!price),
      notes: combinedNotes,
    };

    bookingMutation.mutate(appointmentData);
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Appointment Booked!</h1>
            <p className="text-muted-foreground">
              Your appointment for <span className="font-semibold">{service.title}</span> has been confirmed.
              A confirmation email has been sent to <span className="font-semibold">{customerEmail}</span>.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <p><span className="font-medium">Date:</span> {selectedDate?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p><span className="font-medium">Time:</span> {formatTime(selectedTime)}</p>
              <p><span className="font-medium">Payment:</span> {isPayAtOffice ? "Pay at office" : "Paid Online"}</p>
            </div>
            <Link href="/services">
              <Button className="mt-4">
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.longDescription,
    "url": `https://www.lbs4.com/services/${service.slug}`,
    "provider": {
      "@type": "LocalBusiness",
      "@id": "https://www.lbs4.com/#business",
      "name": "LBS Test & Exam Center",
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
    "areaServed": { "@type": "City", "name": "Houston", "addressRegion": "TX" },
    ...(service.price ? {
      "offers": {
        "@type": "Offer",
        "price": service.price.replace("$", ""),
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": `https://www.lbs4.com/services/${service.slug}`
      }
    } : {})
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={isCertiport ? "Testing Center | Pearson VUE & Certiport Exam Testing in Houston TX" : `${service.title} in Houston TX`}
        canonical={`/services/${service.slug}`}
        description={
          isCertiport
            ? "The LBS Testing Center offers authorized Pearson VUE & Certiport exam testing, Texas insurance license Boot Camps, and MyEasyPass exam prep in Houston, TX."
            : `${service.longDescription.slice(0, 155)}…`
        }
        schema={serviceSchema}
      />
      <Header />

      <section className="relative py-14 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        {service.image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${service.image})` }}
          />
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <Link href="/services">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Services
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
              <service.icon className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-4xl font-bold text-white"
                data-testid="text-detail-title"
              >
                {isCertiport ? "Pearson VUE & Certiport Exam Testing" : service.title}
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {isCertiport
                  ? "Access professional exam testing, focused preparation programs, and online study resources through LBS — including Certiport exam booking below."
                  : service.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {service.image ? (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-64 md:h-80 object-cover"
                    loading="lazy"
                    decoding="async"
                    data-testid="img-service-detail"
                  />
                </div>
              ) : (
                <div
                  className="rounded-md overflow-hidden h-64 md:h-80 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E] flex items-center justify-center"
                  data-testid="img-service-detail"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <service.icon className="w-10 h-10 text-white" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-2xl font-bold" data-testid="text-about-heading">
                  About This Service
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {service.longDescription}
                </p>
              </div>

              {service.rateTable && (
                <div className="space-y-4" data-testid="section-pricing">
                  <h2 className="text-2xl font-bold">Pricing</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {service.rateTable.map((section) => (
                      <div key={section.label} className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          {section.label}
                        </h3>
                        <div className="rounded-md border border-border/50 divide-y divide-border/50 overflow-hidden">
                          {section.rows.map((row) => (
                            <div
                              key={row.name}
                              className="flex items-center justify-between px-4 py-2.5 text-sm bg-card"
                            >
                              <span>{row.name}</span>
                              <span className="font-semibold text-[#0D1B3D] dark:text-white">
                                {row.price}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {service.rateNote && (
                    <p className="text-xs text-muted-foreground">{service.rateNote}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">What's Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 p-3 rounded-md bg-muted/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#FF6A00] mt-0.5 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-border/50">
                <CardContent className="p-6 space-y-5">
                  {!isPayAtOffice && (
                    <div className="text-center space-y-1">
                      <div className="text-3xl font-bold text-[#0D1B3D] dark:text-white">
                        {price
                          ? `$${(price.unit_amount / 100).toFixed(2)}`
                          : service.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isCertiport ? "Certiport Exam Session" : service.priceLabel}
                      </div>
                    </div>
                  )}
                  {isPayAtOffice && (
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">Payment collected in office</p>
                      {service.startingRate && (
                        <p className="text-lg font-bold text-[#0D1B3D] dark:text-white">
                          {service.startingRate}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border/50 pt-5">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-[#FF6A00]" />
                      Book an Appointment
                    </h3>

                    <div className="space-y-4">
                      {/* Date Picker */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                        <div className="border rounded-md p-2">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setSelectedTime("");
                            }}
                            disabled={disabledDays}
                            className="rounded-md"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {service?.saturdayOnly
                            ? "Available Saturdays only"
                            : "Available Mon–Sat (closed Sun)"}
                        </p>
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Select Time</Label>
                          {slotsLoading ? (
                            <div className="grid grid-cols-3 gap-2">
                              {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-10" />
                              ))}
                            </div>
                          ) : slotsError ? (
                            <p className="text-sm text-destructive">
                              Could not load available times. Please try again or call us at (281) 836-5357.
                            </p>
                          ) : slotsData?.slots && slotsData.slots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {slotsData.slots.map((slot) => (
                                <Button
                                  key={slot}
                                  data-testid="btn-time-slot"
                                  variant={selectedTime === slot ? "default" : "outline"}
                                  size="sm"
                                  className={selectedTime === slot ? "bg-[#0D1B3D]" : ""}
                                  onClick={() => setSelectedTime(slot)}
                                >
                                  {formatTime(slot)}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No available slots for this date.
                            </p>
                          )}
                          {!service?.saturdayOnly && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Mon–Fri: 9AM–5PM | Sat: 9AM–2PM
                            </p>
                          )}
                        </div>
                      )}

                      {/* Customer Info */}
                      {selectedTime && (
                        <>
                          <div className="border-t border-border/50 pt-4 space-y-3">
                            <div>
                              <Label htmlFor="name" className="text-sm">Full Name *</Label>
                              <Input
                                id="name"
                                placeholder="Your full name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-sm">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone" className="text-sm">Phone *</Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="(123) 456-7890"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                required
                              />
                            </div>
                            {isCertiport && (
                              <div>
                                <Label htmlFor="exam" className="text-sm">Exam *</Label>
                                <Select value={selectedExam} onValueChange={setSelectedExam}>
                                  <SelectTrigger id="exam">
                                    <SelectValue placeholder="Select an exam..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CERTIPORT_EXAMS.map((exam) => (
                                      <SelectItem key={exam} value={exam}>
                                        {exam}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div>
                              <Label htmlFor="notes" className="text-sm">Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Any special requests or notes..."
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Book Button */}
                          <Button
                            className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white rounded-full"
                            onClick={handleBookAppointment}
                            disabled={bookingMutation.isPending}
                            data-testid="button-submit-booking"
                          >
                            {bookingMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Booking...
                              </>
                            ) : price && !isPayAtOffice ? (
                              <>Book &amp; Pay ${(price.unit_amount / 100).toFixed(2)}</>
                            ) : isBootcamp ? (
                              <>Book &amp; Pay {service.price}</>
                            ) : (
                              "Book Appointment"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-5 space-y-4">
                    <h3 className="font-semibold text-sm">Visit Us</h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#FF6A00]" />
                        <span>
                          616 FM 1960 Rd W, Ste 101
                          <br />
                          Houston, TX 77090-3048
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 shrink-0 text-[#FF6A00]" />
                        <a href="tel:2818365357">(281) 836-5357</a>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#FF6A00]" />
                        <span>
                          Mon – Fri: 8:30 AM – 6 PM
                          <br />
                          Sat: 9 AM – 3 PM
                          <br />
                          Closed Sun
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {isCertiport && (
        <>
          <section className="py-14 bg-muted/30" data-testid="section-testing-center-overview">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF6A00]">Testing Center</p>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Testing, Preparation and Support in One Convenient Location
                </h2>
                <p className="text-muted-foreground text-lg">
                  Access professional exam testing, focused preparation programs, and online study
                  resources through LBS.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-card border border-border/50 rounded-md p-6 space-y-3" data-testid="card-testing-pearson-vue">
                  <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                  </div>
                  <h3 className="font-semibold text-lg">Pearson VUE</h3>
                  <p className="text-sm text-muted-foreground">
                    LBS is an authorized Pearson VUE testing center in Houston, TX, offering a
                    professional, secure environment for IT certifications, professional
                    licenses, and academic admissions exams.
                  </p>
                  <a href="https://home.pearsonvue.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid="link-pearson-vue-info">
                      Pearson VUE Information
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </a>
                </div>

                <div className="bg-card border border-border/50 rounded-md p-6 space-y-3" data-testid="card-testing-certiport">
                  <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                  </div>
                  <h3 className="font-semibold text-lg">Certiport</h3>
                  <p className="text-sm text-muted-foreground">
                    Book and pay for your Certiport exam right here — Microsoft Office
                    Specialist (MOS), Adobe Certified Professional, and other industry
                    certifications. $35 per session.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="link-certiport-info"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  >
                    Book &amp; Pay $35
                  </Button>
                </div>

                <div className="bg-card border border-border/50 rounded-md p-6 space-y-3" data-testid="card-testing-bootcamp">
                  <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                  </div>
                  <h3 className="font-semibold text-lg">Texas Insurance Exam Cram Bootcamps</h3>
                  <p className="text-sm text-muted-foreground">
                    Intensive Saturday morning Boot Camps for the Texas Life Insurance and
                    Property &amp; Casualty license exams, $99 per session, taught by expert
                    instructors.
                  </p>
                  <Link href="/services?filter=bootcamp">
                    <Button variant="outline" size="sm" data-testid="link-bootcamp-info">
                      View Bootcamps
                    </Button>
                  </Link>
                </div>

                <div className="bg-card border border-border/50 rounded-md p-6 space-y-3" data-testid="card-testing-myeasypass">
                  <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                  </div>
                  <h3 className="font-semibold text-lg">Prepare Online with MyEasyPass</h3>
                  <p className="text-sm text-muted-foreground">
                    Access online practice resources and exam-preparation tools designed to
                    help candidates study with greater confidence.
                  </p>
                  <a href="https://www.myeasypass.net" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid="link-myeasypass-info">
                      Visit MyEasyPass.net
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                    MyEasyPass.net is an independent exam-preparation resource and is not
                    affiliated with Pearson VUE, Certiport, or any government or licensing
                    agency.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 md:p-8 flex flex-col md:flex-row items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-[#0D1B3D]/10 dark:bg-[#0077FF]/20 flex items-center justify-center shrink-0">
                  <IdCard className="w-6 h-6 text-[#0D1B3D] dark:text-[#0077FF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Appointment Preparation</h3>
                  <p className="text-sm text-muted-foreground">
                    Bring a valid government-issued photo ID — driver's license, passport, or
                    state ID — with a name that matches your exam registration exactly. This
                    is a strict Pearson VUE and Certiport requirement. Arrive a few minutes
                    early to check in, and contact us at least 24 hours in advance if you
                    need to reschedule.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-14 bg-background" data-testid="section-testing-faq">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#FF6A00]">Common Questions</p>
                <h2 className="text-3xl font-bold">Testing Center FAQ</h2>
              </div>
              <div className="max-w-2xl mx-auto divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden bg-card">
                {TESTING_CENTER_FAQS.map((faq, i) => (
                  <div key={i}>
                    <button
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold hover:bg-muted/40 transition-colors"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      aria-expanded={openFaq === i}
                      data-testid={`button-testing-faq-${i}`}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#FF6A00] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
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
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
}
