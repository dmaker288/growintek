# Verification — 31 October 2026

## Passing checks

- Production browser and server builds compile without CSS warnings.
- All **32 backend tests** pass, including isolated PostgreSQL transaction/SSR checks, authentication, CSRF, content privacy, invoices/funds, safe WebP conversion, consent events, crawl output, AI publication/recovery, Composio signatures and S3 byte roundtrips.
- The completed Chromium workflow covers **26 public routes**, real 404s, loaded images, filtering/search, contact submission, CMS sign-in, draft preview/publication, persistence, client/invoice creation, printable invoices, sections, funds and social filters. No browser JavaScript errors were reported.
- Public layouts have no horizontal overflow at 320, 390, 768, 1024 and desktop widths. Mobile navigation supports Escape and focus return.
- Targeted checks verified hide-on-down/show-on-up header behavior at a 2-pixel upward movement, FAQ toggles, homepage card reveals, reduced-motion preferences, the final CTA location, new portfolio routes and the real AI article/thumbnail.
- The CMS displays the real GA4 property connection and metrics. Analytics Admin/Data requests return successfully; Search Console returns 11 query rows. GA reports currently contain zero traffic for the requested period.
- A real authenticated PNG upload was automatically converted from **369,355 bytes to 37,542 bytes of WebP**, saved to S3 and read back through the site's public image URL. Previously captured portfolio and blog images were migrated to the bucket.
- Prisma migration/import and the existing administrator were verified. A real DashScope `qwen3.5-flash` article passed checks and published with a generated WebP thumbnail. Three researched topics were subsequently queued.

Local evidence lives under `evidence/upgrade` and private verification files under `data/`; neither directory is committed.

## Remaining external setup

- The supplied Composio key returns HTTP 401, code 801, `APIKey_InvalidAPIKey`. Connected-account IDs and the webhook signing secret are not set. The site shows its saved public social snapshot.
- Google Business Profile needs owner OAuth and approved project access/quota. YouTube Data API must be enabled for the direct YouTube key.
- Pak Exporters did not resolve during capture and retains a labeled concept image. Other new portfolio images are real live-site captures.
- GitHub publication does not activate Vercel hosting. Vercel environment values, domain routing and hosted cron/webhook delivery must be verified after deployment.
- Automated editorial checks do not establish human review, firsthand experience or guaranteed Google rankings. Keep the researched topic queue supplied.

## Reproduce

```sh
npm ci
npm run build
npm test
```

To include database integration checks, provide `TEST_POSTGRES_URL` for an isolated, disposable PostgreSQL database. Never use the real CMS database for tests. Apply the committed schema migrations to that test database first.

For the browser workflow, install Python Playwright and use Google Chrome at the executable path referenced by the scripts. Start the safe fixture server:

```sh
npm run test:browser:setup
node scripts/browser-test-server.js
```

In another terminal:

```sh
python3 tests/browser.py
python3 tests/tracking.py
```

The setup creates random test-only credentials in `/tmp/grow-browser-tests/credentials.json`. Reset the fixture before repeating tests that create records. The tracking check intercepts Google's script request and tests consent/origin gating without sending traffic to Google.
