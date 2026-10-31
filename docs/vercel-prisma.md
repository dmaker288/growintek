# Vercel, Prisma Postgres and S3 launch

The application uses React server rendering in a Vercel Node function. Prisma Console hosts PostgreSQL content and CMS accounts; the S3-compatible bucket stores public website images privately. The server reads and uploads images using credentials that never reach the browser.

## Environment and database

This workspace has private, owner-readable `.env` and `.env.vercel` files. Import the values from `.env.vercel` into **Vercel Project Settings → Environment Variables**, not Prisma Console. Use separate credentials and a separate database for preview deployments. `.env.example` is the only environment file committed to GitHub.

Required values:

- `SITE_URL`: your exact HTTPS origin, without a trailing slash. The prepared environment uses `https://growintek.com`.
- `DATABASE_URL`: Prisma Console's pooled PostgreSQL URL. `DIRECT_URL` is optional for a separate migration connection.
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`: S3-compatible image storage. The configured endpoint is `https://t3.storage.dev`; region is `auto`.
- `CRON_SECRET`: a random secret of at least 32 characters, sent by Vercel Cron as a bearer token.
- `TRUST_PROXY_HOPS=1`: for the single trusted Vercel proxy hop. Local development uses zero.

Requires Node 22+. Run `npm ci`, then `npm run db:migrate` before starting a new deployment. The current Prisma database has already been migrated and the local CMS imported, including the existing administrator. **Do not repeat the import into this nonempty database.**

For an entirely new database, `npm run db:import -- /absolute/path/source.sqlite` imports local CMS content and admins, excluding sessions. It refuses a nonempty target. `npm run admin:create -- owner@example.com` creates or resets an administrator through a hidden password prompt. The workspace's existing sign-in is saved privately in `data/local-admin.txt`; it is not bundled in the application.

## Automatic WebP image storage

Every CMS image upload is decoded, correctly oriented, resized within 2000 × 2000 without enlargement and encoded as WebP. Inputs may be PNG, JPEG or WebP, up to 8 MB; SVG uploads are rejected. Original PNG/JPEG files are not uploaded to the bucket. AI articles automatically receive a branded WebP thumbnail.

Images use the private `growintek/` bucket prefix and stable public website URLs such as `/images/media-UUID.webp`. Responses include `image/webp` and a one-year immutable cache header. The bucket does not need anonymous read permissions. Upload only images intended to appear publicly on your website. The server keeps the bucket credentials private and verifies CMS authentication and CSRF protection before upload.

Storage priority is S3, optional Supabase Storage, bounded Prisma image storage, then local files. Existing Prisma images remain readable after switching to S3. Back up database content and bucket objects independently.

## DashScope and daily publishing

The tested configuration uses `DASHSCOPE_MODEL=qwen3.5-flash` with the international endpoint `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`. Keys must match that region/workspace and have available quota.

Daily generation is enabled in the current CMS for **09:00 Asia/Karachi**, with automatic publication after content checks. A complete article and its S3 WebP thumbnail have been generated successfully. Three additional researched topics were prepared. Keep supplying Ready topics under **Keyword research**, each with at least two distinct verified sources and factual notes; the worker reports an empty queue instead of generating filler.

Generated articles must pass structured-output, approved-citation and local similarity checks. They disclose AI assistance and automated review. These checks do not certify factual accuracy, firsthand experience, global originality or rankings. Review the published work and correct it as needed.

`vercel.json` calls `/api/cron` daily at **04:00 UTC / 09:00 Asia/Karachi**. This schedule starts only after Vercel deployment. The plan must support the configured 300-second function duration; daily cron timing can vary by hosting plan. The local preview runs a worker every 30 seconds while its process is running. A cron invocation processes up to eight available jobs within its time allowance. Leases, retries and topic consumption prevent ordinary duplicate publications; provider calls can repeat after a crash. Failures are visible in **AI publishing**.

## Google Analytics and Search Console

Enable Analytics Admin API, Analytics Data API and Search Console API. Grant the service account access to the GA4 property and the verified Search Console property. Configure `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GA4_PROPERTY_ID` and `GSC_PROPERTY` on the server. Set the public `G-…` measurement ID under **Site settings**.

The current workspace verified GA4 property `394716167`, measurement ID `G-WDKS0F788Z`, and Search Console property `https://growintek.com/`. CMS Analytics shows totals, daily metrics, acquisition channels, realtime activity and web-stream details. Search Console shows measured queries, impressions, clicks, CTR and average position. Zero traffic is displayed as zero; connection failures are identified separately.

GA tracking starts only after analytics consent on the configured canonical origin. Localhost and admin pages do not send GA pageviews. Consented lead submissions send `generate_lead`; form starts send `form_start`. First-party event counts are not unique-user estimates. Inspect the deployed site's realtime report and consent behavior before launch.

Sitemap submissions help Google discover published URLs. Neither sitemaps nor structured data guarantee indexing or rankings. The Google Indexing API is not used for ordinary blogs. Optional IndexNow applies to participating engines. `/robots.txt`, `/sitemap.xml`, `/feed.xml`, `/llms.txt` and `/llm.txt` are generated by the application. Local previews without `SITE_URL` remain noindex.

Google Business Profile needs separate owner OAuth authorization and Google project approval/quota. A generic Google API key does not provide access to manage a business profile. Its connection remains incomplete. The current YouTube key also needs YouTube Data API enabled.

## How Composio is used

`COMPOSIO_API_KEY` is a **Composio project/developer platform API key**. It is sent only from the server in the `x-api-key` header. It is not a Meta access token, Google key, webhook signing secret or Codex connector session.

Connection verification uses:

```http
GET https://backend.composio.dev/api/v3/connected_accounts
x-api-key: <your project API key>
```

Feed reads use:

```http
POST https://backend.composio.dev/api/v3.1/tools/execute/<tool slug>
x-api-key: <your project API key>
Content-Type: application/json
```

The JSON body contains `connected_account_id`, `version` and the tool's `arguments`. Set `COMPOSIO_FACEBOOK_ACCOUNT_ID`, `COMPOSIO_INSTAGRAM_ACCOUNT_ID` and `COMPOSIO_YOUTUBE_ACCOUNT_ID` from that **same project**. The adapters read public Page posts, professional Instagram media and public YouTube videos. They never publish social posts.

The supplied key currently returns **HTTP 401, code 801, `APIKey_InvalidAPIKey`**, at the connection-list endpoint. This happens before any connected-account permissions are evaluated. A webhook does not repair that key: this implementation uses authenticated API reads after a verified trigger arrives. The website retains the last saved public social snapshot while refresh is unavailable.

After the key and connections work:

1. Deploy the app and confirm its HTTPS URL.
2. In Composio, subscribe supported triggers for the relevant accounts to `https://growintek.com/api/webhooks/composio`.
3. Save the subscription's signing secret as `COMPOSIO_WEBHOOK_SECRET` in Vercel and redeploy. This is separate from the API key.
4. Verify a trigger delivery in Composio and the resulting CMS feed refresh.

The handler verifies the timestamp and HMAC signature over `webhook-id.webhook-timestamp.rawBody`, accepts V3 trigger events only from configured account IDs, deduplicates event IDs and refreshes the public feed. The signing secret and live subscription are not configured yet. Scheduled refresh remains a fallback; a daily Vercel cron only refreshes when invoked, so use a more frequent supported schedule if hourly polling is required.

External social images and YouTube playback require media consent. Original post links remain available. Cached remote images can expire before the next successful refresh.

## Deploy and verify

Import the GitHub branch into Vercel, select **Other** framework and Node 22+. The committed config builds browser/server bundles, serves assets and routes pages/API to `api/index.js`. This is not a static SPA. Set environment values, deploy, attach the domain and redirect alternate hostnames to `SITE_URL`.

After deployment, verify a CMS sign-in, image upload, saved draft, contact inquiry, invoice preview, Analytics/Search Console report, sitemap and cron execution. GitHub code publication alone does not deploy Vercel or activate its cron/webhook URL.

The public portfolio includes live-site captures from 31 October 2026. Pak Exporters could not be reached and retains a clearly labeled concept image. Legal pages are editable; set the actual business identity, jurisdiction and contact details before launch. Invoices are bookkeeping/printable documents and do not process payments or send email.

Use Prisma provider backups/PITR and separate S3 backups. `npm run backup` applies only to local SQLite. Tests use a disposable database; never set `TEST_POSTGRES_URL` to the live CMS database.
