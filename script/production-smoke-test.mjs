#!/usr/bin/env node
// Fast, read-only post-merge smoke test against the live production site.
// Not a substitute for the full pre-merge regression suite — just confirms
// the handful of things that would mean "something is badly wrong" right
// after a deploy: homepage loads, a couple of key pages load, no page
// literally 500s. Exits non-zero on failure so the workflow step that calls
// this can gate on it.

const base = process.argv[2];
if (!base) {
  console.error("Usage: node production-smoke-test.mjs <production-url>");
  process.exit(1);
}

const CHECKS = [
  { path: "/", label: "Homepage" },
  { path: "/services", label: "Services listing" },
  { path: "/for-businesses", label: "For Businesses" },
  { path: "/employer-services/new-hire-verification", label: "I-9 marketing page" },
  { path: "/contact", label: "Contact page" },
  { path: "/about", label: "About page" },
];

let failed = false;
const results = [];

for (const check of CHECKS) {
  const url = new URL(check.path, base).toString();
  try {
    const start = Date.now();
    const res = await fetch(url);
    const ms = Date.now() - start;
    const ok = res.status === 200;
    results.push({ ...check, url, status: res.status, ms, ok });
    if (!ok) failed = true;
    console.log(`${ok ? "OK  " : "FAIL"} ${res.status} ${ms}ms  ${check.label} (${url})`);
  } catch (e) {
    results.push({ ...check, url, error: e.message, ok: false });
    failed = true;
    console.log(`FAIL ERROR ${check.label} (${url}): ${e.message}`);
  }
}

console.log(`\nSmoke test: ${results.filter((r) => r.ok).length}/${results.length} passed`);

if (failed) {
  console.error("\nPost-deploy smoke test FAILED. If this run auto-merged, consider reverting the merge commit on main.");
  process.exit(1);
}
