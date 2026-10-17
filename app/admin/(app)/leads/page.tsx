import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateLeadStatus } from "@/lib/actions/crm";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "NEW", label: "New" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status ?? "all";

  const leads = await prisma.lead.findMany({
    where: active === "all" ? {} : { status: active as "NEW" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = await prisma.lead.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const total = counts.reduce((s, c) => s + c._count._all, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-sub">
            Every enquiry from the site, newest first. Change status without leaving the list.
          </p>
        </div>
        <div className="page-actions">
          <span className="pill pill--blue">{countMap.NEW ?? 0} new</span>
          <span className="pill pill--grey">{total} total</span>
        </div>
      </header>

      <nav className="tabs" aria-label="Filter leads">
        {FILTERS.map((f) => {
          const count = f.key === "all" ? total : (countMap[f.key] ?? 0);
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/leads" : `/admin/leads?status=${f.key}`}
              className={`tab ${active === f.key ? "tab--on" : ""}`}
            >
              {f.label} <span className="dim">{count}</span>
            </Link>
          );
        })}
      </nav>

      <section className="panel">
        {leads.length === 0 ? (
          <div className="empty">
            <strong>Nothing here</strong>
            <span>
              {active === "all"
                ? "Enquiries from the contact form will appear here."
                : "No leads with that status yet."}
            </span>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Business</th>
                  <th>Wants</th>
                  <th>Budget</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th className="actions">Move to</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/admin/leads/${l.id}`} className="a-link">{l.name}</Link>
                      {l.email && <div className="dim" style={{ fontSize: ".72rem" }}>{l.email}</div>}
                    </td>
                    <td className="dim">{l.company ?? "—"}</td>
                    <td className="dim">{l.service ?? "—"}</td>
                    <td className="dim">{l.budget ?? "—"}</td>
                    <td className="num dim">
                      {l.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td><LeadPill status={l.status} /></td>
                    <td className="actions">
                      <form action={updateLeadStatus} className="inline-form">
                        <input type="hidden" name="id" value={l.id} />
                        <select name="status" defaultValue={l.status} className="a-select a-select--xs">
                          <option value="NEW">New</option>
                          <option value="QUALIFIED">Qualified</option>
                          <option value="PROPOSAL">Proposal</option>
                          <option value="WON">Won</option>
                          <option value="LOST">Lost</option>
                        </select>
                        <button type="submit" className="a-btn a-btn--sm">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .inline-form { display: flex; gap: .3rem; justify-content: flex-end; align-items: center; }
        .a-select--xs { min-height: 28px; padding: .15em .35em; font-size: .74rem; width: auto; }
      `}</style>
    </>
  );
}

function LeadPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    NEW: "pill--blue",
    QUALIFIED: "pill--green",
    PROPOSAL: "pill--amber",
    WON: "pill--green",
    LOST: "pill--grey",
  };
  return <span className={`pill ${map[status] ?? "pill--grey"}`}>{status.toLowerCase()}</span>;
}
