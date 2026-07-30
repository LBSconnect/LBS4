import SEO from "@/components/SEO";
import LegalPageLayout from "@/components/LegalPageLayout";
import { CalendarClock } from "lucide-react";

export default function BookingCancellationPolicy() {
  return (
    <>
      <SEO
        title="Booking, Rescheduling, Cancellation, and Refund Policy"
        canonical="/booking-cancellation-policy"
        description="LBS4 Booking, Rescheduling, Cancellation, and Refund Policy: testing appointments, boot camps, notary, passport photos, and business-center jobs."
      />
      <LegalPageLayout
        icon={CalendarClock}
        title="Booking, Rescheduling, Cancellation, and Refund Policy"
        meta="Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">1. Separate Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            Exam-sponsor fees, vouchers, licensing fees, LBS seat or facility fees, and bootcamp fees are separate
            unless the booking page expressly combines them.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">2. Testing Appointments</h2>
          <p className="text-muted-foreground leading-relaxed">
            Candidates must complete sponsor registration and eligibility requirements before arrival.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Unless sponsor rules or the booking page state otherwise:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>rescheduling requests should be made at least 48 hours before the appointment;</li>
            <li>late rescheduling may require a new LBS fee;</li>
            <li>no-shows and candidates denied admission for missing or invalid identification are non-refundable;</li>
            <li>late arrival may result in loss of the appointment;</li>
            <li>sponsor cancellation rules may be stricter and control;</li>
            <li>if LBS cancels because the center cannot deliver the appointment, LBS will refund or transfer the LBS-collected fee, but sponsor fees remain subject to sponsor rules.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">3. Certiport and Facility Fees</h2>
          <p className="text-muted-foreground leading-relaxed">
            A seat or administration fee paid to LBS does not include the exam voucher unless expressly stated.
            Fees used to reserve staffing, equipment, or capacity may be non-refundable after the cancellation
            deadline.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">4. Bootcamps</h2>
          <p className="text-muted-foreground leading-relaxed">
            Unless a specific event page states otherwise:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>requests 48 hours or more before the event may receive one transfer or a refund less non-refundable processing costs;</li>
            <li>requests within 48 hours may receive one transfer if space is available;</li>
            <li>no-shows are non-refundable;</li>
            <li>LBS cancellation results in a refund or transfer;</li>
            <li>course materials may be non-refundable after access or download.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">5. Notary, Passport Photo, and Walk-In Services</h2>
          <p className="text-muted-foreground leading-relaxed">
            Completed services are generally non-refundable. LBS will correct an error it caused when reasonably
            possible. Government rejection of a photograph or document for reasons outside LBS's control does not
            automatically create a refund.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">6. Print and Business-Center Jobs</h2>
          <p className="text-muted-foreground leading-relaxed">
            Custom and high-volume jobs may require a deposit. Customer-approved work is chargeable. LBS will
            reperform work that materially differs from accepted instructions due to LBS error.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">7. Refund Method</h2>
          <p className="text-muted-foreground leading-relaxed">
            Approved refunds are generally returned to the original payment method. Processing time depends on the
            payment provider.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">8. Contact</h2>
          <div className="bg-muted/30 rounded-lg p-6 space-y-2">
            <p className="font-semibold text-[#0D1B3D] dark:text-white">Linton Business Solutions LLC</p>
            <p className="text-muted-foreground">616 FM 1960 Road West, Suite 101</p>
            <p className="text-muted-foreground">Houston, Texas 77090-3048</p>
            <p className="text-muted-foreground">Phone: (281) 836-5357</p>
            <p className="text-muted-foreground">
              Email: <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a>
            </p>
          </div>
        </div>
      </LegalPageLayout>
    </>
  );
}
