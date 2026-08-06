// ─────────────────────────────────────────────────────────────────────────────
// Security primitives for the New-Hire Verification & Form I-9 Support portal.
//
// This module is the ONLY place that touches raw protected employee values
// (SSNs, document numbers) or session secrets. Everything here uses Node's
// built-in `crypto` module — no new third-party dependency.
//
// Encryption: AES-256-GCM, keyed from PROTECTED_DATA_ENCRYPTION_KEY (required,
// 32-byte key, base64). Each value gets a fresh random IV; the auth tag is
// stored alongside the ciphertext so tampering is detected on decrypt.
//
// Passwords: scrypt with a random salt per user (Node's recommended KDF when
// bcrypt/argon2 aren't installed) + timing-safe comparison.
//
// Signed download tokens: HMAC-SHA256 over {documentId, expiresAt}, so a
// SecureDocument can be served through a short-lived link without a public
// object-storage bucket or its own auth model.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv, createHmac } from "crypto";

const ENCRYPTION_KEY_B64 = process.env.PROTECTED_DATA_ENCRYPTION_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET || "changeme-dev-only-do-not-use-in-production";

let cachedKey: Buffer | null = null;

/** Throws loudly if PROTECTED_DATA_ENCRYPTION_KEY is missing/malformed — we never
 *  silently fall back to an insecure default for real employee data. Callers that
 *  handle ProtectedEmployeeData must catch this and surface the "Secure portal
 *  configuration required" gate rather than storing anything unencrypted. */
function getEncryptionKey(): Buffer {
  if (cachedKey) return cachedKey;
  if (!ENCRYPTION_KEY_B64) {
    throw new Error(
      "PROTECTED_DATA_ENCRYPTION_KEY is not configured. Generate one with " +
      "`node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"` " +
      "and set it as an environment variable before collecting protected employee data."
    );
  }
  const key = Buffer.from(ENCRYPTION_KEY_B64, "base64");
  if (key.length !== 32) {
    throw new Error("PROTECTED_DATA_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256).");
  }
  cachedKey = key;
  return key;
}

/** True once a real encryption key is configured — routes that touch
 *  ProtectedEmployeeData/SecureDocument check this before accepting writes. */
export function isProtectedDataEncryptionConfigured(): boolean {
  return !!ENCRYPTION_KEY_B64 && Buffer.from(ENCRYPTION_KEY_B64, "base64").length === 32;
}

export interface EncryptedField {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

export function encryptField(plaintext: string): EncryptedField {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptField(encrypted: EncryptedField): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Serializes an EncryptedField into one string for a single DB column (JSON is
 *  fine here — the value is meaningless without the server-side key). */
export function encryptToColumn(plaintext: string): string {
  return JSON.stringify(encryptField(plaintext));
}
export function decryptFromColumn(column: string): string {
  return decryptField(JSON.parse(column) as EncryptedField);
}

/** Masks a protected value for display outside the narrow "reveal" flow —
 *  e.g. SSN -> "***-**-1234". Never render the unmasked value in list views,
 *  reports, notifications, analytics, or URLs. */
export function maskSSN(ssn: string): string {
  const digits = ssn.replace(/\D/g, "");
  if (digits.length !== 9) return "***-**-****";
  return `***-**-${digits.slice(5)}`;
}
export function maskDocumentNumber(value: string): string {
  if (value.length <= 4) return "*".repeat(value.length);
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

// ─── Password hashing (scrypt) ─────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split(":");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, 64);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// ─── Password reset tokens ──────────────────────────────────────────────────
// The raw token is high-entropy (32 random bytes) and is only ever seen in
// the emailed reset link and, transiently, by the client submitting it back.
// The database stores a SHA-256 hash of it (not the token itself, and not
// scrypt — this is a lookup hash for a high-entropy random value, not a
// password, so a fast hash is appropriate and correct here), so a database
// compromise alone can't be used to redeem outstanding reset links.

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHmac("sha256", SESSION_SECRET).update(token).digest("hex");
}

// ─── Signed, short-lived document download tokens ──────────────────────────

export function signDocumentToken(documentId: string, expiresAtMs: number): string {
  const payload = `${documentId}.${expiresAtMs}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyDocumentToken(token: string, documentId: string): { valid: boolean; reason?: string } {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return { valid: false, reason: "malformed" };
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (sig.length !== expectedSig.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return { valid: false, reason: "invalid_signature" };
  }
  const [id, expStr] = payload.split(".");
  if (id !== documentId) return { valid: false, reason: "document_mismatch" };
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return { valid: false, reason: "expired" };
  return { valid: true };
}

// ─── MFA: TOTP (RFC 6238, on top of HOTP / RFC 4226) ────────────────────────
// Self-hosted, no third-party auth provider or dependency — the entire
// primitive is HMAC-SHA1 over a 30-second time counter, which Node's crypto
// module already does natively (the same building block used elsewhere in
// this file for signed tokens). Compatible with any standard authenticator
// app (Google Authenticator, Authy, 1Password, etc.), which all implement
// the same RFC. Enrollment shows the secret as a manually-typed code rather
// than a scannable QR image — every authenticator app supports manual entry
// as a first-class alternative to scanning, and generating a QR code from
// scratch (Reed-Solomon error correction, module placement) is a large,
// easy-to-get-subtly-wrong algorithm that doesn't belong hand-rolled here;
// a real QR image can be layered on top of this later with a small
// rendering-only dependency if wanted, without touching anything below.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = "";
  for (let i = 0; i < buf.length; i++) bits += buf[i].toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return out;
}

function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** A fresh 20-byte (160-bit) secret, base32-encoded — the standard secret
 *  length authenticator apps expect. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** otpauth:// provisioning URI — authenticator apps that DO support
 *  scanning (most, when shown as a QR code by whatever renders this URI)
 *  will pick this up; apps that don't can still use the raw secret shown
 *  alongside it for manual entry. */
export function totpProvisioningUri(secret: string, accountLabel: string, issuer = "LBS I-9 Portal"): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

function hotp(secretBuf: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuf.writeUInt32BE(counter % 2 ** 32, 4);
  const hmac = createHmac("sha1", secretBuf).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 1_000_000).padStart(6, "0");
}

/** Accepts the current 30-second time step and one step of drift in either
 *  direction, so a slightly-off device clock (or the seconds ticking over
 *  mid-entry) doesn't spuriously reject a correct code. */
export function verifyTotpCode(secret: string, code: string, windowSteps = 1): boolean {
  return matchTotpCodeStep(secret, code, windowSteps) !== null;
}

/** Same matching logic as verifyTotpCode, but returns the actual 30-second
 *  time-step the code matched (or null) so callers can enforce single-use —
 *  rejecting a step at or before one already redeemed for this user closes
 *  the replay window a bare boolean check can't. */
export function matchTotpCodeStep(secret: string, code: string, windowSteps = 1): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secretBuf = base32Decode(secret);
  if (secretBuf.length === 0) return null;
  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let drift = -windowSteps; drift <= windowSteps; drift++) {
    const step = currentStep + drift;
    const expected = hotp(secretBuf, step);
    if (expected.length === code.length && timingSafeEqual(Buffer.from(expected), Buffer.from(code))) return step;
  }
  return null;
}

// ─── MFA login-challenge tokens ─────────────────────────────────────────────
// Issued once a password check passes for an MFA-enabled account, proving
// "this request already cleared the password step" without establishing a
// real session — the actual session is only created after the TOTP code
// also verifies (see POST /auth/mfa/verify in i9Routes.ts).

export function signMfaChallengeToken(userId: string, expiresAtMs: number): string {
  const payload = `${userId}.${expiresAtMs}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyMfaChallengeToken(token: string): { valid: boolean; userId?: string } {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return { valid: false };
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expectedSig = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (sig.length !== expectedSig.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return { valid: false };
  const [userId, expStr] = payload.split(".");
  const exp = Number(expStr);
  if (!exp || Date.now() > exp) return { valid: false };
  return { valid: true, userId };
}

// ─── CSRF (double-submit cookie) ────────────────────────────────────────────

export function generateCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function verifyCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  return timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

// ─── Minimal in-memory rate limiter ─────────────────────────────────────────
// Sliding-window counter per key (e.g. IP+route). Good enough for a single
// Node process; a multi-instance deployment should move this to Redis, but
// this still stops naive brute-force/spam without adding a dependency.

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limit - bucket.count };
}

// Periodic cleanup so the map doesn't grow unbounded in a long-running process.
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitBuckets.entries()).forEach(([key, bucket]) => {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  });
}, 5 * 60 * 1000).unref?.();
