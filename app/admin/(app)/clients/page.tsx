import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    include: {
      invoices: { select: { totalMinor: true, amountPaidMinor: true, status: true, currency: true } },
      clientProjects: { select: { id: true, status: true } },
    },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub">
            Billing details, projects and the money owed on each account.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/clients/new" className="a-btn a-btn--primary">New client</Link>
        </div>
      </header>

      <section className="panel">
        {clients.length === 0 ? (
          <div className="empty">
            <strong>No clients yet</strong>
            <span>Convert a lead, or add a client manually to start invoicing.</span>
            <div style={{ marginTop: ".6rem" }}>
              <Link href="/admin/clients/new" className="a-btn a-btn--sm">Add a client</Link>
            </div>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th className="num">Projects</th>
                  <th className="num">Invoiced</th>
                  <th className="num">Outstanding</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const invoiced = c.invoices
                    .filter((i) => i.status !== "VOID" && i.status !== "DRAFT")
                    .reduce((s, i) => s + i.totalMinor, 0);
                  const outstanding = c.invoices
                    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
                    .reduce((s, i) => s + (i.totalMinor - i.amountPaidMinor), 0);
                  const active = c.clientProjects.filter(
                    (p) => p.status === "IN_PROGRESS" || p.status === "PLANNING" || p.status === "REVIEW"
                  ).length;

                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/admin/clients/${c.id}`} className="a-link">
                          {c.company ?? c.name}
                        </Link>
                        {c.company && <div className="dim" style={{ fontSize: ".72rem" }}>{c.name}</div>}
                      </td>
                      <td className="dim">{c.email ?? "—"}</td>
                      <td className="num">{active > 0 ? `${active} active` : "—"}</td>
                      <td className="num">{invoiced ? formatMinor(invoiced, c.currency) : "—"}</td>
                      <td className="num" style={outstanding > 0 ? { color: "#96331f" } : undefined}>
                        {outstanding ? formatMinor(outstanding, c.currency) : "—"}
                      </td>
                      <td className="actions">
                        <Link href={`/admin/invoices/new?client=${c.id}`} className="a-btn a-btn--sm">
                          Invoice
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
