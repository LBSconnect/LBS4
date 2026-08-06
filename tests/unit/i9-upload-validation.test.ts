/**
 * i9-upload-validation.test.ts
 *
 * Unit tests for the secure-document upload route's server-side MIME-type
 * validation (server/i9Routes.ts). The upload endpoint accepts a client-
 * declared `mimeType` field alongside the file bytes — this checks that the
 * server verifies the bytes actually match the declared type (magic-byte
 * sniffing) rather than trusting client-supplied metadata, closing a MIME-
 * spoofing gap (e.g. an executable or HTML/script payload uploaded with a
 * declared type of `application/pdf` or `image/png`).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

process.env.PROTECTED_DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
process.env.SESSION_SECRET ||= "unit-test-session-secret";

const { magicBytesMatchMimeType } = await import("../../server/i9Routes.ts");

const REAL_PDF = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj", "latin1");
const REAL_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const REAL_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const FAKE_EXECUTABLE = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // "MZ" (Windows PE) header
const HTML_PAYLOAD = Buffer.from("<html><script>alert(document.cookie)</script></html>");

describe("Secure-document upload — magic-byte MIME validation", () => {
  test("accepts a real PDF declared as application/pdf", () => {
    assert.equal(magicBytesMatchMimeType(REAL_PDF, "application/pdf"), true);
  });

  test("accepts a real PNG declared as image/png", () => {
    assert.equal(magicBytesMatchMimeType(REAL_PNG, "image/png"), true);
  });

  test("accepts a real JPEG declared as image/jpeg", () => {
    assert.equal(magicBytesMatchMimeType(REAL_JPEG, "image/jpeg"), true);
  });

  test("rejects an executable disguised as a PDF", () => {
    assert.equal(magicBytesMatchMimeType(FAKE_EXECUTABLE, "application/pdf"), false);
  });

  test("rejects an HTML/script payload disguised as a PNG", () => {
    assert.equal(magicBytesMatchMimeType(HTML_PAYLOAD, "image/png"), false);
  });

  test("rejects a PDF's bytes declared as image/jpeg (cross-type mismatch)", () => {
    assert.equal(magicBytesMatchMimeType(REAL_PDF, "image/jpeg"), false);
  });

  test("rejects an empty or too-short buffer", () => {
    assert.equal(magicBytesMatchMimeType(Buffer.alloc(0), "application/pdf"), false);
    assert.equal(magicBytesMatchMimeType(Buffer.from([0x25, 0x50]), "application/pdf"), false);
  });

  test("rejects an unrecognized declared MIME type outright", () => {
    assert.equal(magicBytesMatchMimeType(REAL_PDF, "application/octet-stream"), false);
  });
});
