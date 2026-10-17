import Link from "next/link";
import { prisma } from "@/lib/db";
import SyncButton from "@/components/admin/SyncButton";

export const dynamic = "force-dynamic";

type Platform = {
  key: string;
  name: string;
  purpose: string;
  env: string[];
  status: boolean;
  note: string;
  link?: string;
};

export default async function IntegrationsPage() {
  const [reviews, social] = await Promise.all([
    prisma.review.groupBy({ by: ["platform"], _count: { _all: true }, _max: { reviewedAt: true, syncedAt: true } }),
    prisma.socialPost.groupBy({ by: ["platform"], _count: { _all: true }, _max: { syncedAt: true } }),
  ]);

  const platforms: Platform[] = [
    {
      key: "google",
      name: "Google Business Profile",
      purpose: "Reviews and aggregate score on /reviews and the homepage.",
      env: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN",
        "GBP_ACCOUNT_ID",
        "GBP_LOCATION_ID",
      ],
      status: Boolean(
        process.env.GOOGLE_CLIENT_ID &&
          process.env.GOOGLE_CLIENT_SECRET &&
          process.env.GOOGLE_REFRESH_TOKEN &&
          process.env.GBP_ACCOUNT_ID &&
          process.env.GBP_LOCATION_ID
      ),
      note: "Requires a Google Cloud project with the Business Profile API enabled and an approved quota. The refresh token is minted once with the business.manage scope.",
      link: "https://developers.google.com/my-business",
    },
    {
      key: "trustpilot",
      name: "Trustpilot",
      purpose: "Reviews and TrustScore on /reviews.",
      env: ["TRUSTPILOT_API_KEY", "TRUSTPILOT_BUSINESS_UNIT_ID"],
      status: Boolean(process.env.TRUSTPILOT_API_KEY && process.env.TRUSTPILOT_BUSINESS_UNIT_ID),
      note: "Review API access comes with a paid Trustpilot Business plan. The API key is in Business Settings → Integrations.",
      link: "https://developers.trustpilot.com",
    },
    {
      key: "facebook",
      name: "Facebook",
      purpose: "Page recommendations (ratings) and page posts in the social feed.",
      env: ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_TOKEN"],
      status: Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN),
      note: "Facebook retired the standalone Reviews tab in 2018; pages now collect Recommendations via the ratings edge. Use a long-lived page token with pages_read_engagement.",
      link: "https://developers.facebook.com/docs/graph-api",
    },
    {
      key: "instagram",
      name: "Instagram",
      purpose: "Grid feed on /reviews and the homepage.",
      env: ["INSTAGRAM_BUSINESS_ACCOUNT_ID", "FACEBOOK_PAGE_TOKEN"],
      status: Boolean(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.FACEBOOK_PAGE_TOKEN),
      note: "The Instagram account must be a Business or Creator account linked to the Facebook page. The page token is shared with the Facebook integration.",
      link: "https://developers.facebook.com/docs/instagram-basic-display-api",
    },
    {
      key: "youtube",
      name: "YouTube Shorts",
      purpose: "Shorts and long-form videos in a 9:16 carousel.",
      env: ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"],
      status: Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID),
      note: "The API key is free from Google Cloud → APIs & Services. Shorts are detected by ISO-8601 duration ≤ 61 seconds; YouTube has no dedicated Shorts endpoint.",
      link: "https://developers.google.com/youtube/v3",
    },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Integrations</h1>
          <p className="page-sub">
            Reviews and feeds are read from each platform's API and cached in the
            database, so the site never waits on a third party while a visitor
            loads a page. Nothing is invented: an unconnected platform shows as
            unconnected.
          </p>
        </div>
        <div className="page-actions">
          <SyncButton />
        </div>
      </header>

      <div className="stack-lg">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Connection status</h2>
            <span className="dim" style={{ fontSize: ".72rem" }}>
              Credentials live in environment variables, never in the database
            </span>
          </div>
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Used for</th>
                  <th>Status</th>
                  <th className="num">Cached</th>
                  <th>Last sync</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => {
                  const reviewRow = reviews.find((r) => r.platform.toLowerCase() === p.key);
                  const socialRow = social.find((s) => s.platform === p.key);
                  const cached = (reviewRow?._count._all ?? 0) + (socialRow?._count._all ?? 0);
                  const lastSync = reviewRow?._max.syncedAt ?? socialRow?._max.syncedAt ?? null;
                  return (
                    <tr key={p.key}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td className="dim">{p.purpose}</td>
                      <td>
                        <span className={`pill ${p.status ? "pill--green" : "pill--grey"}`}>
                          {p.status ? "connected" : "not connected"}
                        </span>
                      </td>
                      <td className="num">{cached || "—"}</td>
                      <td className="dim">
                        {lastSync
                          ? lastSync.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "never"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid-2">
          {platforms.map((p) => (
            <section className="panel" key={p.key}>
              <div className="panel-head">
                <h2 className="panel-title">{p.name}</h2>
                <span className={`pill ${p.status ? "pill--green" : "pill--amber"}`}>
                  {p.status ? "ready" : "needs credentials"}
                </span>
              </div>
              <div className="panel-body">
                <p style={{ fontSize: ".82rem", lineHeight: 1.6, color: "#3d3c31" }}>{p.note}</p>
                <p className="kpi-label" style={{ marginTop: ".9rem" }}>Environment variables</p>
                <ul className="env-list">
                  {p.env.map((e) => (
                    <li key={e}>
                      <code>{e}</code>
                      <span className={process.env[e] ? "env-ok" : "env-missing"}>
                        {process.env[e] ? "set" : "missing"}
                      </span>
                    </li>
                  ))}
                </ul>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="a-link" style={{ fontSize: ".78rem", display: "inline-block", marginTop: ".75rem" }}>
                    Platform documentation ↗
                  </a>
                )}
              </div>
            </section>
          ))}
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">How syncing works</h2>
          </div>
          <div className="panel-body">
            <ol className="how-list">
              <li>
                <span className="mono-num">01</span>
                <p>
                  Add the credentials to your environment (Vercel → Settings →
                  Environment Variables) and redeploy.
                </p>
              </li>
              <li>
                <span className="mono-num">02</span>
                <p>
                  Press <strong>Sync reviews and feeds</strong> above. Each platform
                  is fetched independently; one failure does not stop the others.
                </p>
              </li>
              <li>
                <span className="mono-num">03</span>
                <p>
                  Records are upserted by external id into <code>Review</code> and{" "}
                  <code>SocialPost</code>. Re-running is safe and only updates what
                  changed.
                </p>
              </li>
              <li>
                <span className="mono-num">04</span>
                <p>
                  Schedule the sync. The simplest option is a Vercel Cron hitting a
                  route that calls the same function — see docs/CMS.md.
                </p>
              </li>
            </ol>
            <p className="dim" style={{ fontSize: ".78rem", marginTop: "1rem" }}>
              No review is ever written by hand into this system. If a platform is
              not connected, the site shows that honestly rather than a placeholder rating.
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .env-list { display: grid; gap: .3rem; margin-top: .4rem; }
        .env-list li { display: flex; justify-content: space-between; gap: 1rem; font-size: .74rem; align-items: center; }
        .env-list code { font-family: var(--font-mono); font-size: .72rem; background: #f0ece1; padding: .1em .35em; border-radius: 3px; }
        .env-ok { color: #3f6b2c; font-family: var(--font-mono); font-size: .68rem; }
        .env-missing { color: #9a9684; font-family: var(--font-mono); font-size: .68rem; }
        .how-list { display: grid; gap: .8rem; }
        .how-list li { display: grid; grid-template-columns: 2rem 1fr; gap: .5rem; align-items: start; font-size: .82rem; line-height: 1.55; }
        .how-list .mono-num { color: #9a9684; font-size: .72rem; padding-top: .1rem; }
        .how-list code { font-family: var(--font-mono); font-size: .78rem; background: #f0ece1; padding: .1em .3em; border-radius: 3px; }
      `}</style>
    </>
  );
}
