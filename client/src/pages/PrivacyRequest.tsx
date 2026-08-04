import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SERVICE_OPTIONS = ["LBSconnect", "MyEasyPass", "Work-A-Beez", "LBS4", "Other"] as const;

const REQUEST_TYPE_OPTIONS = [
  "Access or confirmation",
  "Copy or portability",
  "Correction",
  "Deletion",
  "Marketing opt-out",
  "Targeted-advertising or sale opt-out",
  "Profiling opt-out",
  "Appeal of a previous decision",
  "Authorized-agent request",
  "Other privacy question",
] as const;

export default function PrivacyRequest() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    service: "" as (typeof SERVICE_OPTIONS)[number] | "",
    requestType: "" as (typeof REQUEST_TYPE_OPTIONS)[number] | "",
    identifier: "",
    description: "",
    preferredResponseMethod: "",
    onBehalfOfAnother: false,
  });

  const requestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/privacy-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Privacy Request Submitted",
        description: "We'll respond as required by law, typically within 45 days.",
      });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.service || !formData.requestType) {
      toast({
        title: "Missing information",
        description: "Please select the website/service and request type.",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Privacy Request Procedure and Form"
        canonical="/privacy-request"
        description="Submit a privacy request to Linton Business Solutions LLC (LBS): access, correction, deletion, opt-out, or appeal requests for lbsconnect.net, myeasypass.net, workabeez.net, and lbs4.com."
      />
      <Header />

      <section className="relative py-16 bg-gradient-to-br from-[#0D1B3D] to-[#1A237E]">
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90">
            <FileCheck className="w-4 h-4 text-[#FF2D55]" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Request Procedure and Form</h1>
          <p className="text-white/80">Version 1.0 · Effective Date: July 30, 2026 · Last Updated: July 30, 2026</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Public Instructions</h2>
              <p className="text-muted-foreground leading-relaxed">
                To submit a privacy request, email <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a> with
                the subject line "Privacy Request" or use the form below.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Do not send passwords, full payment-card numbers, Social Security numbers, or unnecessary copies of
                identification.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Request Types</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                {REQUEST_TYPE_OPTIONS.map((type) => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Verification</h2>
              <p className="text-muted-foreground leading-relaxed">
                LBS may verify a request by matching information already associated with the requester, confirming
                control of an email address or account, asking for transaction or appointment details, or using
                another proportionate method. Highly sensitive requests may require additional verification.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Work-A-Beez Employee Requests</h2>
              <p className="text-muted-foreground leading-relaxed">
                If the information is maintained by an employer through Work-A-Beez, the employee should ordinarily
                submit the request to the employer. LBS will assist the employer as required by contract and
                applicable law.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Response Process</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Record the request and date received.</li>
                <li>Determine whether LBS or a customer controls the information.</li>
                <li>Verify identity and authority.</li>
                <li>Search relevant systems.</li>
                <li>Apply legal and contractual exceptions.</li>
                <li>Respond within the applicable period.</li>
                <li>Record the outcome and any appeal.</li>
                <li>Securely deliver responsive information.</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Where the Texas Data Privacy and Security Act applies, LBS will generally respond without undue
                delay and within 45 days, subject to permitted extensions.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Request Form</h2>

              {submitted ? (
                <Card className="border-border/50">
                  <CardContent className="p-8 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                    <h3 className="text-lg font-semibold">Request Submitted</h3>
                    <p className="text-sm text-muted-foreground">
                      We've recorded your privacy request and sent a confirmation to your email. We'll respond as
                      required by law, typically within 45 days.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-privacy-request">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="pr-name">Name *</Label>
                          <Input
                            id="pr-name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            data-testid="input-privacy-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pr-email">Email *</Label>
                          <Input
                            id="pr-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            data-testid="input-privacy-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pr-phone">Telephone (optional)</Label>
                          <Input
                            id="pr-phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            data-testid="input-privacy-phone"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pr-org">Organization or employer (if relevant)</Label>
                          <Input
                            id="pr-org"
                            value={formData.organization}
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                            data-testid="input-privacy-organization"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Website or service involved *</Label>
                          <Select
                            required
                            value={formData.service}
                            onValueChange={(v) => setFormData({ ...formData, service: v as typeof formData.service })}
                          >
                            <SelectTrigger data-testid="select-privacy-service">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Request type *</Label>
                          <Select
                            required
                            value={formData.requestType}
                            onValueChange={(v) => setFormData({ ...formData, requestType: v as typeof formData.requestType })}
                          >
                            <SelectTrigger data-testid="select-privacy-request-type">
                              <SelectValue placeholder="Select a request type" />
                            </SelectTrigger>
                            <SelectContent>
                              {REQUEST_TYPE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pr-identifier">Account, appointment, order, or transaction identifier</Label>
                        <Input
                          id="pr-identifier"
                          placeholder="Do not include passwords"
                          value={formData.identifier}
                          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                          data-testid="input-privacy-identifier"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pr-description">Description of request *</Label>
                        <Textarea
                          id="pr-description"
                          required
                          rows={5}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          data-testid="textarea-privacy-description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pr-response-method">Preferred response method</Label>
                        <Input
                          id="pr-response-method"
                          placeholder="e.g. Email, Phone, Mail"
                          value={formData.preferredResponseMethod}
                          onChange={(e) => setFormData({ ...formData, preferredResponseMethod: e.target.value })}
                          data-testid="input-privacy-response-method"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Are you submitting for another person?</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="onBehalfOfAnother"
                              checked={formData.onBehalfOfAnother === true}
                              onChange={() => setFormData({ ...formData, onBehalfOfAnother: true })}
                              data-testid="radio-privacy-on-behalf-yes"
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="onBehalfOfAnother"
                              checked={formData.onBehalfOfAnother === false}
                              onChange={() => setFormData({ ...formData, onBehalfOfAnother: false })}
                              data-testid="radio-privacy-on-behalf-no"
                            />
                            No
                          </label>
                        </div>
                        {formData.onBehalfOfAnother && (
                          <p className="text-xs text-muted-foreground">
                            Please describe your proof of authority (e.g. power of attorney, parent/guardian
                            relationship) in the description above. We may follow up for verification.
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#FF6A00] to-[#FF2D55] text-white border-0 rounded-full"
                        disabled={requestMutation.isPending}
                        data-testid="button-submit-privacy-request"
                      >
                        {requestMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Privacy Request"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#0D1B3D] dark:text-white">Appeal</h2>
              <p className="text-muted-foreground leading-relaxed">
                To appeal a denied request, email <a href="mailto:info@lbsconnect.net" className="text-[#0D1B3D] dark:text-[#0077FF] hover:underline">info@lbsconnect.net</a> with
                the subject line "Privacy Appeal" and include the original request date, response, and reason for
                appeal.
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
