# Growintek Platform Implementation Plan

> **For agentic workers:** Execute the plan inline and verify each subsystem before delivery.

**Goal:** Upgrade the reference frontend into a crawlable agency website and persistent, authenticated business CMS.

**Architecture:** Keep React, TypeScript, Vite, local fonts and the existing artwork. Add Express server rendering and a SQLite database on a persistent volume. Keep provider keys exclusively in server environment variables. Public and admin requests use the same origin.

**Tech Stack:** React 19, Vite, Express 5, SQLite, Zod, Node crypto, native fetch, Python Playwright.

## Global Constraints

- Preserve blue, gold, green, cream gradients and glass design.
- No invented results, fake client endorsements, fabricated expertise or black-hat SEO.
- Unconfigured providers must report that configuration is required.
- Default generated articles to editorial approval; provider credentials never enter browser bundles.
- Verify phone, tablet and desktop layouts and critical business workflows.

## Design specification

Use existing artwork as reference: midnight #001c29, ink #052c3b, teal #003e43, mint #4ce0bb, gold #f3d581, cream #faf7ed. Retain Outfit display and DM Sans body fonts. Preserve the globe hero and its asymmetrical composition. Enlarge featured work into two-column browser frames; keep process and FAQ layouts open with fine dividers. Use 80px desktop section spacing, 44px phone spacing, 16px readable body text. Admin uses a dark teal navigation rail with cream content and understated glass panels.

## Task 1: Persistence, authentication, CMS API

Files: server/db.js, server/security.js, server/validation.js, server/app.js, shared/seed.json, scripts/admin.js.

- [x] Create transactional SQLite documents, settings, sessions, jobs and event tables with revision checks.
- [x] Implement password hashing, expiring HTTP-only sessions, CSRF checks, login throttling and security headers.
- [x] Implement validated CRUD for posts, pages, services, portfolio, leads, clients, invoices and keyword plans.
- [x] Validate authentication boundaries, invalid input, stale updates, publication state and lead persistence with Node tests.

## Task 2: Crawlable public website

Files: src/App.tsx, src/types.ts, src/pages/PublicPages.tsx, src/components/SiteChrome.tsx, src/components/Sections.tsx, src/entry-server.tsx, src/main.tsx, src/platform.css.

- [x] Render complete HTML and unique metadata for all requested public pages, content details and legal pages.
- [x] Add industry, process, FAQ, social feeds, larger portfolio frames and persistent contact form.
- [x] Add accessible navigation, cookie preferences, consent-gated analytics and external social media images.
- [x] Verify browser navigation, contact form, filters, consent, direct links, error and empty states.

## Task 3: Admin and business operations

Files: src/admin/Admin.tsx, src/admin/admin.css, src/admin/fields.ts.

- [x] Build protected dashboard, searchable content lists, editors, publication scheduling and deletion confirmation.
- [x] Build lead pipeline, clients, itemized invoices with calculated totals and printable output.
- [x] Add measured analytics, integrations status, keyword observations, SEO audit and AI editorial queue.
- [x] Verify admin login, content create/update/delete, draft privacy and invoice arithmetic.

## Task 4: SEO, integrations and automation

Files: server/seo.js, server/integrations.js, server/jobs.js, server/render.js, scripts/worker.js, .env.example.

- [x] Add metadata, canonical links, JSON-LD, sitemap, robots.txt, llms.txt, llm.txt and RSS.
- [x] Add Search Console reporting and sitemap submission, GA4 reporting, IndexNow and server-side social feeds.
- [x] Add DashScope keyword ideation and cited article drafts, structured validation, source requirements, duplicate checks, daily durable job leases and scheduled publication.
- [x] Add technical SEO audit with honest pass/fail findings and integration errors.

## Task 5: Verification and deployment documentation

Files: tests/api.test.js, tests/browser.py, README.md, Dockerfile, compose.yaml, docs/operations.md.

- [x] Run production build, API/security tests and responsive browser workflows.
- [x] Inspect screenshots, repair layout failures and verify all intended routes.
- [x] Document secrets, admin creation, scheduler, persistent storage, backups and live-provider prerequisites.

## Verification outcome

- Production browser and server builds pass.
- 23 API/security/integration/worker tests pass. Provider traffic is mocked for adapter verification.
- All 26 public routes and primary admin workflows pass browser tests; phone/tablet widths 320, 390, 768 and 1024 have no horizontal overflow.
- Docker build passes; non-root runtime, canonical metadata, schema, security headers, crawl files and 404 responses verified.
- Production credentials, verified social account IDs, legal operator details and domain were not supplied. Live-provider acceptance and public deployment remain external prerequisites.
- Portfolio improvements are labeled vector concept presentations, with image upload support for approved real work.
