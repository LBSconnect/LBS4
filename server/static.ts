import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { injectSeoMeta } from "./seoMeta";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Read once at boot — this is the same static file for every request,
  // just rewritten per-route below rather than truly re-rendered.
  const indexHtml = fs.readFileSync(path.resolve(distPath, "index.html"), "utf-8");

  // fall through to index.html if the file doesn't exist. This is still a
  // pure client-rendered SPA (no real SSR) — injectSeoMeta only rewrites the
  // <head> tags for routes it knows about (see server/seoMeta.ts), so
  // crawlers and link-preview bots that never execute JavaScript see correct
  // per-route title/description/canonical instead of the same generic tags
  // on every page.
  app.use("/{*path}", (req, res) => {
    // req.path is mount-relative here — this middleware is itself mounted
    // on the wildcard pattern "/{*path}", which Express treats as consuming
    // the entire path, leaving req.path as "/" for every request regardless
    // of the real URL. req.originalUrl is never rewritten by mount nesting,
    // so it's the only reliable source for the actual requested path.
    const pathname = req.originalUrl.split("?")[0];
    res.set("Content-Type", "text/html");
    res.send(injectSeoMeta(indexHtml, pathname));
  });
}
