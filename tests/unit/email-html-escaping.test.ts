/**
 * email-html-escaping.test.ts
 *
 * Regression coverage for the HTML-injection bug found while auditing the
 * booking flow: server/emailService.ts (and the sibling i9EmailService.ts /
 * corporateEmailService.ts) interpolate customer-submitted strings (name,
 * notes, company info, etc.) directly into HTML email templates. None of
 * those fields carry an HTML-safety constraint at the zod-schema level, so
 * a submitter could previously get raw "<script>" / "<img onerror=...>"
 * markup embedded verbatim into the confirmation email sent to the customer
 * and the notification email sent to LBS staff.
 *
 * Fix: each of the three email-service modules now exports `escapeHtml` and
 * routes every interpolated user-controlled value through it before it goes
 * into a template literal. These tests confirm the utility itself is sound
 * (all five HTML-significant characters are neutralized) and that it's
 * idempotent/safe on already-safe input, null, and undefined — the actual
 * call sites are exercised indirectly by tests/e2e/security-pentest.spec.ts,
 * which posts these same payloads through the public booking API.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml as escapeHtmlBooking } from "../../server/emailService.ts";
import { escapeHtml as escapeHtmlI9 } from "../../server/i9EmailService.ts";
import { escapeHtml as escapeHtmlCorporate } from "../../server/corporateEmailService.ts";

const XSS_PAYLOADS = [
  "<script>alert('xss')</script>",
  '"><img src=x onerror=alert(1)>',
  "<svg onload=alert(1)>",
  "'; DROP TABLE appointments; --",
];

const IMPLEMENTATIONS: Array<[string, (v: unknown) => string]> = [
  ["server/emailService.ts", escapeHtmlBooking],
  ["server/i9EmailService.ts", escapeHtmlI9],
  ["server/corporateEmailService.ts", escapeHtmlCorporate],
];

for (const [moduleName, escapeHtml] of IMPLEMENTATIONS) {
  describe(`escapeHtml (${moduleName})`, () => {
    test("neutralizes every HTML-significant character", () => {
      const escaped = escapeHtml(`<script>&"'</script>`);
      assert.equal(escaped, "&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;");
    });

    for (const payload of XSS_PAYLOADS) {
      test(`strips executable markup from: ${payload.slice(0, 40)}`, () => {
        const escaped = escapeHtml(payload);
        assert.ok(!escaped.includes("<script>"), "must not contain a raw <script> open tag");
        assert.ok(!escaped.includes("<img"), "must not contain a raw <img tag");
        assert.ok(!escaped.includes("<svg"), "must not contain a raw <svg tag");
        assert.ok(!escaped.includes('"'), "must not contain a raw double-quote (breaks out of attribute context)");
      });
    }

    test("passes plain text through unchanged", () => {
      assert.equal(escapeHtml("Jane Smith"), "Jane Smith");
      assert.equal(escapeHtml("O'Brien & Sons, LLC"), "O&#39;Brien &amp; Sons, LLC");
    });

    test("treats null/undefined as empty string (never 'null'/'undefined' in an email)", () => {
      assert.equal(escapeHtml(null), "");
      assert.equal(escapeHtml(undefined), "");
    });

    test("coerces non-string input safely", () => {
      assert.equal(escapeHtml(42), "42");
      assert.equal(escapeHtml(true), "true");
    });
  });
}
