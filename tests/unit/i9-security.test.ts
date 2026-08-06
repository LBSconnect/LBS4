/**
 * i9-security.test.ts
 *
 * Unit tests for server/i9Security.ts — pure-function crypto/masking/token
 * logic with no database or network dependency, run via Node's built-in test
 * runner (`node --test`, through tsx so .ts runs directly). These are the
 * primitives every other guarantee in the I-9 portal (encryption-at-rest,
 * masked display, session auth, CSRF, rate limiting) is built on, so they're
 * worth testing in isolation from the HTTP layer.
 *
 * PROTECTED_DATA_ENCRYPTION_KEY must be set before this file is imported —
 * i9Security's encryption functions throw if it's missing, by design (see
 * the module's own comment: never silently fall back to an insecure
 * default). Run via `npm run test:unit`, which sets a throwaway test key.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

process.env.PROTECTED_DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
process.env.SESSION_SECRET ||= "unit-test-session-secret";

const {
  encryptField, decryptField, encryptToColumn, decryptFromColumn,
  isProtectedDataEncryptionConfigured, maskSSN, maskDocumentNumber,
  hashPassword, verifyPassword, signDocumentToken, verifyDocumentToken,
  generateCsrfToken, verifyCsrfToken, checkRateLimit,
} = await import("../../server/i9Security.ts");

describe("AES-256-GCM field encryption", () => {
  test("round-trips a plaintext value", () => {
    const plaintext = "123-45-6789";
    const encrypted = encryptField(plaintext);
    assert.equal(decryptField(encrypted), plaintext);
  });

  test("two encryptions of the same plaintext produce different ciphertext (fresh IV each time)", () => {
    const a = encryptField("same value");
    const b = encryptField("same value");
    assert.notEqual(a.ciphertext, b.ciphertext);
    assert.notEqual(a.iv, b.iv);
  });

  test("tampering with the ciphertext is detected on decrypt (GCM auth tag)", () => {
    const encrypted = encryptField("sensitive value");
    const tampered = { ...encrypted, ciphertext: Buffer.from("tampered-bytes-here!").toString("base64") };
    assert.throws(() => decryptField(tampered));
  });

  test("tampering with the auth tag is detected on decrypt", () => {
    const encrypted = encryptField("sensitive value");
    const tampered = { ...encrypted, authTag: Buffer.alloc(16, 1).toString("base64") };
    assert.throws(() => decryptField(tampered));
  });

  test("encryptToColumn/decryptFromColumn round-trip through a single string column", () => {
    const column = encryptToColumn("employee data blob");
    assert.equal(decryptFromColumn(column), "employee data blob");
  });

  test("reports encryption as configured when a valid 32-byte key is set", () => {
    assert.equal(isProtectedDataEncryptionConfigured(), true);
  });
});

describe("Masking", () => {
  test("maskSSN shows only the last 4 digits", () => {
    assert.equal(maskSSN("123-45-6789"), "***-**-6789");
    assert.equal(maskSSN("123456789"), "***-**-6789");
  });

  test("maskSSN never leaks any of the first 5 digits", () => {
    const masked = maskSSN("123-45-6789");
    assert.ok(!masked.includes("123"));
    assert.ok(!masked.includes("45"));
  });

  test("maskSSN returns a fully-masked placeholder for malformed input rather than partially leaking it", () => {
    assert.equal(maskSSN("not-a-real-ssn"), "***-**-****");
  });

  test("maskDocumentNumber shows only the last 4 characters", () => {
    assert.equal(maskDocumentNumber("D1234567890"), "*******7890");
  });

  test("maskDocumentNumber fully masks values of 4 characters or fewer", () => {
    assert.equal(maskDocumentNumber("AB12"), "****");
  });
});

describe("Password hashing (scrypt)", () => {
  test("verifyPassword accepts the correct password", () => {
    const hash = hashPassword("CorrectHorseBatteryStaple1!");
    assert.equal(verifyPassword("CorrectHorseBatteryStaple1!", hash), true);
  });

  test("verifyPassword rejects an incorrect password", () => {
    const hash = hashPassword("CorrectHorseBatteryStaple1!");
    assert.equal(verifyPassword("WrongPassword", hash), false);
  });

  test("two hashes of the same password differ (random salt per call)", () => {
    const a = hashPassword("SamePassword123!");
    const b = hashPassword("SamePassword123!");
    assert.notEqual(a, b);
  });

  test("verifyPassword never throws on a malformed stored hash — fails closed", () => {
    assert.equal(verifyPassword("anything", "not-a-valid-hash-format"), false);
    assert.equal(verifyPassword("anything", ""), false);
  });
});

describe("Signed document download tokens", () => {
  test("a freshly-signed token verifies successfully for its document", () => {
    const token = signDocumentToken("doc-123", Date.now() + 60_000);
    const result = verifyDocumentToken(token, "doc-123");
    assert.equal(result.valid, true);
  });

  test("a token is rejected once past its expiry", () => {
    const token = signDocumentToken("doc-123", Date.now() - 1000);
    const result = verifyDocumentToken(token, "doc-123");
    assert.equal(result.valid, false);
    assert.equal(result.reason, "expired");
  });

  test("a token for one document is rejected when checked against another", () => {
    const token = signDocumentToken("doc-123", Date.now() + 60_000);
    const result = verifyDocumentToken(token, "doc-456");
    assert.equal(result.valid, false);
    assert.equal(result.reason, "document_mismatch");
  });

  test("a tampered token signature is rejected", () => {
    const token = signDocumentToken("doc-123", Date.now() + 60_000);
    const tampered = token.slice(0, -4) + "xxxx";
    const result = verifyDocumentToken(tampered, "doc-123");
    assert.equal(result.valid, false);
  });

  test("a malformed token string is rejected without throwing", () => {
    assert.doesNotThrow(() => verifyDocumentToken("not-a-token", "doc-123"));
    assert.equal(verifyDocumentToken("not-a-token", "doc-123").valid, false);
  });
});

describe("CSRF double-submit verification", () => {
  test("matching cookie and header tokens verify", () => {
    const token = generateCsrfToken();
    assert.equal(verifyCsrfToken(token, token), true);
  });

  test("mismatched tokens are rejected", () => {
    assert.equal(verifyCsrfToken(generateCsrfToken(), generateCsrfToken()), false);
  });

  test("a missing cookie or header token is rejected", () => {
    const token = generateCsrfToken();
    assert.equal(verifyCsrfToken(undefined, token), false);
    assert.equal(verifyCsrfToken(token, undefined), false);
    assert.equal(verifyCsrfToken(undefined, undefined), false);
  });

  test("generateCsrfToken produces sufficiently unpredictable, non-repeating values", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    assert.equal(tokens.size, 100);
  });
});

describe("Sliding-window rate limiter", () => {
  test("allows requests up to the limit, then blocks", () => {
    const key = `test-key-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000);
      assert.equal(result.allowed, true, `request ${i + 1} of 5 should be allowed`);
    }
    const sixth = checkRateLimit(key, 5, 60_000);
    assert.equal(sixth.allowed, false, "the 6th request over a limit of 5 should be blocked");
  });

  test("different keys have independent buckets", () => {
    const keyA = `bucket-a-${Date.now()}-${Math.random()}`;
    const keyB = `bucket-b-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(keyA, 3, 60_000);
    const bBucketFirstCall = checkRateLimit(keyB, 3, 60_000);
    assert.equal(bBucketFirstCall.allowed, true, "a fresh key should not be affected by another key's usage");
  });

  test("resets after the window elapses", () => {
    const key = `reset-test-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, 1, 10); // 10ms window
    const blocked = checkRateLimit(key, 1, 10);
    assert.equal(blocked.allowed, false);
    return new Promise((resolve) => {
      setTimeout(() => {
        const afterReset = checkRateLimit(key, 1, 10);
        assert.equal(afterReset.allowed, true, "a new window should allow requests again");
        resolve(undefined);
      }, 20);
    });
  });
});
