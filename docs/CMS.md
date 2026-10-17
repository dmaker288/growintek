# The CMS

A short guide to running the site from `/admin`, plus the model behind it.

---

## Signing in

1. Go to `/admin`. Enter the email listed in `ADMIN_EMAILS`.
2. Check your inbox for a six-digit code. It expires in 10 minutes.
3. No password exists, so there is nothing to leak or rotate. Five wrong attempts
   invalidates the code; wait a minute to request another.

If email is not configured yet, the code is printed in the server log in development.

---

## What each screen does

| Screen | Manages | Goes live where |
| --- | --- | --- |
| Dashboard | KPIs, newest leads, unpaid invoices, tasks, content health | — |
| Analytics | Traffic, devices, referrers, top pages, CTA clicks | — |
| Reports | Cash by month, billed vs outstanding, win rate, CSV export | — |
| Journal | Posts, slugs, SEO, draft/publish | `/journal`, `/journal/[slug]` |
| Services | Name, tagline, outcomes, deliverables, from-price | `/services`, `/services/[slug]` |
| Case studies | Client story, metrics, sector, featured | `/work`, `/work/[slug]` |
| Testimonials | Quotes with an approval gate | `/reviews`, homepage |
| Media | Uploads, alt text, copy URL | wherever an image is used |
| Leads | Pipeline, detail, convert to client | — |
| Clients | Billing details, projects, invoices | — |
| Projects | Status, budget, deadlines, tasks, time | — |
| Invoices | Draft → issued → paid, payments, print | client-facing PDF |
| Finance | Expenses, time log, margin | — |
| Integrations | Review and social API health, sync | `/reviews`, feeds |
| Settings | Capacity, currency, invoice defaults | — |

---

## The content model

Everything the public site reads lives in Postgres:

- **Page** — optional structured sections for future free-form pages (`sections` JSON).
- **Service** — one row per service page; `outcomes` and `deliverables` are string arrays.
- **Project** — case studies. `metrics` is `[{ label, value }]`; drafts are invisible.
- **Post** — Markdown body, tags, reading time computed on save.
- **Testimonial** — has `approved`; unapproved rows never render.
- **Review** — written only by the sync job, never by hand. `@@unique([platform, externalId])`
  makes repeated syncs safe.
- **SocialPost** — same idea for Instagram, YouTube and Facebook posts.
- **Lead / Client / ClientProject / Task / Invoice / Payment / Expense / TimeEntry** —
  agency operations. Money is stored in integer minor units with an explicit currency.

---

## Writing a post

1. Journal → **New post**.
2. Fill the title, a one-sentence summary, and the body.
3. Markdown supported: `##` headings, `**bold**`, `*italic*`, `` `code` ``, `- lists`,
   `> quotes`, `[links](https://example.com)`. Raw HTML is escaped — pasting a script
   tag renders it as text.
4. Set an SEO title (≤70 chars) and meta description (≤170) if you want control over
   search snippets; otherwise the summary is used.
5. Save, then **Publish** from the list. Unpublishing removes it from the sitemap on the
   next revalidation (within an hour).

---

## Publishing a case study (read first)

The seeded case studies are placeholders and have **example metrics**. Before publishing:

1. Get the client's written permission to publish numbers.
2. Replace every metric with something you measured and can defend.
3. Remove the word “Draft” from the summary.
4. Publish from the case studies list.

Publishing a placeholder is worse than having no case studies — a prospective client
will notice invented numbers, and it undermines everything else on the site.

---

## Reviews and social feeds

Nothing is typed into the CMS. Each platform is read through its API and cached in the
database, so page loads never wait on a third party.

### Google Business Profile

1. Google Cloud Console → new project → enable **Business Profile API** (request access
   if it is not listed for your project; Google grants this per project).
2. OAuth consent screen → add scopes `https://www.googleapis.com/auth/business.manage`.
3. Create OAuth client credentials (web app).
4. Mint a refresh token once — either with the OAuth Playground using your own client, or
   with a short local script — and store it as `GOOGLE_REFRESH_TOKEN`.
5. Find the numeric account and location IDs:
   `GET https://mybusiness.googleapis.com/v4/accounts` returns them.
6. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
   `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID`.

The adapter in `lib/integrations/reviews.ts` reads `.../locations/{id}/reviews` and maps
Google's one-to-five star enum onto numbers.

### Trustpilot

1. Review API access comes with a paid Trustpilot Business plan.
2. Business account → **Integrations → API** → copy the key.
3. Find the business unit ID in the profile URL or via
   `GET /v1/business-units/find?name=growintek.com` with the key as `apikey` header.
4. Set `TRUSTPILOT_API_KEY` and `TRUSTPILOT_BUSINESS_UNIT_ID`.

### Facebook and Instagram

1. Meta for Developers → app → add **Facebook Login** and **Instagram Graph API**.
2. Get a **long-lived page access token** with `pages_read_engagement`,
   `pages_show_list`, `instagram_basic`.
3. The Instagram account must be a Business or Creator account linked to the Facebook
   page; get its ID from `/me/accounts` → page → `instagram_business_account`.
4. Set `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`.

Note: Facebook retired the standalone Reviews tab in 2018. Pages now collect
**Recommendations**, exposed through the page's `ratings` edge — that is what the
adapter reads, and a page with recommendations turned off will return nothing.

### YouTube

1. Google Cloud Console → enable **YouTube Data API v3** → create an API key.
2. Find your channel ID (channel → Advanced settings, or the `?si=` URL expander).
3. Set `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`.

Shorts have no dedicated endpoint. The adapter reads the channel's uploads playlist,
then filters videos whose ISO-8601 duration is ≤ 61 seconds and links them as
`youtube.com/shorts/{id}`.

### Running the sync

- Manually: `/admin/integrations` → **Sync reviews and feeds**.
- Automatically: `vercel.json` schedules `/api/cron/sync` daily at 06:00 UTC. Protect it
  with `CRON_SECRET` (already wired) and pass `Authorization: Bearer …` from any other
  scheduler.

Each platform fails independently: a broken Trustpilot key does not stop Instagram.

---

## Adding a field

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate` (or `db:push` in development).
3. Add the input to the relevant form in `components/admin/`.
4. Add it to the server action's parse block in `lib/actions/content.ts`.
5. Render it in the public page.

The typed schema is the reason this is five steps instead of a plugin install.

---

## Backups

Prisma Postgres keeps automated backups on paid plans; on the free tier, export before
any migration:

```bash
npx prisma db execute --url "$DIRECT_URL" --file backup.sql
```

Or from the Prisma console: project → Backups. Test a restore once — an untested backup
is a hope, not a plan.

---

## Security notes

- Admin markup is noindexed, but that is not access control. Consider a WAF rule or
  deployment protection in front of `/admin*`.
- Sessions are stored as SHA-256 hashes; the raw cookie value never touches the database.
- Server actions check the `Origin` header against the request host.
- Lead submissions are rate-limited per hashed IP (5 per 10 minutes) and use a honeypot.
- Uploads are limited to 8 MB and to specific MIME types; filenames on disk are random
  ids, never user input.
- Never commit `.env`. If a secret leaks, rotate it — deleting the file from a commit
  does not remove it from history.
