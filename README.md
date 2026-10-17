# GrowinTek

Website, agency CMS, invoicing and analytics for **growintek.com** — built as one
Next.js application rather than a site plus a plugin stack.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Prisma 6 · Prisma Postgres ·
custom CSS design system (no UI framework).

---

## What is in here

**Public site** — home, services (index + four detail pages), case studies, journal,
pricing, reviews, about, contact, project brief, FAQ, privacy/terms/cookies. The
homepage carries a schematic of a lead moving through a business; that schematic is
the design's one deliberate flourish and everything around it stays quiet.

**CMS** (`/admin`)
- Journal posts with a safe Markdown editor, slugs, SEO fields, draft/publish
- Services with outcomes, deliverables and “from” pricing
- Case studies with metrics, sector, service link, featured flag
- Testimonials with an explicit approval gate — nothing shows until approved
- Media library with alt text, 8 MB limit, local disk storage
- Media is served through `/api/media/[id]/file` with immutable caching

**Agency operations**
- Leads from the site, with status pipeline, detail view, one-click convert to client
- Clients with billing details, currency, VAT/ABN
- Projects with status, budget, deadlines, tasks, time entries
- Invoices: gap-free sequential numbering, locked once issued, discounts, tax,
  payments, print/PDF view
- Finance: expenses, time log, margin
- Reports: cash collected by month, billed vs outstanding, win rate, effective hourly,
  CSV export of invoices

**Analytics** (`/admin/analytics`)
First-party, cookie-less. Visitor identity is a SHA-256 of `IP + salt + date`, so it
rotates daily and cannot be reversed. No query strings, no keystrokes, no PII.
Charts are server-rendered SVG — no charting dependency.

**Integrations**
Google Business Profile, Trustpilot, Facebook recommendations, Instagram, YouTube
Shorts and Facebook page posts. Every adapter reads through the platform's own API and
caches into Postgres, so no page render waits on a third party. Unconnected platforms
report themselves as unconnected rather than showing placeholder ratings.

---

## Quick start

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and AUTH_SECRET
npx prisma db push          # create tables
npm run db:seed             # services, journal posts, admin account
npm run admin:create -- you@example.com "Your Name"
npm run dev                 # http://localhost:3000
```

Admin lives at `/admin`. Sign-in is passwordless: a six-digit code is emailed. With no
SMTP configured the code is printed to the server log, so local setup works without a
mail provider.

Useful scripts:

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push schema to the database (no migration history) |
| `npm run db:migrate` | Create a versioned migration |
| `npm run db:seed` | Seed services, posts, demo client |
| `npm run admin:create` | Create or promote an admin account |

---

## Environment

All variables are documented in `.env.example`. The ones that must be set for
production: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`,
`ANALYTICS_SALT`, `CRON_SECRET`. SMTP is optional but you will want it for sign-in
codes and lead alerts. The review and social credentials are optional and covered in
[`docs/CMS.md`](docs/CMS.md).

Deployment steps: [`docs/DEPLOY.md`](docs/DEPLOY.md).
Pricing and the first-client plan: [`docs/PRICING.md`](docs/PRICING.md).

---

## Honest limitations

Stated plainly, because finding them at launch is worse:

1. **Not yet compiled in this environment.** The code was written with the sandbox
   unavailable, so `npm install && npm run build` on your machine is the first real
   type-check. Expect to fix a small number of import or type nits — nothing
   architectural.
2. **Not “more advanced than WordPress” in general.** WordPress has twenty years,
   thousands of contributors, a media library, revisions, roles, multisite and
   WooCommerce. This is better *for this site*: typed content, no plugin bloat, API-first,
   far less attack surface, and agency operations in the same application. It does not
   have revisions or a block builder yet.
3. **Media storage is local disk.** Fine on a VPS or with a mounted volume; on Vercel
   the filesystem is ephemeral. Swap in an S3 driver before relying on uploads in
   production.
4. **Seed content is deliberately incomplete.** Services and journal posts are real.
   Case studies seed as drafts and testimonials as unapproved, so no invented client
   results or fake reviews can go live by accident.
5. **Pages are fixed, content is dynamic.** Journal, services, case studies, reviews and
   feeds come from the database. The homepage and pricing page are code — that is a
   choice to keep the design from drifting, not a missing feature.
6. **No automated tests yet.** The money maths is a pure function and the invoice
   sequence runs in a transaction, but neither has a test suite. Add Vitest before the
   second client.
