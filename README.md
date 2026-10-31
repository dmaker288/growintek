# Growintek

A server-rendered agency website and authenticated business CMS built with React 19, TypeScript, Vite, Express, Prisma Postgres and S3-compatible image storage (SQLite for isolated local previews). The blue, gold, green and cream visual identity is preserved throughout the public site and admin workspace.

## Start locally

Requires Node 22.22.3 or newer within Node 22 (see `.nvmrc`).

```sh
npm ci
cp -n .env.example .env
npm run dev
```

Open the local address shown on startup (this workspace uses http://localhost:4173). Public content is seeded on first start. There is **no default admin password**.

```sh
npm run admin:create -- your-email@example.com
```

Enter a unique password of at least 14 characters at the hidden prompt, then sign in at `/admin`. Running the command for an existing administrator resets its password and revokes its sessions. For noninteractive setup, supply `ADMIN_PASSWORD` through your process environment or secret manager; do not put a password in command history.

## Build and verify

```sh
npm run build
npm test
```

A built local preview without production cookies is available with:

```sh
SERVE_BUILD=true npm run dev
```

Production requires an HTTPS `SITE_URL` and an HTTPS reverse proxy:

```sh
npm run build
npm start
```

Deploy to Vercel with Prisma Postgres and S3 by following [the launch guide](docs/vercel-prisma.md). The included Docker setup is an alternative for a persistent host.

## Included

- Home, About, Services, 14 service detail pages, dedicated SEO page, Portfolio and project pages, Blog and article pages, Contact, Privacy, Terms, Cookie Policy, Accessibility and Editorial Policy.
- Responsive layout, keyboard navigation, cookie preferences, FAQ, industries, delivery process, social channel feeds, clear CTAs and optimized local artwork.
- Persistent blogs, pages, services, portfolio, team profiles and social links, editable FAQ/industries/process/why sections, leads, clients, USD/PKR funds, invoices and keyword research.
- Moderated blog comments with explicit social-profile links, self-confirmed follows, link blocking and private commenter emails. CMS approval is required before comments appear.
- Draft, review, scheduled and published content states; Markdown previews; optimized image uploads; optimistic edit conflict detection.
- Validated lead capture, lead stages, client records, itemized invoice calculations, and a printable invoice/PDF view. Invoice status is bookkeeping; it does not send mail or process payments.
- Password hashing, HTTP-only expiring sessions, CSRF checks, origin checks, rate limits, security headers, validated input and an administrative audit trail.
- Server-rendered page HTML, per-page SEO metadata, canonical URLs, Organization/Service/BlogPosting/AboutPage/Breadcrumb schema, dynamic sitemap, robots.txt, RSS, llms.txt and llm.txt.
- Consent-based first-party events and optional GA4 tracking. Analytics views show real recorded data, never sample traffic.
- Server-side Search Console query/position reports, sitemap submission, GA4 reports, IndexNow, Composio Facebook, Instagram and YouTube adapters with separate posts/reels/videos views.
- DashScope topic ideas and researched article generation, automatic publishing after checks with disclosure, optional editorial approval, source allowlists, local duplicate detection, daily scheduling, durable job leases and retry history.

## Live integrations and launch requirements

The runtime connectors need **your credentials and account permissions**. The current workspace has three verified Composio accounts, an active local YouTube trigger listener and hourly public-feed refreshes. Hosted delivery starts after Vercel deployment. Set the variables in `.env.example` on the server and use Admin → Integrations to inspect configuration. A configured badge means settings are present; a successful report or refresh verifies the connection.

Before launch, confirm the production domain, legal entity/country/contact details, social URLs, provider credentials, editorial ownership and actual portfolio evidence. Policy text is an editable starting point and must reflect your real processing and contracts. The portfolio includes verified live-site screenshots; Pak Exporters uses the corrected live URL; Growintek’s own portfolio entry is unpublished. Screenshots do not establish measured client outcomes.

Daily AI generation starts only when enabled in Site settings, DashScope is configured, and the keyword queue has a ready topic with two verified source notes. Publishing volume does not substitute for useful information. No software can guarantee worldwide originality, E-E-A-T, indexing or rankings.

This workspace has an administrator whose credentials are saved privately in `data/local-admin.txt` and whose account was imported into Prisma. No credentials are committed.

## Important operating boundaries

- Vercel uses Prisma Postgres and S3-compatible storage. SQLite remains a local/persistent-host option and is rejected on Vercel. Back up cloud data and media independently.
- Vercel cron runs daily at 04:00 UTC; the local worker runs every 30 seconds while the web process is alive. `npm run worker` runs one additional tick for cron or a supervised worker on the same host. Leases prevent ordinary concurrent claims; external provider calls may repeat after a crash, while content/topic checks prevent repeat publication of a used topic.
- The SEO audit checks content/configuration. It is not a field-performance, backlink or exhaustive accessibility audit.
- Keyword suggestions are AI hypotheses. Search Console supplies measured query averages; manually entered observations are labeled separately. No fabricated search volumes or live SERP positions.
- Google Indexing API is intentionally not used for ordinary agency/blog URLs. Sitemap submission helps discovery; IndexNow applies only to participating engines. Neither guarantees indexing.
- Without `SITE_URL`, the local site emits noindex and disallows crawling. Set the exact production HTTPS origin before launch.

## Project map

- `src/pages`, `src/components`: public website and consent controls.
- `src/admin`: authenticated CMS, research studio and business workflows.
- `server`: API, rendering, database, security, jobs and integrations.
- `shared/seed.json`: initial editable content; existing records are not overwritten on restart.
- `public/images`: original artwork and sharp vector portfolio concept presentations.
- `tests`: API/security/job tests and end-to-end browser workflow checks.
- `evidence/upgrade`: local screenshots and validation results (not committed).
