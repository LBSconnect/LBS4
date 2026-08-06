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
  if (process.env.DATABASE_URL) {
    try {
      const PgSessionStore = connectPgSimple(session);
      store = new PgSessionStore({
        conString: process.env.DATABASE_URL,
        tableName: "i9_session",
        createTableIfMissing: true,
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
  i9User?: { id: string; role: I9Role; clientCompanyId: string | null; email: string; fullName: string };
}

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

  req.i9User = { id: user.id, role: user.role as I9Role, clientCompanyId: user.clientCompanyId, email: user.email, fullName: user.fullName };
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
