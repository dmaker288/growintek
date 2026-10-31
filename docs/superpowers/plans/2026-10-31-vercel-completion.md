# Growintek Vercel Completion Plan

**Goal:** Finish the requested website and CMS with a deployment path to Vercel, Supabase Postgres/Storage and Prisma, retaining local preview capability.

**Architecture:** Keep the existing React SSR frontend and same-origin API. Use Prisma for cloud persistence and Supabase Storage for uploaded images; keep SQLite only as a local development option. Add authenticated Vercel cron processing with persistent job claims. Reuse validation, SEO generation and provider contracts across runtime adapters.

**Constraints:** Preserve the supplied teal/cream/mint/gold look and rectangular logo. Never expose secrets. Only verified public social content is shown. USD and PKR stay separate in totals. User selected automatic publication after quality checks. Credentials and domain remain required for live provider acceptance.

- [x] Repair incomplete reference restoration and validate the current build.
- [x] Add Prisma schema/migrations with RLS-denied public access, cloud CMS API, media storage and authenticated cron.
- [x] Add funds ledger, paid/outstanding invoice summaries and editing of FAQ/industries/process/why content.
- [x] Add Composio read adapters and attractive separate social posts, reels and videos views.
- [x] Refine service index/detail and blog index/article pages with related links, contents navigation and sharing.
- [x] Confirm SEO crawl files, canonical/structured data, GA4/Search Console adapters and automatic publication gating.
- [x] Test local/cloud adapters, security boundaries, invoice arithmetic, content publication, mobile layouts and production SSR.
- [x] Prepare private environment template and Vercel/Supabase setup guide, open working preview.

Live deployment/provider activation remains dependent on the final domain and private credentials; no cloud deployment is claimed.

## Verification

- Production browser and SSR build passed.
- 29 backend checks passed, including real isolated PostgreSQL transactions, concurrent publication, production rendering/authentication, funds and consent boundaries.
- Browser suite passed 26 public routes plus contact, CMS editing/publishing, homepage section edits, PKR funds, invoice preview, social filtering, article contents and mobile layouts; no JavaScript errors.
- Vercel config validates against its published schema.
- SQLite-to-Postgres import tested for record preservation, session exclusion, sequence advancement and refusal of nonempty targets.
