import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDashboard, delta, rangeStart } from "@/lib/analytics";
import { formatMinor } from "@/lib/money";
import { AreaChart, BarList } from "@/components/admin/Charts";
import StatusPill from "@/components/admin/StatusPill";
import AdminAssistant from "@/components/admin/AdminAssistant";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const range = 30 as const;
  const start = rangeStart(range);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);

  const [
    analytics,
    newLeads,
    recentLeads,
    openInvoices,
    paidThisMonth,
    activeProjects,
    tasksDue,
    contentCounts,
    recentActivity,
    unapproved,
  ] = await Promise.all([
    getDashboard(range),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, company: true, service: true, status: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["SENT", "OVERDUE"] }, totalMinor: { gt: 0 } },
      include: { client: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      _sum: { amountMinor: true },
    }),
    prisma.clientProject.findMany({
      where: { status: { in: ["PLANNING", "IN_PROGRESS", "REVIEW"] } },
      include: { client: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { done: false },
      orderBy: [{ priority: "asc" }, { dueAt: "asc" }],
      take: 5,
      include: { clientProject: { select: { name: true } } },
    }),
    Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { state: "DRAFT" } }),
      prisma.service.count({ where: { state: "PUBLISHED" } }),
      prisma.project.count({ where: { state: "PUBLISHED" } }),
    ]),
    prisma.lead.findMany({ where: { createdAt: { gte: fourteenDaysAgo } }, select: { createdAt: true } }),
    prisma.testimonial.count({ where: { approved: false } }),
  ]);

  const [postCount, draftCount, serviceCount, caseCount] = contentCounts;
  const outstanding = openInvoices.reduce((s, i) => s + (i.totalMinor - i.amountPaidMinor), 0);
  const overdue = openInvoices.filter((i) => i.dueAt && i.dueAt < new Date());

  const visitorsDelta = delta(analytics.visitors, analytics.prev.visitors);
  const leadsDelta = delta(analytics.leads, analytics.prev.leads);
  const ctaDelta = delta(analytics.ctaClicks, analytics.prev.ctaClicks);

  // Leads in the last 14 days, bucketed by day for the mini list
  const leadDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return {
      label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      value: recentActivity.filter(
        (l) => l.createdAt.toDateString() === d.toDateString()
      ).length,
    };
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">
            {greeting()}, {user.name?.split(" ")[0] ?? "there"}.
          </h1>
          <p className="page-sub">
            {overdue.length > 0
              ? `${overdue.length} invoice${overdue.length > 1 ? "s" : ""} overdue. That is the first thing to fix today.`
              : newLeads > 0
                ? `${newLeads} enquiries in the last 30 days. Respond to the newest before anything else.`
                : "No overdue invoices and no unread leads. Good place to be."}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/leads" className="a-btn a-btn--primary">Leads</Link>
          <Link href="/admin/invoices/new" className="a-btn">New invoice</Link>
        </div>
      </header>

      <div className="kpi-grid">
        <Kpi
          label="Visitors · 30d"
          value={analytics.visitors.toLocaleString("en-GB")}
          d={visitorsDelta}
        />
        <Kpi
          label="Enquiries · 30d"
          value={String(analytics.leads)}
          d={leadsDelta}
        />
        <Kpi
          label="Clicks on CTA"
          value={String(analytics.ctaClicks)}
          d={ctaDelta}
        />
        <Kpi
          label="Enquiry rate"
          value={`${analytics.conversionRate.toFixed(1)}%`}
        />
        <Kpi
          label="Paid this month"
          value={formatMinor(paidThisMonth._sum.amountMinor ?? 0, "GBP")}
        />
        <Kpi
          label="Outstanding"
          value={formatMinor(outstanding, "GBP")}
          tone={outstanding > 0 ? "warn" : undefined}
        />
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Traffic, last 30 days</h2>
            <Link href="/admin/analytics" className="a-btn a-btn--sm a-btn--ghost">
              Full analytics
            </Link>
          </div>
          <div className="panel-body">
            <AreaChart
              series={analytics.byDay.map((d) => ({
                label: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                value: d.visitors,
              }))}
              label="Unique visitors"
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Where they land</h2>
          </div>
          <div className="panel-body">
            <BarList
              items={analytics.topPages.map((p) => ({ label: p.path, value: p.views }))}
              emptyLabel="No traffic recorded yet. Visit the public site to generate events."
            />
          </div>
        </section>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Newest enquiries</h2>
            <Link href="/admin/leads" className="a-btn a-btn--sm a-btn--ghost">All leads</Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="empty">
              <strong>No enquiries yet</strong>
              <span>When someone submits the form, they appear here with the full brief.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Looking for</th>
                    <th>Status</th>
                    <th className="num">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/admin/leads/${l.id}`} className="a-link">{l.name}</Link>
                        {l.company && <span className="dim"> · {l.company}</span>}
                      </td>
                      <td className="dim">{l.service ?? "—"}</td>
                      <td><StatusPill status={l.status} /></td>
                      <td className="num dim">{relative(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Enquiries · 14 days</h2>
          </div>
          <div className="panel-body">
            <AreaChart
              series={leadDays}
              label="Enquiries per day"
              colour="#4d7a3a"
              fill="rgba(77,122,58,.10)"
              height={120}
            />
          </div>
        </section>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Invoices awaiting payment</h2>
            <Link href="/admin/invoices" className="a-btn a-btn--sm a-btn--ghost">All invoices</Link>
          </div>
          {openInvoices.length === 0 ? (
            <div className="empty">
              <strong>Nothing outstanding</strong>
              <span>Issued invoices that are unpaid will show here with days overdue.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th className="num">Due</th>
                    <th className="num">Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {openInvoices.map((i) => {
                    const daysLate = i.dueAt ? Math.floor((Date.now() - i.dueAt.getTime()) / 86_400_000) : 0;
                    return (
                      <tr key={i.id}>
                        <td><Link href={`/admin/invoices/${i.id}`} className="a-link">{i.client.name}</Link></td>
                        <td className="num dim">
                          {i.dueAt
                            ? daysLate > 0
                              ? `${daysLate}d late`
                              : `in ${Math.abs(daysLate)}d`
                            : "—"}
                        </td>
                        <td className="num">{formatMinor(i.totalMinor - i.amountPaidMinor, i.currency)}</td>
                        <td><StatusPill status={i.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Next up</h2>
            <Link href="/admin/projects" className="a-btn a-btn--sm a-btn--ghost">Projects</Link>
          </div>
          <div className="panel-body">
            {tasksDue.length > 0 ? (
              <ul className="mini-list">
                {tasksDue.map((t) => (
                  <li key={t.id}>
                    <span className={`prio prio--${t.priority}`} aria-hidden="true" />
                    <span className="mini-title">{t.title}</span>
                    <span className="dim tiny">{t.dueAt ? shortDate(t.dueAt) : "no date"}</span>
                  </li>
                ))}
              </ul>
            ) : activeProjects.length > 0 ? (
              <ul className="mini-list">
                {activeProjects.map((p) => (
                  <li key={p.id}>
                    <span className="dot-live" aria-hidden="true" />
                    <span className="mini-title">{p.name}</span>
                    <span className="dim tiny">{p.client.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <strong>Nothing scheduled</strong>
                <span>Add a project to track deliverables and deadlines.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <AdminAssistant />
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Content health</h2>
            <Link href="/admin/content/posts" className="a-btn a-btn--sm a-btn--ghost">Manage content</Link>
          </div>
        <div className="panel-body">
          <ul className="health">
            <li>
              <span className="health-n mono-num">{postCount}</span>
              <span>Journal posts</span>
              <span className={`pill ${draftCount > 0 ? "pill--amber" : "pill--grey"}`}>
                {draftCount} draft
              </span>
            </li>
            <li>
              <span className="health-n mono-num">{serviceCount}</span>
              <span>Published services</span>
              <Link href="/admin/content/services" className="a-link tiny">edit</Link>
            </li>
            <li>
              <span className="health-n mono-num">{caseCount}</span>
              <span>Case studies</span>
              <span className={`pill ${caseCount === 0 ? "pill--red" : "pill--green"}`}>
                {caseCount === 0 ? "none live" : "live"}
              </span>
            </li>
            <li>
              <span className="health-n mono-num">{unapproved}</span>
              <span>Testimonials unapproved</span>
              <Link href="/admin/content/reviews" className="a-link tiny">review</Link>
            </li>
          </ul>
        </div>
        <div className="panel-foot">
          Case studies stay hidden until you publish them. Nothing invented goes live by default.
        </div>
      </section>
    </div>

      <style>{`
        .mini-list { display: grid; gap: .6rem; }
        .mini-list li { display: grid; grid-template-columns: .6rem 1fr auto; gap: .55rem; align-items: center; font-size: .8rem; }
        .mini-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prio { width: 6px; height: 6px; border-radius: 50%; background: #cdc5b3; }
        .prio--1 { background: #96331f; }
        .prio--3 { background: #a7b79a; }
        .dot-live { width: 6px; height: 6px; border-radius: 50%; background: #4d7a3a; }
        .health { display: grid; gap: .7rem; }
        .health li { display: grid; grid-template-columns: 2.5rem 1fr auto; gap: .75rem; align-items: center; font-size: .82rem; }
        .health-n { font-size: .95rem; font-weight: 500; }
        .tiny { font-size: .7rem; }
        @media (max-width: 640px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
      `}</style>
    </>
  );
}

function Kpi({
  label,
  value,
  d,
  tone,
}: {
  label: string;
  value: string;
  d?: number | null;
  tone?: "warn";
}) {
  const cls =
    d === null || d === undefined
      ? "kpi-delta--flat"
      : d > 0.5
        ? "kpi-delta--up"
        : d < -0.5
          ? "kpi-delta--down"
          : "kpi-delta--flat";

  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={tone === "warn" ? { color: "#96331f" } : undefined}>
        {value}
      </span>
      {d !== null && d !== undefined ? (
        <span className={`kpi-delta ${cls}`}>
          {d > 0 ? "↑" : d < 0 ? "↓" : "→"} {Math.abs(d).toFixed(0)}% vs prior
        </span>
      ) : (
        <span className="kpi-delta kpi-delta--flat">no prior period</span>
      )}
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function relative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function shortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
