#!/usr/bin/env node
// Classifies the risk level of the weekly workflow's own uncommitted changes
// by inspecting which files were touched, so the workflow can decide
// whether it's safe to auto-merge. This is the actual enforcement point for
// "auto-merge only low-risk fixes" — the LLM repair step is instructed to
// stay in-scope, but this script is the real gate, checked mechanically
// against the diff it actually produced (never trust the agent's own
// self-report of what it changed).
//
// Usage: node script/classify-change-risk.mjs --out risk.json

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const outPath = arg("out", "risk.json");

// Anything staged/modified/untracked relative to the last commit.
const changed = execSync("git status --porcelain", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3).trim());

// Paths that can NEVER be part of an auto-merged low-risk change, regardless
// of what the repair step believes about its own edit.
const HIGH_RISK_PATTERNS = [
  /^server\/i9Security\.ts$/,
  /^server\/i9Auth\.ts$/,
  /^server\/webhookHandlers\.ts$/,
  /^server\/stripeClient\.ts$/,
  /^shared\/(i9)?[Ss]chema\.ts$/,
  /^migrations\//,
  /\.env/,
  /^drizzle\.config\.ts$/,
  /legal|privacy|terms|policy|pricing/i,
];

const MEDIUM_RISK_PATTERNS = [
  /^server\//, // any other backend change: needs a human look even if not on the high-risk list
  /^shared\//,
  /package\.json$/, // dependency version changes get a human look, even "safe" ones
  /^\.github\/workflows\//,
];

// Everything else (client pages/components, tests, docs, images, reports)
// is eligible for "low" — but only if the change set is non-empty and none
// of the above matched.

let level = "none";
if (changed.length === 0) {
  level = "none";
} else if (changed.some((f) => HIGH_RISK_PATTERNS.some((re) => re.test(f)))) {
  level = "high";
} else if (changed.some((f) => MEDIUM_RISK_PATTERNS.some((re) => re.test(f)))) {
  level = "medium";
} else {
  level = "low";
}

const result = { level, changedFiles: changed, checkedAt: new Date().toISOString() };
writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
