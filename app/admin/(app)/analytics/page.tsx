import Link from "next/link";
import { getDashboard, delta, type Range } from "@/lib/analytics";
import { AreaChart, BarList, Donut, DualChart } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

const RANGES: Range[] = [7, 30, 90, 365];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: raw } = await searchParams;
  const range: Range = RANGES.includes(Number(raw) as Range) ? (Number(raw) as Range) : 30;

  const data = await getDashboard(range);

  const visitorsDelta = delta(data.visitors, data.prev.visitors);
  const pageviewsDelta = delta(data.pageviews, data.prev.pageviews);
  const ctaDelta = delta(data.ctaClicks, data.prev.ctaClicks);

  const hasData = data.pageviews > 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">
            First-party data, recorded without cookies or a consent banner.
            Visitor identity is a daily-rotating hash — no IPs stored.
          </p>
        </div>
        <nav className="tabs" style={{ marginBottom: 0, borderBottom: 0 }} aria-label="Date range">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              className={`tab ${range === r ? "tab--on" : ""}`}
            >
              {r === 365 ? "12 months" : `${r} days`}
            </Link>
          ))}
        </nav>
      </header>

      {!hasData ? (
        <section className="panel">
          <div className="empty">
            <strong>No traffic recorded in this window</strong>
            <span>
              Page views are recorded by the public site. Open{" "}
              <Link href="/" target="_blank" className="a-link">growintek.com</Link>{" "}
              in another tab and reload this page.
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi label="Unique visitors" value={data.visitors.toLocaleString("en-GB")} d={visitorsDelta} />
            <Kpi label="Page views" value={data.pageviews.toLocaleString("en-GB")} d={pageviewsDelta} />
            <Kpi label="CTA clicks" value={String(data.ctaClicks)} d={ctaDelta} />
            <Kpi label="Form starts" value={String(data.formStarts)} />
            <Kpi label="Enquiries" value={String(data.leads)} />
            <Kpi label="Enquiry rate" value={`${data.conversionRate.toFixed(1)}%`} note="enquiries ÷ visitors" />
          </div>

          <div className="split" style={{ marginBottom: "1rem" }}>
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Visitors and page views</h2>
              </div>
              <div className="panel-body">
                <DualChart
                  a={data.byDay.map((d) => ({ label: fmtDay(d.date), value: d.pageviews }))}
                  b={data.byDay.map((d) => ({ label: fmtDay(d.date), value: d.visitors }))}
                  aLabel="Page views"
                  bLabel="Visitors"
                />
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Devices</h2>
              </div>
              <div className="panel-body">
                <Donut
                  label="Traffic by device"
                  segments={data.devices.map((d, i) => ({
                    label: capitalise(d.device),
                    value: d.count,
                    colour: ["#1b2ce0", "#a7b79a", "#b4653f"][i % 3],
                  }))}
                />
                <div style={{ marginTop: "1rem" }}>
                  <p className="kpi-label" style={{ marginBottom: ".4rem" }}>Browsers</p>
                  <BarList items={data.browsers.map((b) => ({ label: b.browser, value: b.count }))} />
                </div>
              </div>
            </section>
          </div>

          <div className="split" style={{ marginBottom: "1rem" }}>
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Enquiries by day</h2>
              </div>
              <div className="panel-body">
                <AreaChart
                  series={data.byDay.map((d) => ({ label: fmtDay(d.date), value: d.leads }))}
                  label="Enquiries"
                  colour="#4d7a3a"
                  fill="rgba(77,122,58,.10)"
                  height={140}
                />
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Where visitors come from</h2>
              </div>
              <div className="panel-body">
                <BarList
                  items={data.referrers.map((r) => ({
                    label: labelSource(r.source),
                    value: r.views,
                  }))}
                  emptyLabel="No referrers recorded."
                />
              </div>
              <div className="panel-foot">
                “Direct” includes bookmarks, apps and anything the browser hides.
              </div>
            </section>
          </div>

          <div className="split">
            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Top pages</h2>
              </div>
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th className="num">Views</th>
                      <th className="num">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((p) => (
                      <tr key={p.path}>
                        <td className="mono-num" style={{ fontSize: ".78rem" }}>{p.path}</td>
                        <td className="num">{p.views}</td>
                        <td className="num dim">
                          {data.pageviews > 0 ? ((p.views / data.pageviews) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <h2 className="panel-title">Clicks by button</h2>
              </div>
              <div className="panel-body">
                <BarList
                  items={data.ctaLabels.map((c) => ({ label: c.label, value: c.count }))}
                  emptyLabel="No CTA clicks yet. Buttons are tagged with data-cta attributes."
                />
              </div>
              <div className="panel-foot">
                This is the honest conversion signal: which call to action people actually press.
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  d,
  note,
}: {
  label: string;
  value: string;
  d?: number | null;
  note?: string;
}) {
  const cls =
    d == null ? "kpi-delta--flat" : d > 0.5 ? "kpi-delta--up" : d < -0.5 ? "kpi-delta--down" : "kpi-delta--flat";
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {d != null ? (
        <span className={`kpi-delta ${cls}`}>
          {d > 0 ? "↑" : d < 0 ? "↓" : "→"} {Math.abs(d).toFixed(0)}%
        </span>
      ) : (
        <span className="kpi-delta kpi-delta--flat">{note ?? "—"}</span>
      )}
    </div>
  );
}

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelSource(s: string): string {
  const map: Record<string, string> = {
    direct: "Direct",
    search: "Search engines",
    social: "Social",
    email: "Email",
  };
  return map[s] ?? s;
}
