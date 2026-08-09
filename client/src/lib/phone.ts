/** Strips everything but digits and caps at 10 — the onChange transform for
 *  every phone <Input> sitewide. Typing "(281) 555-1234" or pasting a
 *  formatted number lands as exactly the 10 raw digits the server schema
 *  (shared/phone.ts) expects, so client and server never disagree about
 *  what a valid phone number looks like. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}
