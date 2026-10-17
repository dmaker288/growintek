import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate } from "@/lib/money";
import { addExpense, addTimeEntry } from "@/lib/actions/crm";
import { Columns } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const [expenses, payments, clients, projects, timeEntries] = await Promise.all([
    prisma.expense.findMany({ orderBy: { spentAt: "desc" }, take: 50 }),
    prisma.payment.findMany({
      where: { paidAt: { gte: yearStart } },
      select: { amountMinor: true, paidAt: true },
    }),
    prisma.client.findMany({
      where: { archived: false },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.clientProject.findMany({
      where: { status: { not: "CLOSED" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.timeEntry.findMany({ orderBy: { startedAt: "desc" }, take: 25 }),
  ]);

  const spent = expenses.reduce((s, e) => s + e.amountMinor, 0);
  const earned = payments.reduce((s, p) => s + p.amountMinor, 0);

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amountMinor);
  }

  const monthlySpend = Array.from({ length: 12 }, (_, m) => ({
    label: new Date(new Date().getFullYear(), m, 1).toLocaleDateString("en-GB", { month: "short" }),
    value: 0,
  }));
  for (const e of expenses) {
    if (e.spentAt >= yearStart) monthlySpend[e.spentAt.getMonth()].value += e.amountMinor;
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="page-sub">
            Costs, time and the running margin. Expenses are simple on purpose —
            this is a management view, not bookkeeping.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/reports" className="a-btn">Full report</Link>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Collected this year</span>
          <span className="kpi-value">{formatMinor(earned, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Spent this year</span>
          <span className="kpi-value">{formatMinor(spent, "GBP")}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Margin</span>
          <span className="kpi-value" style={{ color: earned - spent >= 0 ? "#3f6b2c" : "#96331f" }}>
            {earned > 0 ? `${(((earned - spent) / earned) * 100).toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Spending by month</h2>
          </div>
          <div className="panel-body">
            <Columns items={monthlySpend} format={(n) => formatMinor(n, "GBP", { compact: true })} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Where it goes</h2>
          </div>
          <div className="panel-body">
            {byCategory.size === 0 ? (
              <p className="dim" style={{ fontSize: ".82rem" }}>No expenses recorded yet.</p>
            ) : (
              <ul className="cat-list">
                {Array.from(byCategory.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => (
                    <li key={cat}>
                      <span>{cat}</span>
                      <span className="mono-num">{formatMinor(amount, "GBP")}</span>
                      <span className="dim mono-num">
                        {spent > 0 ? Math.round((amount / spent) * 100) : 0}%
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="split" style={{ marginBottom: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Recent expenses</h2>
          </div>
          {expenses.length === 0 ? (
            <div className="empty">
              <strong>No expenses yet</strong>
              <span>Log hosting, software and subcontractor costs to see a real margin.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th className="num">Amount</th>
                    <th className="num">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td>{e.label}</td>
                      <td className="dim">{e.category}</td>
                      <td className="num">{formatMinor(e.amountMinor, e.currency)}</td>
                      <td className="num dim">{formatDate(e.spentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Log an expense</h2>
          </div>
          <div className="panel-body">
            <form action={addExpense} className="a-form">
              <div className="a-field">
                <label htmlFor="label">What was it?</label>
                <input id="label" name="label" required className="a-input" placeholder="Vercel Pro, Prisma Postgres" />
              </div>
              <div className="a-form-row">
                <div className="a-field">
                  <label htmlFor="amount">Amount</label>
                  <input id="amount" name="amount" type="number" step="0.01" min="0" required className="a-input" />
                </div>
                <div className="a-field">
                  <label htmlFor="currency">Currency</label>
                  <select id="currency" name="currency" className="a-select" defaultValue="GBP">
                    <option value="GBP">GBP</option>
                    <option value="USD">USD</option>
                    <option value="AUD">AUD</option>
                    <option value="EUR">EUR</option>
                    <option value="PKR">PKR</option>
                  </select>
                </div>
              </div>
              <div className="a-form-row">
                <div className="a-field">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" className="a-select" defaultValue="Software">
                    <option>Software</option>
                    <option>Hosting</option>
                    <option>Contractor</option>
                    <option>Equipment</option>
                    <option>Marketing</option>
                    <option>Travel</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="a-field">
                  <label htmlFor="spentAt">Date</label>
                  <input
                    id="spentAt"
                    name="spentAt"
                    type="date"
                    className="a-input"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>
              <button type="submit" className="a-btn a-btn--primary">Add expense</button>
            </form>
          </div>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Time log</h2>
            <span className="dim" style={{ fontSize: ".72rem" }}>{timeEntries.length} recent entries</span>
          </div>
          {timeEntries.length === 0 ? (
            <div className="empty">
              <span>No time logged. Logging hours is how you find out which work is actually profitable.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Note</th>
                    <th className="num">Minutes</th>
                    <th>Billable</th>
                    <th className="num">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((t) => (
                    <tr key={t.id}>
                      <td>{t.note ?? "—"}</td>
                      <td className="num">{t.minutes}</td>
                      <td className="dim">{t.billable ? "yes" : "no"}</td>
                      <td className="num dim">{formatDate(t.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Log time</h2>
          </div>
          <div className="panel-body">
            <form action={addTimeEntry} className="a-form">
              <div className="a-form-row">
                <div className="a-field">
                  <label htmlFor="minutes">Minutes</label>
                  <input id="minutes" name="minutes" type="number" min="1" step="1" required className="a-input" />
                </div>
                <div className="a-field">
                  <label htmlFor="startedAt">Date</label>
                  <input id="startedAt" name="startedAt" type="date" className="a-input" defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
              </div>
              <div className="a-field">
                <label htmlFor="time-note">What did you work on?</label>
                <input id="time-note" name="note" className="a-input" placeholder="Design pass on the pricing page" />
              </div>
              <div className="a-form-row">
                <div className="a-field">
                  <label htmlFor="time-client">Client</label>
                  <select id="time-client" name="clientId" className="a-select" defaultValue="">
                    <option value="">No client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.company ?? c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="a-field">
                  <label htmlFor="time-project">Project</label>
                  <select id="time-project" name="projectId" className="a-select" defaultValue="">
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="a-check">
                <input type="checkbox" name="billable" defaultChecked />
                Billable
              </label>
              <button type="submit" className="a-btn a-btn--primary">Log time</button>
            </form>
          </div>
        </section>
      </div>

      <style>{`
        .cat-list { display: grid; gap: .55rem; font-size: .8rem; }
        .cat-list li { display: grid; grid-template-columns: 1fr auto 2.5rem; gap: .75rem; align-items: center; }
      `}</style>
    </>
  );
}
