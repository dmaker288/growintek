# Growintek operations

For the current Vercel, Prisma Postgres, S3 and Composio configuration, use [the launch guide](vercel-prisma.md). The notes below describe local or persistent-host operation where applicable.

## First administrator

There are no built-in credentials or public registration endpoints.

```sh
npm run admin:create -- owner@your-domain.com
```

The command prompts for a password without echoing it. Use a unique password of at least 14 characters. For a Docker deployment:

```sh
docker compose exec website npm run admin:create -- owner@your-domain.com
```

Running the command again for the same email resets the password and revokes all its sessions. Sessions otherwise expire after eight hours. All admins currently have full workspace access; separate editor/accounting roles and MFA are not implemented. Use a private network or identity-aware proxy for stronger administrative access restrictions where required.

## Business and content setup

1. Open Admin → Site settings. Confirm the business name, legal entity, country, contact email and social profile URLs.
2. Review every policy under Pages. The included policies describe the implemented defaults but cannot supply your legal identity, jurisdiction-specific terms or service-provider contracts.
3. Edit the main page records to control titles, descriptions, search metadata and supplementary content. Service and portfolio records drive their public cards and detail pages. Structural home sections use the component templates.
4. Replace concept portfolio visuals with approved work through the image upload control. Add accurate image descriptions and keep the concept checkbox on until the record is a verified case study.
5. Publish only claims you can substantiate. The previous reference's client counts, ratings and satisfaction percentages were removed because they were unverified.
6. Test the public Contact form and find the submission under Leads. This stores the inquiry; no email-delivery provider has been configured. Monitor the dashboard or add a separately authorized notification integration.
7. Create clients before invoices. Invoice totals use rounded minor units. Status updates do not send invoices or collect money. Use Print / Save PDF to export the document, and share it through your normal business process.

## DashScope

Create a Model Studio key and choose a model enabled in the same region and workspace. Put the values in the server environment:

- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL`: official HTTPS Alibaba endpoint ending in `/compatible-mode/v1`
- `DASHSCOPE_MODEL`: uses `qwen3.5-flash` in the verified environment; choose an available model that supports JSON output.

Current Model Studio documentation describes workspace-specific endpoints, for example `https://WORKSPACE_ID.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`. Use the exact endpoint provided by your console. Keys from one region cannot necessarily access another. The adapter only accepts official `aliyuncs.com` HTTPS hosts and never sends the key to the browser.

Source: https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope (consulted 31 October 2026).

In AI publishing, request topic hypotheses, then save suitable ideas to Keyword research. Validate search intent with real query data or independent research. Add at least two distinct verified HTTPS sources and notes with the facts the writer may use. Mark the topic Ready. Generate a draft and inspect the job history. The article publishes automatically after checks under the selected preference; enabling approval keeps it in Review.

The source notes are reference material, not instructions. Generated output must match a JSON schema, cite approved URLs and avoid substantial overlap with existing site articles. These checks do not verify the truth of supplied notes, detect all plagiarism, provide legal clearance or guarantee E-E-A-T. An editor should inspect and correct every article, add real experience where available, verify sources and identify the reviewer before publication.

Daily publishing is disabled initially. Enable it in Site settings, choose an hour and IANA timezone, and keep ready topics in the queue. The default time is 09:00 Asia/Karachi. Disabling approval permits automatically checked publication; the article discloses the absence of human review. Use that setting only when your editorial process supports it.

Each daily job has a unique local-calendar-day key. The worker uses transactional claims and five-minute leases, and retries failed work up to three times with a delay. Errors remain visible. A manual retry resets the attempts for a failed job. The daily schedule is checked every 30 seconds while the web process is running; a stopped server cannot run scheduled jobs. An optional supervised cron invocation is `npm run worker` against the same persistent database. After a process crash, provider calls may be repeated; article creation and topic consumption occur atomically so a used topic cannot publish twice.

## Google Search Console

Enable the Search Console API in your Google Cloud project. Create a service account and add its email to the verified Search Console property with sufficient permission to view query reports and submit a sitemap. Configure:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`: PEM private key, quoted with literal `\n` escapes if stored in `.env`
- `GSC_PROPERTY`: `sc-domain:your-domain.com` or the exact URL-prefix property
- `SITE_URL`
- Optional `GOOGLE_SITE_VERIFICATION` for an HTML verification token; DNS verification is also supported externally.

The server exchanges a signed JWT for a short-lived access token. The admin report requests queries for a 28-day window ending three days ago. Average position depends on query, device, location and time; it is not a fixed live ranking. Search Console can return no data on new or low-traffic properties. Query reports are not a keyword-volume database.

Use Submit sitemap to verify access. The worker also queues one sitemap submission per day when credentials and a property are present. Google determines crawl and indexing behavior. The general Google Indexing API is not used because ordinary blog and agency pages do not qualify for its supported content types.

References: https://developers.google.com/webmaster-tools/v1/searchanalytics/query and https://developers.google.com/webmaster-tools/v1/sitemaps/submit.

## Google Analytics 4

Enable the Google Analytics Data API and grant the same service account Viewer access to the GA4 property. Configure `GA4_PROPERTY_ID` on the server, then set the public `G-...` measurement ID in Site settings. The property ID and measurement ID are different.

The browser loads Google Analytics only after analytics consent. The first-party event API also requires consent and stores a page path, event type and date, with no persistent visitor identifier. Recorded counts can include repeat events and are not unique-user estimates. Server/network access logs depend on your host's own configuration and retention.

GA4 reports use 28 days through yesterday and show the provider's actual users, sessions and pageviews. New properties may have processing delays. Configure any desired conversion/key-event definitions in GA4 and ensure they match your consent and privacy policies.

Reference: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport.

## IndexNow and crawl output

Set a random `INDEXNOW_KEY` containing 8–128 letters, digits or hyphens. The app exposes it at `/KEY.txt` and submits published content URLs to the official IndexNow endpoint. Only participating search engines use this protocol. Neither acceptance nor a sitemap guarantees indexing.

`/sitemap.xml` contains public routes. Drafts and private records are excluded. `/robots.txt` disallows admin and API paths. Without a configured production origin, it disallows all crawling and HTML is noindex. `/llms.txt` and `/llm.txt` provide a readable public-content index; these are informational conventions, not a ranking integration. `/feed.xml` exposes published article summaries.

The SEO audit checks titles, description length, substantive content, editorial review, portfolio descriptions, production origin and legal setup. It is deliberately scoped and does not replace crawl tools, field Core Web Vitals, a backlink assessment or a manual accessibility review.

## Direct-provider alternatives to Composio

Composio is the selected integration; see the launch guide. Direct Meta/YouTube credentials remain an optional fallback.

Profile URLs alone provide outbound links. Live feeds additionally require:

- Facebook: `META_PAGE_ID`, `META_ACCESS_TOKEN`, and permission to read the Page's posts.
- Instagram: `INSTAGRAM_ACCOUNT_ID` for the appropriate professional account, `META_ACCESS_TOKEN`, and the necessary account/page permissions.
- `META_GRAPH_VERSION` must be a version supported by your Meta app (default `v24.0`). Confirm access and any required app review in the Meta console.
- YouTube: `YOUTUBE_API_KEY` with YouTube Data API v3 enabled, and `YOUTUBE_CHANNEL_ID`. Restrict the key to this API and the deployment as supported.

Refresh feeds in Integrations to exercise the connections. When provider credentials exist, the worker refreshes once per hour. Cached public captions and links are shown on the site. Remote images load only with external-media consent; linking out is always available. The current UI separates posts, reels and videos, with consent-gated click-to-play YouTube embeds. A failed provider response is recorded, and no fake posts or follower counts are created.

## Backups, retention and incident handling

```sh
npm run backup
```

This uses SQLite's online backup API for a consistent database copy under `backups/`. Also back up `data/media/`. Encrypt backups and move them off-host using your infrastructure. Test restoration to a separate database before relying on a backup schedule. Keep files readable only by the application operator. Do not publish backups through the web server.

Optional event retention defaults to 90 days and is enforced by the worker. Leads, clients, invoices, jobs and administrative audit records are retained until intentionally removed or archived according to your business policy. Lead deletion can be performed from the dashboard. A client with invoices cannot be deleted accidentally; set it inactive or handle the invoice records first.

For suspected account compromise, reset the admin password to revoke sessions, rotate affected provider keys, inspect the administrative audit trail and hosting logs, and follow applicable notification obligations. The software does not implement a complete compliance program.

## Verification performed in the workspace

`npm run build` compiles both browser and server bundles. `npm test` exercises authentication, CSRF, lead persistence, public/draft boundaries, edit conflicts, invoice arithmetic and relationships, image safety, consent events, crawl outputs and AI job behavior with a mocked provider. Browser tests use a separate temporary database and test-only account, not the production database. They inspect desktop/mobile public routes, contact submission, CMS publication, invoice preview and admin sections. Live provider credentials, DNS, TLS hosting and real account permissions must still be verified in your deployment.
