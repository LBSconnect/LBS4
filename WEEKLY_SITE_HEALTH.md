# Weekly Site Health Audit & Repair

An automated workflow that audits the live site every **Friday at 12:00 AM America/Chicago**, runs the full test/build/security/accessibility gate, safely auto-repairs low-risk defects, and opens (and, when safe, merges) a pull request with a dated report.

## What runs, and when

- **Schedule:** Friday 00:00 America/Chicago, every week, correctly across the CDT/CST daylight-saving change (see "Timezone handling" below).
- **File:** [`.github/workflows/weekly-site-health.yml`](.github/workflows/weekly-site-health.yml)
- **Manual trigger:** the workflow also has a `workflow_dispatch` trigger — run it on demand from the Actions tab to test it without waiting for Friday.

## Timezone handling (read this if you ever touch the schedule)

GitHub Actions' `schedule.cron` only understands UTC and has no timezone concept. A single fixed UTC cron expression would run at the wrong local Chicago time for roughly half the year as Daylight Saving Time shifts the UTC offset by an hour.

This workflow avoids that by firing at **both** UTC times that could correspond to midnight in Chicago (`0 5 * * 5` for CDT, `0 6 * * 5` for CST) every Friday, and a `guard` job checks the *actual* `America/Chicago` wall-clock time at the moment each firing occurs. Only the firing that's actually correct "right now" proceeds past the guard; the other one exits immediately as a no-op. This is one workflow with two trigger times, not two competing schedulers — exactly one real run happens per week, at the correct local hour, with no manual cron updates ever needed around the DST changeover.

## What the workflow does, step by step

1. Checks out `main` at a clean, fresh dependency install (`npm ci`).
2. Records the current commit as a baseline (for a manual `git revert` if ever needed).
3. Runs, in order: type check → lint (if configured) → format check (if configured) → unit tests → production build → `npm audit` (dependency/security) → full Playwright suite (functional + accessibility) against a local test database (a throwaway Postgres service container, not any real data) → a read-only, low-volume crawl of the live production site for broken links/redirects.
4. If an `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`) secret is configured, invokes Claude Code with a tightly-scoped prompt to fix only unambiguously low-risk defects found above (broken links, missing alt text, metadata gaps, minor accessibility issues, safe dependency bumps) — explicitly forbidden from touching auth, payments, schema, pricing, legal copy, or environment configuration. **If that secret isn't configured, this step is skipped and every finding goes into the report as "requires manual review" instead** — nothing is silently dropped.
5. Re-runs the full regression gate if any auto-repair happened.
6. Generates a dated Markdown report at `reports/site-health/YYYY-MM-DD/report.md`.
7. **Mechanically** classifies the actual changed files (never trusting the repair step's own self-report) into `none` / `low` / `medium` / `high` risk — see `script/classify-change-risk.mjs`. Anything touching `server/i9Security.ts`, `server/i9Auth.ts`, `server/webhookHandlers.ts`, `server/stripeClient.ts`, any schema/migration file, `.env*`, or copy that looks legal/pricing/policy-related is automatically `high` risk, full stop, regardless of what the repair step believed it was doing.
8. Opens a PR with the report as its body.
9. **Auto-merges only if:** risk is classified `low`, AND type-check/unit-tests/build all passed. Everything else — `medium`, `high`, or any failed gate — stays open as a PR requiring your manual review. A failed build or test run never merges, period.
10. If risk was `low` and the PR merged, runs a fast production smoke test (`script/production-smoke-test.mjs`) against the live site and prints the result to the workflow log.
11. Opens a GitHub issue (labeled `weekly-site-health, needs-review`) whenever the run fails outright, or found `medium`/`high` risk changes — this is the "notify the owner" mechanism (see below).
12. Uploads all reports, the Playwright HTML report, and test artifacts as a workflow artifact (90-day retention) regardless of outcome.

## Reports

Every run produces `reports/site-health/YYYY-MM-DD/report.md`, containing: production URL tested, baseline and tested commit, crawl results (pages crawled, broken links/redirects), dependency audit summary, and the list of files changed that run. No secrets or personal/customer data are ever written into a report.

## Rollback

If a bad low-risk auto-merge somehow gets through (a gate can only be as good as what it checks for), rolling back is a plain `git revert` of the merge commit on `main`, pushed the same way any other commit here is — no special tooling required. The workflow records the pre-run baseline commit in its own log for exactly this purpose. There is no database migration risk from this workflow: it never runs `db:push` or any schema migration against production, and it's explicitly barred from ever touching schema/migration files.

## Notifications

Uses GitHub's own, already-available mechanism — no paid service was added without your approval, per the original instructions. Two channels, both free and already active the moment this workflow exists:

- **GitHub Issues:** an issue is opened automatically (see step 11 above) for anything needing your attention — a P0/P1-equivalent finding, a workflow failure, or a medium/high-risk PR waiting on review.
- **Pull requests:** every non-trivial run opens a PR (auto-merged only when genuinely low-risk); GitHub's own notification settings for this repo control who gets emailed/pinged about that PR.

**If you want push, email, or Slack notifications on top of this**, that requires configuring a webhook/integration this repo doesn't currently have (Slack incoming webhook URL, a transactional email service, etc.) — set that up and it's a small addition to the "Notify" step above, but it wasn't added automatically since it would mean picking a specific paid or third-party service on your behalf, which the task's own rules said not to do without approval.

## Secrets you need to add manually

Go to the repo's **Settings → Secrets and variables → Actions** and add:

| Secret | Required for | If missing |
|---|---|---|
| `STRIPE_TEST_SECRET_KEY` | Running the payment/booking e2e suite in CI | Those specific tests fail gracefully (already handle a missing key today) rather than crashing the whole run — but coverage is reduced |
| `CI_PROTECTED_DATA_ENCRYPTION_KEY` | Running the I-9 portal's protected-data e2e tests in CI | Those specific tests are skipped; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — this must be a CI-only key, never the real production encryption key |
| `ANTHROPIC_API_KEY` **or** `CLAUDE_CODE_OAUTH_TOKEN` | The autonomous low-risk auto-repair step | Repair step is skipped entirely; the workflow still audits, tests, crawls, and reports — it just won't write fixes itself, and every finding lands in the report as "requires manual review" |

`GITHUB_TOKEN` is provided automatically by GitHub Actions and needs no setup — it's what the workflow uses to open/merge PRs and create issues.

**Nothing else is required for the workflow to run** — the Postgres test database is a throwaway service container created fresh by the workflow itself every run, not a persistent database you need to provision.

## What this workflow will never do

- Never runs a schema migration or any write against a real/production database.
- Never sends a real email, SMS, or payment — the e2e suite runs against Stripe *test* mode and a throwaway local database only.
- Never touches legal, pricing, or policy copy, authentication/session logic, payment/webhook logic, or environment configuration — those paths are hard-classified `high` risk regardless of what any automated change believes about itself.
- Never auto-merges a failed build, failed type-check, or failed unit test, under any risk classification.
- Never deploys anything itself beyond merging to `main` — if merging to `main` doesn't trigger your hosting platform's deploy for you, this workflow doesn't either; confirm your platform's deploy trigger separately.
