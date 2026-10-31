# Verification — 31 October 2026

## Passing checks

- Production browser and server builds compile without CSS warnings.
- All **41 backend tests** pass, including isolated PostgreSQL transaction/SSR checks, authentication, CSRF, content privacy, invoices/funds, safe WebP conversion, consent events, crawl output, AI publication/recovery, Composio signatures and S3 byte roundtrips.
- The completed Chromium workflow covers **36 public routes**, real 404s, loaded images, filtering/search, contact submission, CMS sign-in, draft preview/publication, persistence, client/invoice creation, printable invoices, sections, funds and social filters. No browser JavaScript errors were reported.
- Public layouts have no horizontal overflow at 320, 390, 768, 1024 and desktop widths. Mobile navigation supports Escape and focus return.
- Targeted checks verified hide-on-down/show-on-up header behavior at a 2-pixel upward movement, FAQ toggles, homepage card reveals, reduced-motion preferences, the final CTA location, new portfolio routes and the real AI article/thumbnail.
- The CMS displays the real GA4 property connection and metrics. Analytics Admin/Data requests return successfully; Search Console returns 11 query rows. GA reports currently contain zero traffic for the requested period.
- A real authenticated PNG upload was automatically converted from **369,355 bytes to 37,542 bytes of WebP**, saved to S3 and read back through the site's public image URL. Previously captured portfolio and blog images were migrated to the bucket.
- Prisma migration/import and the existing administrator were verified. A real DashScope `qwen3.5-flash` article passed checks and published with a generated WebP thumbnail. Three researched topics were subsequently queued.

- Team CRUD tests cover authentication, draft privacy, safe links and revision conflicts. The browser verifies all six portraits, Ijtiba’s supplied LinkedIn URL/logo, and saved social edits.
- Comment tests cover confirmation, forced Pending status, link/markup/encoded-address rejection, private emails, duplicate suppression, honeypots, rate limits, cross-origin requests, authenticated moderation and CSRF. The browser verifies all five explicit social popups and the Pending → Approved → public display workflow.
- Browser checks verify editable service steps/FAQs, 128 px desktop / 112 px mobile hero logos, and white/gold navigation after the hero with hide-on-down/show-on-up behavior.
- Social tests cover owner filtering, later events from the same trigger, partial-failure retries and completed-webhook deduplication. The browser verifies the visible feed refreshes after sixty seconds.
- Search metadata tests cover absolute uploaded images, full detail-page breadcrumbs and AboutPage/Person data. All existing blog covers were replaced with optimized editorial WebP artwork.

- The supplied social artwork is implemented as WebP with mapped Facebook/Instagram/YouTube links. Targeted Chromium checks verify separate posts/videos, independent filters, carousel arrows, all artwork links at six widths, consent-gated video playback, Escape/focus return and automatic sixty-second updates. The live preview rendered 20 posts and 11 videos/reels with no broken social images.

Local evidence lives under `evidence/upgrade` and private verification files under `data/`; neither directory is committed.

## Remaining external setup

- Three Composio accounts are ACTIVE. A later YouTube read returned quotaExceeded; its seven saved videos remain visible while the provider quota recovers. The local SDK subscription succeeds, and an enabled YouTube activity trigger is registered. Hosted webhook delivery still needs deployment and its signing secret; no real new YouTube event has been observed end-to-end.
- Google Business Profile needs owner OAuth and approved project access/quota. YouTube Data API must be enabled for the direct YouTube key.
- Pak Exporters was captured at the corrected `https://www.pak-exporters.com/` URL. Its portfolio entry links there; Growintek’s own entry is unpublished.
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
# Reset the disposable fixture before the independent community workflow.
python3 tests/community-browser.py
# Targeted social-layout checks against the local preview:
python3 tests/social-world-browser.py
```

The setup creates random test-only credentials in `/tmp/grow-browser-tests/credentials.json`. Reset the fixture before repeating tests that create records. The tracking check intercepts Google's script request and tests consent/origin gating without sending traffic to Google.
