import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";
import { Columns } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

/**
 * Management reports. Every figure is derived at request time from the
 * invoices, payments and expenses tables — nothing is stored twice, so a
 * report can never disagree with the underlying record.
 */
export default async function ReportsPage() {
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);

  const [payments, invoices, expenses, leads, clients, timeEntries] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: yearStart } },
      select: { amountMinor: true, currency: true, paidAt: true, invoiceId: true },
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { issuedAt: { gte: yearStart } },
          { createdAt: { gte: yearStart }, status: "DRAFT" },
        ],
      },
      select: {
        id: true,
        number: true,
        status: true,
        totalMinor: true,
        amountPaidMinor: true,
        currency: true,
        issuedAt: true,
        dueAt: true,
        createdAt: true,
        client: { select: { name: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({ where: { spentAt: { gte: yearStart } } }),
    prisma.lead.findMany({
      where: { createdAt: { gte: yearStart } },
      select: { status: true, createdAt: true, budget: true },
    }),
    prisma.client.count({ where: { archived: false } }),
    prisma.timeEntry.findMany({
      where: { startedAt: { gte: yearStart } },
      select: { minutes: true, billable: true },
    }),
  ]);

  // ── Revenue by month (cash collected, GBP-normalised not attempted)
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    label: new Date(year, m, 1).toLocaleDateString("en-GB", { month: "short" }),
    value: 0,
  }));
  for (const p of payments) {
    monthly[p.paidAt.getMonth()].value += p.amountMinor;
  }

  const grossPaid = payments.reduce((s, p) => s + p.amountMinor, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amountMinor, 0);
  const net = grossPaid - expenseTotal;

  const billed = invoices
    .filter((i) => i.number && i.status !== "VOID")
    .reduce((s, i) => s + i.totalMinor, 0);
  const outstanding = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + (i.totalMinor - i.amountPaidMinor), 0);
  const overdueTotal = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + (i.totalMinor - i.amountPaidMinor), 0);

  const won = leads.filter((l) => l.status === "WON").length;
  const lost = leads.filter((l) => l.status === "LOST").length;
  const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : null;

  const hours = timeEntries.reduce((s, t) => s + t.minutes, 0) / 60;
  const billableHours = timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.minutes, 0) / 60;

  // ── CSV
  const csv = [
    ["Number", "Client", "Status", "Issued", "Due", "Total", "Paid", "Balance", "Currency"],
    ...invoices.map((i) => [
      i.number ?? "DRAFT",
      i.client.company ?? i.client.name,
      i.status,
      i.issuedAt ? i.issuedAt.toISOString().slice(0, 10) : "",
      i.dueAt ? i.dueAt.toISOString().slice(0, 10) : "",
      (i.totalMinor / 100).toFixed(2),
      (i.amountPaidMinor / 100).toFixed(2),
      ((i.totalMinor - i.amountPaidMinor) / 100).toFixed(2),
      i.currency,
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");

  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Reports · {year}</h1>
          <p className="page-sub">
            Cash collected, what is owed, and what it cost. Figures are recomputed
            from invoices, payments and expenses on every load.
          </p>
        </div>
        <div className="page-actions">
          <a
            href={csvHref}
            download={`growintek-invoices-${year}.csv`}
            className="a-btn"
          >
            Export invoices CSV
          </a>
          <Link href="/admin/finance" className="a-btn a-btn--ghost">Add expense</Link>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Collected {year}</span>
          <span className="kpi-value">{formatMinor(grossPaid, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Billed {year}</span>
          <span className="kpi-value">{formatMinor(billed, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Outstanding</span>
          <span className="kpi-value" style={outstanding > 0 ? { color: "#96331f" } : undefined}>
            {formatMinor(outstanding, "GBP")}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Costs</span>
          <span className="kpi-value">{formatMinor(expenseTotal, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Net</span>
          <span className="kpi-value" style={{ color: net >= 0 ? "#3f6b2c" : "#96331f" }}>
            {formatMinor(net, "GBP")}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Win rate</span>
          <span className="kpi-value">{winRate === null ? "—" : `${winRate.toFixed(0)}%`}</span>
          <span className="kpi-delta kpi-delta--flat">{won} won · {lost} lost</span>
        </div>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Cash collected by month</h2>
          </div>
          <div className="panel-body">
            <Columns items={monthly} format={(n) => formatMinor(n, "GBP", { compact: true })} />
          </div>
          <div className="panel-foot">
            Cash basis: a payment counts in the month it landed, not the month it was invoiced.
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">This year at a glance</h2>
          </div>
          <div className="panel-body">
            <dl className="report-kv">
              <div><dt>Active clients</dt><dd>{clients}</dd></div>
              <div><dt>Enquiries</dt><dd>{leads.length}</dd></div>
              <div><dt>Converted</dt><dd>{won}</dd></div>
              <div><dt>Overdue debt</dt><dd style={overdueTotal > 0 ? { color: "#96331f" } : undefined}>{formatMinor(overdueTotal, "GBP")}</dd></div>
              <div><dt>Hours logged</dt><dd>{hours.toFixed(1)}</dd></div>
              <div><dt>Billable hours</dt><dd>{billableHours.toFixed(1)}</dd></div>
              <div>
                <dt>Effective hourly</dt>
                <dd>{billableHours > 0 ? formatMinor(Math.round(grossPaid / billableHours), "GBP") : "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="panel-foot">
            Effective hourly is collected cash ÷ billable hours. It is the number that
            tells you whether a project was worth taking.
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Invoices this year</h2>
          <span className="dim" style={{ fontSize: ".75rem" }}>{invoices.length} records</span>
        </div>
        {invoices.length === 0 ? (
          <div className="empty">
            <strong>No invoices yet</strong>
            <span>Reports fill up as soon as you issue the first one.</span>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th className="num">Paid</th>
                  <th className="num">Balance</th>
                  <th className="num">Issued</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <Link href={`/admin/invoices/${i.id}`} className="a-link mono-num">
                        {i.number ?? "Draft"}
                      </Link>
                    </td>
                    <td className="dim">{i.client.company ?? i.client.name}</td>
                    <td className="dim">{i.status.toLowerCase()}</td>
                    <td className="num">{formatMinor(i.totalMinor, i.currency)}</td>
                    <td className="num dim">{formatMinor(i.amountPaidMinor, i.currency)}</td>
                    <td className="num">{formatMinor(i.totalMinor - i.amountPaidMinor, i.currency)}</td>
                    <td className="num dim">
                      {i.issuedAt ? i.issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .report-kv { display: grid; gap: .55rem; font-size: .82rem; }
        .report-kv > div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #efeadd; padding-bottom: .45rem; }
        .report-kv > div:last-child { border-bottom: 0; padding-bottom: 0; }
        .report-kv dt { color: #6d6a5b; }
        .report-kv dd { font-family: var(--font-mono); font-variant-numeric: tabular-nums; font-weight: 500; }
      `}</style>
    </>
  );
}

function csvCell(value: string): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
