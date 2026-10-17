import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate } from "@/lib/money";
import { archiveClient } from "@/lib/actions/crm";
import ClientForm from "@/components/admin/ClientForm";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      clientProjects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!client) notFound();

  const paid = client.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.totalMinor, 0);
  const outstanding = client.invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((s, i) => s + (i.totalMinor - i.amountPaidMinor), 0);

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/clients" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All clients
          </Link>
          <h1 className="page-title">{client.company ?? client.name}</h1>
          <p className="page-sub">
            {[client.name, client.email, client.phone, client.country].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="page-actions">
          <Link href={`/admin/invoices/new?client=${client.id}`} className="a-btn a-btn--primary">
            New invoice
          </Link>
          <Link href={`/admin/projects/new?client=${client.id}`} className="a-btn">New project</Link>
          <form action={archiveClient}>
            <input type="hidden" name="id" value={client.id} />
            <button type="submit" className="a-btn a-btn--ghost">
              {client.archived ? "Restore" : "Archive"}
            </button>
          </form>
        </div>
      </header>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Paid to date</span>
          <span className="kpi-value">{formatMinor(paid, client.currency)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Outstanding</span>
          <span className="kpi-value" style={outstanding > 0 ? { color: "#96331f" } : undefined}>
            {formatMinor(outstanding, client.currency)}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Active projects</span>
          <span className="kpi-value">
            {client.clientProjects.filter((p) => p.status !== "CLOSED").length}
          </span>
        </div>
      </div>

      <div className="stack-lg">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Projects</h2>
            <Link href={`/admin/projects/new?client=${client.id}`} className="a-btn a-btn--sm">Add</Link>
          </div>
          {client.clientProjects.length === 0 ? (
            <div className="empty">
              <strong>No projects yet</strong>
              <span>Create one to track scope, deadlines and tasks.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th className="num">Budget</th>
                    <th className="num">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {client.clientProjects.map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/admin/projects/${p.id}`} className="a-link">{p.name}</Link></td>
                      <td><StatusPill status={p.status} /></td>
                      <td className="num">{p.budgetMinor ? formatMinor(p.budgetMinor, p.currency) : "—"}</td>
                      <td className="num dim">{formatDate(p.dueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Invoices</h2>
            <Link href={`/admin/invoices/new?client=${client.id}`} className="a-btn a-btn--sm">New</Link>
          </div>
          {client.invoices.length === 0 ? (
            <div className="empty">
              <strong>Nothing invoiced yet</strong>
              <span>Drafts stay private until you issue a number.</span>
            </div>
          ) : (
            <div className="a-table-wrap">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                    <th className="num">Issued</th>
                    <th className="num">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <Link href={`/admin/invoices/${i.id}`} className="a-link mono-num">
                          {i.number ?? "Draft"}
                        </Link>
                      </td>
                      <td><StatusPill status={i.status} /></td>
                      <td className="num">{formatMinor(i.totalMinor, i.currency)}</td>
                      <td className="num dim">{formatDate(i.issuedAt)}</td>
                      <td className="num dim">{formatDate(i.dueAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ClientForm client={client} />
      </div>
    </>
  );
}
