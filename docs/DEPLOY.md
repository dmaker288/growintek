# Deploying GrowinTek

Target setup: **Prisma Postgres** (console.prisma.io) + **GitHub** (`dmaker288`) +
**Vercel**. Roughly 25 minutes end to end.

You can swap Vercel for any Node host; only the cron and the media storage notes below
change.

---

## 1. Create the database (Prisma Postgres)

1. Sign in at <https://console.prisma.io> with the account you want to own the data
   (`dmaker288` or the email tied to it).
2. **New project** → name it `growintek` → choose the region closest to your users.
   For UK/AU clients, `eu-west` or `ap-southeast` are sensible; pick one and stay there.
3. Open the project → **Connect** → copy the **pooled** connection string. It looks like:

   ```
   prisma+postgres://accelerate.prisma-data.net/?api_key=eyJ...
   ```

   Use the pooled URL for the app. The direct URL (if offered) is only needed for
   migrations on some setups.

4. Keep the console open — you will paste this into Vercel in step 4.

> Prisma Postgres has a free tier that is enough for a brochure site and a small
> client list. Watch the compute-hour and storage limits as you add clients.

---

## 2. Push the schema and seed

From the project folder:

```bash
cp .env.example .env
# paste DATABASE_URL from step 1 into .env
# set AUTH_SECRET and ANALYTICS_SALT — generate each with:
#   openssl rand -base64 48

npx prisma db push
npm run db:seed
```

`db push` creates the tables. `db:seed` inserts the four services, three journal posts,
a demo client and a draft invoice — and creates the admin user from `ADMIN_EMAILS`.

To create the admin explicitly instead:

```bash
npm run admin:create -- dmaker288@gmail.com "Ijtiba Rana"
```

---

## 3. Push to GitHub

Create an **empty** repository under `dmaker288` (no README, no .gitignore — both exist
here), then:

```bash
git init
git add .
git commit -m "GrowinTek: site, CMS, invoicing and analytics"
git branch -M main
git remote add origin https://github.com/dmaker288/growintek.git
git push -u origin main
```

Check `.gitignore` before the first push: `.env` must not be committed. If you ever
commit a secret, rotate it — removing the file is not enough.

---

## 4. Deploy on Vercel

1. <https://vercel.com/new> → **Import Git Repository** → `dmaker288/growintek`.
2. Framework preset: **Next.js** (auto-detected). Build command stays `npm run build`,
   which runs `prisma generate` first.
3. **Environment Variables** — add these for Production *and* Preview:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | pooled Prisma Postgres URL |
   | `NEXT_PUBLIC_SITE_URL` | `https://growintek.com` |
   | `AUTH_SECRET` | 48-byte random string |
   | `ADMIN_EMAILS` | `dmaker288@gmail.com` |
   | `ANALYTICS_SALT` | 48-byte random string, never change it afterwards |
   | `CRON_SECRET` | 32-byte random string |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | your mail provider |

   Add the review and social credentials from `docs/CMS.md` when you have them.

4. **Deploy.**
5. Open `/api/health` — it should return `{"ok":true,...}`. If it returns 503, the
   database URL is wrong or the schema was not pushed.

---

## 5. Point the domain

1. Vercel → Project → **Settings → Domains** → add `growintek.com` and
   `www.growintek.com`.
2. At your registrar, either:
   - change the nameservers to Vercel's, or
   - add `A 76.76.21.21` for the apex and `CNAME cname.vercel-dns.com` for `www`.
3. Set `www` → apex redirect (or the reverse) so you have one canonical host. This
   matters: analytics and SEO both dislike duplicates.
4. After the certificate is issued, confirm `https://growintek.com` loads and
   `http://` redirects.

Then update `NEXT_PUBLIC_SITE_URL` if it is not already the final hostname, and
redeploy.

---

## 6. Protect the admin

- `/admin` is excluded from `robots.txt` and noindexed. That is not security.
- Sessions are hashed in the database; sign-in is a six-digit emailed code with a
  10-minute expiry, five-attempt limit and a 60-second resend cooldown.
- Optionally put Vercel **Deployment Protection** or a WAF rule in front of `/admin*`
  limited to your own email/IP.
- Keep `ADMIN_EMAILS` short. Remove anyone who leaves.

---

## 7. Scheduled sync

`vercel.json` already schedules `/api/cron/sync` at 06:00 UTC daily. It calls the
review and social sync for every configured platform, authenticated with
`Authorization: Bearer $CRON_SECRET` — Vercel Cron sends this automatically.

If you are not on Vercel, call the same route from any scheduler:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://growintek.com/api/cron/sync
```

---

## 8. Media on serverless

Uploads currently write to `data/uploads` on the local filesystem. On Vercel that
directory is ephemeral — files vanish on redeploy. Options, in order of effort:

1. **Use a VPS or a container host** with a persistent volume mounted at `data/`.
2. **Add an S3 driver.** Create a bucket, set `MEDIA_DRIVER=s3` plus the `S3_*`
   variables, and implement the driver in `lib/actions/media.ts` (the upload function is
   already structured for it — replace `writeMediaFile` with a `PutObject` call and store
   the public URL in `MediaAsset.url`).
3. **Use external URLs.** Paste a CDN or hosting URL into the media record; the schema
   already supports absolute URLs.

Do not rely on local uploads in production until you have done one of these.

---

## 9. Post-launch checklist

- [ ] Replace the seeded case studies with real ones (or leave them unpublished).
- [ ] Publish a real testimonial only with written permission.
- [ ] Connect Google Business Profile, Trustpilot, Facebook, Instagram, YouTube.
- [ ] Run the sync once manually from `/admin/integrations`.
- [ ] Submit `https://growintek.com/sitemap.xml` in Google Search Console.
- [ ] Set up a Google Business Profile with the correct service area and category.
- [ ] Test the contact form end to end — check both emails arrive.
- [ ] Add a real favicon (`app/icon.png`) and Open Graph image (`app/opengraph-image.png`).
- [ ] Run `npm run build` locally once to confirm no type errors.
- [ ] Delete the demo client and draft invoice from the seed.
- [ ] Back up the database (Prisma Postgres dashboard → backups / export).
