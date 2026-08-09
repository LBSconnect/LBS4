import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for phone-number validation, used by every insert
// schema sitewide (contact form, bookings, corporate notary, I-9 leads,
// employer intake, business intake, protected employee data).
//
// A phone number is stored and validated as exactly 10 digits. The client
// (client/src/lib/phone.ts) strips non-digits as the user types, so a normal
// form submission already arrives clean — but this schema also normalizes
// server-side (stripping spaces/dashes/parens/dots) rather than only
// rejecting anything not already bare digits, so a formatted value from a
// direct API call, a pasted number, or a test fixture still validates
// correctly as long as it resolves to exactly 10 digits. What's actually
// stored is always the normalized 10-digit string either way.
// ─────────────────────────────────────────────────────────────────────────────

export const PHONE_DIGITS_REGEX = /^\d{10}$/;
export const PHONE_FORMAT_MESSAGE = "Phone number must be exactly 10 digits.";

function stripToDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Use where a phone number is mandatory. */
export const phoneSchema = z
  .string()
  .transform(stripToDigits)
  .refine((v) => PHONE_DIGITS_REGEX.test(v), { message: PHONE_FORMAT_MESSAGE });

/** Use where a phone number is optional — empty/undefined is fine, but a
 *  value that IS provided must still normalize to exactly 10 digits (not
 *  partially validated, not skipped). */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v ? stripToDigits(v) : v))
  .refine((v) => !v || PHONE_DIGITS_REGEX.test(v), { message: PHONE_FORMAT_MESSAGE });
