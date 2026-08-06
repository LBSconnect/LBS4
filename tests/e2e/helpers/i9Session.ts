/**
 * i9Session.ts
 *
 * Minimal cookie-jar HTTP client for exercising the I-9 portal's
 * session-cookie + CSRF-double-submit auth model from plain `fetch` calls,
 * without spinning up a browser. Each Session instance represents one
 * independent identity (its own session + CSRF cookies), so tests can hold
 * several concurrently — e.g. two client companies, to test tenant
 * isolation, or an admin and a case processor at once.
 */

export class I9Session {
  readonly name: string;
  private cookies: Record<string, string> = {};

  constructor(name: string) {
    this.name = name;
  }

  private storeCookies(res: Response) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of raw) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      const k = pair.slice(0, idx);
      const v = pair.slice(idx + 1);
      this.cookies[k] = v;
    }
  }

  get cookieHeader(): string {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  }

  private get csrf(): string | undefined {
    return this.cookies["i9_csrf"];
  }

  async req<T = any>(baseUrl: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: T }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.cookieHeader) headers["Cookie"] = this.cookieHeader;
    if (!["GET", "HEAD"].includes(method) && this.csrf) headers["X-CSRF-Token"] = this.csrf;
    const res = await fetch(baseUrl + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    this.storeCookies(res);
    let json: any = {};
    try { json = await res.json(); } catch { /* no body */ }
    return { status: res.status, json };
  }
}

export function randSuffix(n = 8): string {
  return Math.random().toString(36).slice(2, 2 + n);
}
