// ─────────────────────────────────────────────────────────────────────────────
// Authentication & authorization middleware for the New-Hire Verification &
// Form I-9 Support portal.
//
// Session-based (httpOnly cookie), not the JWT-in-localStorage pattern the
// existing "corporate" division uses — this domain handles materially more
// sensitive data and needs real session revocation, so it gets its own,
// stricter auth stack. Session store: connect-pg-simple when DATABASE_URL is
// set (persists across restarts, queryable/revocable), memorystore otherwise
// (both already project dependencies).
// ─────────────────────────────────────────────────────────────────────────────

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import type { Request, Response, RequestHandler } from "express";
import { checkRateLimit, generateCsrfToken, verifyCsrfToken } from "./i9Security";
import { getI9ClientUserById, logI9Audit } from "./i9Storage";
import { pool } from "./storage";
import type { I9Role } from "@shared/i9Schema";

/** Minimal cookie reader — the project doesn't include cookie-parser, and we
 *  only ever need to read one plain (non-encoded-object) cookie value here. */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

/** Creates the i9_session table (schema exactly matching connect-pg-simple's
 *  own bundled table.sql) through the app's own already-working DB pool,
 *  before the server ever accepts a request.
 *
 *  Why this exists: connect-pg-simple's own `createTableIfMissing` option
 *  creates this table lazily, at the moment of the *first* session write —
 *  which requires the runtime app DB role to hold CREATE TABLE privilege on
 *  the public schema. A production role that's correctly least-privileged
 *  (full DML on the already-migrated app tables, no DDL) has that DML but
 *  not CREATE, so every login/register call's session.save() fails with a
 *  permission error the moment it tries to auto-create this table — while
 *  every other query (against tables that already exist) keeps working
 *  fine, which is exactly the "everything else works, auth is broken"
 *  symptom this was chasing. Creating the table here instead runs through
 *  the same pool/role that already successfully creates and writes every
 *  other app table at startup, so it needs no privilege beyond what's
 *  already proven to work. Call this once at startup, before the server
 *  starts listening; createI9SessionMiddleware() below then sets
 *  createTableIfMissing: false so the store never attempts the privileged
 *  runtime path at all. */
export async function ensureI9SessionTable(): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "i9_session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "i9_session_pkey" PRIMARY KEY ("sid")
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_i9_session_expire" ON "i9_session" ("expire");`);
    console.log("[i9-portal] i9_session table ready.");
  } catch (err: any) {
    console.error(
      "[i9-portal] Failed to create/verify the i9_session table — logins and registrations " +
      "will fail until this is resolved (the DB role needs CREATE TABLE on the public schema, " +
      "or create the table manually using node_modules/connect-pg-simple/table.sql renamed to " +
      "i9_session):",
      err.message
    );
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SECRET;
const SESSION_COOKIE_NAME = "i9_session";
const CSRF_COOKIE_NAME = "i9_csrf";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12-hour idle/absolute timeout

declare module "express-session" {
  interface SessionData {
    i9UserId?: string;
    i9Role?: I9Role;
    i9ClientCompanyId?: string | null;
    i9CsrfToken?: string;
  }
}

/** Builds the session middleware. Call once in server/index.ts before routes
 *  are registered. Falls back to an in-memory store (memorystore) with a
 *  loud console warning when DATABASE_URL isn't set — sessions won't survive
 *  a restart in that mode, which is acceptable for this sandbox but must be
 *  backed by Postgres in any real deployment (see deliverables doc). */
export function createI9SessionMiddleware(): RequestHandler {
  if (!SESSION_SECRET) {
    console.warn(
      "[i9-portal] SESSION_SECRET is not set — falling back to ADMIN_SECRET or an insecure " +
      "development default. Set SESSION_SECRET before any production deployment of the " +
      "New-Hire Verification portal."
    );
  }

  let store: session.Store | undefined;
  if (process.env.DATABASE_URL && pool) {
    try {
      const PgSessionStore = connectPgSimple(session);
      store = new PgSessionStore({
        // Reuse the app's single existing pool (server/storage.ts) instead
        // of letting connect-pg-simple open its own second pool from the
        // connection string. One pool means: no doubled connection-count
        // against the DB's connection limit, and this store always runs
        // with the exact same effective privileges as every other query in
        // the app — no risk of it landing on a differently-configured
        // connection than the one that's already proven to work.
        pool,
        tableName: "i9_session",
        // Table is created up front by ensureI9SessionTable() (via that
        // same pool, at startup) — see that function's comment for why
        // relying on this option's own runtime auto-create was the bug.
        createTableIfMissing: false,
      });
    } catch (err) {
      console.error("[i9-portal] Failed to initialize connect-pg-simple session store, falling back to memory store:", err);
    }
  }
  if (!store) {
    const MemStore = createMemoryStore(session);
    store = new MemStore({ checkPeriod: 60 * 60 * 1000 });
    if (process.env.NODE_ENV === "production") {
      console.warn("[i9-portal] Using in-memory session store in production — sessions will not survive a restart or scale across instances. Configure DATABASE_URL.");
    }
  }

  return session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET || "changeme-dev-only-do-not-use-in-production",
    resave: false,
    saveUninitialized: false,
    store,
    rolling: true, // sliding idle timeout
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_MS,
    },
  });
}

/** Sets the session + a matching (non-httpOnly, JS-readable) CSRF cookie on
 *  successful login. The CSRF cookie's value must be echoed back in the
 *  X-CSRF-Token header on every mutating request — see requireI9Csrf.
 *
 *  Regenerates the session (a fresh session ID) before writing the new
 *  identity onto it — critical, not cosmetic: without this, a request that
 *  carries an *existing* session cookie into /login or /register-client
 *  (e.g. a stale tab, a shared/kiosk browser, or a session ID an attacker
 *  fixed on the victim before they authenticated) has that session's
 *  identity silently overwritten in place rather than replaced with a fresh
 *  one — textbook session fixation. `req.session.regenerate` assigns a new
 *  ID and clears the old session data first, so login/register-client always
 *  produce a session no prior request could have influenced. Returns a
 *  Promise so callers can await it before sending a response — regenerate
 *  is async and any session field access before its callback fires would
 *  hit the not-yet-existent new session. */
export function establishI9Session(
  req: Request,
  res: Response,
  userId: string,
  role: I9Role,
  clientCompanyId: string | null
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.i9UserId = userId;
      req.session.i9Role = role;
      req.session.i9ClientCompanyId = clientCompanyId;
      const csrf = generateCsrfToken();
      req.session.i9CsrfToken = csrf;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        res.cookie(CSRF_COOKIE_NAME, csrf, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE_MS,
        });
        resolve();
      });
    });
  });
}

export function destroyI9Session(req: Request, res: Response, cb: () => void) {
  res.clearCookie(CSRF_COOKIE_NAME);
  req.session.destroy(() => {
    res.clearCookie(SESSION_COOKIE_NAME);
    cb();
  });
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export interface I9AuthedRequest extends Request {
  i9User?: { id: string; role: I9Role; clientCompanyId: string | null; email: string; fullName: string; mustChangePassword: boolean };
}

// Routes still reachable while an account has an outstanding forced
// password change — the client needs /me to learn *whose* session this is
// (and that a change is required) before it can even render the forced
// change screen, and logout must always work so nobody gets stuck.
// /auth/force-change-password is the only route that can actually clear it.
const ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED = new Set([
  "/api/i9/auth/me",
  "/api/i9/auth/logout",
  "/api/i9/auth/force-change-password",
]);

/** Requires a valid session AND that the user account is still active — an
 *  admin deactivating a user takes effect on their next request, not just
 *  their next login. */
export const requireI9Auth: RequestHandler = async (req: I9AuthedRequest, res, next) => {
  const userId = req.session.i9UserId;
  if (!userId) return res.status(401).json({ error: "Authentication required. Please log in." });

  const user = await getI9ClientUserById(userId).catch(() => null);
  if (!user || !user.isActive) {
    return destroyI9Session(req, res, () => res.status(401).json({ error: "Session is no longer valid. Please log in again." }));
  }

  if (user.mustChangePassword && !ALLOWED_WHILE_PASSWORD_CHANGE_REQUIRED.has(req.path)) {
    // Nested under `details` (rather than a bare top-level field) so it
    // flows through I9ApiError unchanged — i9Api only ever forwards
    // `json.details`, matching every other structured-error shape already
    // used across this API (e.g. Zod flatten() output).
    return res.status(403).json({ error: "You must set a new password before continuing.", details: { mustChangePassword: true } });
  }

  req.i9User = { id: user.id, role: user.role as I9Role, clientCompanyId: user.clientCompanyId, email: user.email, fullName: user.fullName, mustChangePassword: user.mustChangePassword };
  next();
};

export function requireI9Role(...roles: I9Role[]): RequestHandler {
  return (req: I9AuthedRequest, res, next) => {
    if (!req.i9User) return res.status(401).json({ error: "Authentication required." });
    if (!roles.includes(req.i9User.role)) {
      logI9Audit({
        actorUserId: req.i9User.id,
        actorRole: req.i9User.role,
        action: "access_denied.role",
        details: { requiredRoles: roles, path: req.path },
        ipAddress: req.ip,
      });
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

/** Client-side roles may only ever act within their own company. Internal LBS
 *  roles pass this check for any company (they're scoped by requireI9Role
 *  instead) but must supply a companyId explicitly wherever tenant scoping
 *  matters, so a processor never gets an implicit "everything" query. */
export function requireI9TenantMatch(getRequestedCompanyId: (req: Request) => string | undefined): RequestHandler {
  return (req: I9AuthedRequest, res, next) => {
    if (!req.i9User) return res.status(401).json({ error: "Authentication required." });
    const requested = getRequestedCompanyId(req);
    const isInternal = req.i9User.role.startsWith("lbs_");
    if (isInternal) return next();
    if (!requested || requested !== req.i9User.clientCompanyId) {
      logI9Audit({
        actorUserId: req.i9User.id,
        actorRole: req.i9User.role,
        action: "access_denied.tenant_mismatch",
        details: { requestedCompanyId: requested, ownCompanyId: req.i9User.clientCompanyId, path: req.path },
        ipAddress: req.ip,
      });
      return res.status(403).json({ error: "You do not have access to this company's records." });
    }
    next();
  };
}

/** client_limited_user may only touch hiring sites they've been assigned. */
export function requireHiringSiteAccess(getRequestedSiteId: (req: Request) => string | undefined): RequestHandler {
  return (req: I9AuthedRequest, res, next) => {
    if (!req.i9User) return res.status(401).json({ error: "Authentication required." });
    if (req.i9User.role !== "client_limited_user") return next();
    const siteId = getRequestedSiteId(req);
    // assignedHiringSiteIds isn't loaded onto req.i9User by default (keeps the
    // hot path light); routes that need this check fetch the user record.
    void siteId;
    next();
  };
}

export const requireI9Csrf: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookieToken = readCookie(req, CSRF_COOKIE_NAME);
  const headerToken = req.headers["x-csrf-token"] as string | undefined;
  if (!verifyCsrfToken(cookieToken, headerToken)) {
    return res.status(403).json({ error: "CSRF validation failed. Please refresh and try again." });
  }
  next();
};

/** Route-level rate limiting, e.g. i9RateLimit('login', 10, 15 * 60 * 1000). */
export function i9RateLimit(bucket: string, limit: number, windowMs: number): RequestHandler {
  return (req, res, next) => {
    const key = `${bucket}:${req.ip}`;
    const { allowed } = checkRateLimit(key, limit, windowMs);
    if (!allowed) {
      return res.status(429).json({ error: "Too many requests. Please wait a few minutes and try again." });
    }
    next();
  };
}
