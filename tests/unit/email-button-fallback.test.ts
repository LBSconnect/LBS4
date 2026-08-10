/**
 * email-button-fallback.test.ts
 *
 * Regression coverage for a real bug: the I-9 portal's four CTA buttons
 * ("Log In to the Secure Portal", "Reset Password", "View the Agreement",
 * "Continue Onboarding" — server/i9EmailService.ts) were styled with only
 * `background: linear-gradient(...)` and white text. Email clients that
 * don't understand CSS gradients on an inline `background` shorthand
 * (Outlook desktop's Word rendering engine, some Android Gmail/Yahoo Mail
 * builds, etc.) drop the whole `background` declaration rather than
 * degrading it, leaving the button area with no background at all — so the
 * white button text renders invisible against the email's white body,
 * exactly the "reset password button not visible" report this test guards
 * against.
 *
 * Fix: every gradient CTA button also declares a solid `background-color`
 * immediately before the gradient, so clients that can't parse the gradient
 * keep the solid color (and its readable white-on-orange contrast) while
 * clients that do support gradients still get the gradient — the
 * background-color is simply overpainted.
 *
 * This test reads the template source directly rather than invoking
 * sendEmail (which would attempt a real Graph/SMTP call) — it asserts the
 * structural property the bug was about, and that every occurrence of the
 * gradient is paired with a fallback rather than checking one call site by
 * hand, so a future button added the old way fails this test too.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  path.join(__dirname, "../../server/i9EmailService.ts"),
  "utf-8"
);

// Matches an inline style="..." attribute value containing a gradient
// background, capturing everything up to the gradient declaration so we can
// check what (if anything) precedes it.
const STYLE_WITH_GRADIENT = /style="([^"]*background:\s*linear-gradient\([^"]*)"/g;

describe("i9EmailService CTA button email-client fallback", () => {
  test("template contains the expected number of gradient CTA buttons", () => {
    const matches = [...source.matchAll(STYLE_WITH_GRADIENT)];
    // Log in, reset password, agreement accepted, subscription activated.
    assert.equal(matches.length, 4, "expected exactly 4 gradient CTA buttons in i9EmailService.ts");
  });

  test("every gradient CTA button also declares a solid background-color fallback", () => {
    const matches = [...source.matchAll(STYLE_WITH_GRADIENT)];
    assert.ok(matches.length > 0, "sanity check: must find at least one gradient button to validate");

    for (const match of matches) {
      const styleValue = match[1];
      assert.match(
        styleValue,
        /background-color:\s*#[0-9a-fA-F]{3,6}\s*;/,
        `button style is missing a solid background-color fallback before the gradient: ${styleValue}`
      );
      // The fallback must come before the gradient declaration so clients
      // that understand `background` (the shorthand) let it win, while
      // clients that silently drop the unparseable gradient value keep the
      // solid color that was already applied.
      const fallbackIndex = styleValue.indexOf("background-color:");
      const gradientIndex = styleValue.indexOf("background:");
      assert.ok(
        fallbackIndex !== -1 && fallbackIndex < gradientIndex,
        `background-color fallback must precede the gradient declaration: ${styleValue}`
      );
    }
  });

  test("button text color has adequate contrast against the fallback background-color", () => {
    // The fallback is #FF6A00 (a saturated orange) with white (#ffffff)
    // button text — if either changes, re-verify contrast by eye; this test
    // just guards against someone flipping the button text back to a color
    // that reads fine on a gradient but disappears on the solid fallback.
    const matches = [...source.matchAll(STYLE_WITH_GRADIENT)];
    for (const match of matches) {
      const styleValue = match[1];
      assert.match(styleValue, /background-color:\s*#FF6A00\s*;/i);
      assert.match(styleValue, /color:\s*#ffffff\s*;/i);
    }
  });
});
