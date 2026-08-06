#!/usr/bin/env node
// Read-only crawl of the live production site for the weekly site-health
// workflow. This site is a client-rendered Vite/React SPA — its raw HTML
// response is just a script-loading shell with no real links in it, so a
// plain fetch()-based crawler sees nothing. This uses a real headless
// Chromium (Playwright is already a project dependency; no new dependency
// added) to render each page and read the actual DOM for same-origin
// anchor hrefs, then checks each discovered URL's HTTP status separately
// via a lightweight fetch (no need to render every page twice).
//
// Deliberately low-volume and GET-only, per this workflow's own rule
// against aggressive scanning of production.
//
// Usage: node script/weekly-crawl.mjs https://www.lbs4.com > report.json

import { chromium } from "playwright";
import { existsSync } from "node:fs";

const startUrl = process.argv[2];
if (!startUrl) {
  console.error("Usage: node weekly-crawl.mjs <start-url>");
  process.exit(1);
}

const origin = new URL(startUrl).origin;
const MAX_PAGES = 80; // safety cap — this site has ~40-50 real routes
const REQUEST_DELAY_MS = 400; // be gentle with the live site

// This sandbox's environment pre-installs Chromium at a fixed path and
// skips Playwright's own browser download; a real GitHub Actions runner
// installs Playwright's browser normally (see the workflow's "Install
// Playwright browser" step) and `chromium.launch()` finds it without any
// explicit path. Only override when that special sandbox path is actually
// present, so this script works unmodified in both places.
const SANDBOX_CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH || (existsSync(SANDBOX_CHROMIUM_PATH) ? SANDBOX_CHROMIUM_PATH : undefined);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isCrawlable(url) {
  try {
    const u = new URL(url);
    return u.origin === origin && !u.pathname.match(/\.(pdf|jpg|jpeg|png|svg|webp|ico|xml|txt|zip|css|js)$/i);
  } catch {
    return false;
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, headless: true });
  const page = await browser.newPage();

  const seen = new Set();
  const queue = [startUrl];
  const results = [];

  while (queue.length > 0 && seen.size < MAX_PAGES) {
    const url = queue.shift();
    const normalized = url.replace(/\/$/, "") || origin;
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    let status = null;
    let error = null;
    let links = [];

    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      status = response ? response.status() : null;
      if (status === 200) {
        links = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
      }
    } catch (e) {
      error = e.message.split("\n")[0]; // keep it short — full Playwright errors are verbose
    }

    results.push({ url, status, error });

    for (const link of links) {
      const clean = link.split("#")[0];
      if (isCrawlable(clean) && !seen.has(clean.replace(/\/$/, ""))) {
        queue.push(clean);
      }
    }

    await sleep(REQUEST_DELAY_MS);
  }

  await browser.close();

  const broken = results.filter((r) => r.error || (r.status && r.status >= 400));

  console.log(
    JSON.stringify(
      {
        startUrl,
        pagesCrawled: results.length,
        cappedAtMax: seen.size >= MAX_PAGES,
        brokenCount: broken.length,
        broken,
        all: results,
      },
      null,
      2
    )
  );

  if (broken.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("Crawl failed:", e.message);
  process.exit(1);
});
