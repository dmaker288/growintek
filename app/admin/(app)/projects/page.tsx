import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor, formatDate } from "@/lib/money";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.clientProject.findMany({
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count: { select: { tasks: true } },
      tasks: { where: { done: false }, select: { id: true } },
    },
  });

  const active = projects.filter((p) => ["PLANNING", "IN_PROGRESS", "REVIEW"].includes(p.status));
  const done = projects.filter((p) => ["LAUNCHED", "CLOSED"].includes(p.status));

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">
            Client delivery work. Tasks are per project; budgets feed the finance report.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/projects/new" className="a-btn a-btn--primary">New project</Link>
        </div>
      </header>

      {active.length === 0 && done.length === 0 ? (
        <section className="panel">
          <div className="empty">
            <strong>No projects yet</strong>
            <span>Projects live on a client. Add a client first, then a project.</span>
            <div style={{ marginTop: ".6rem", display: "flex", gap: ".5rem", justifyContent: "center" }}>
              <Link href="/admin/clients/new" className="a-btn a-btn--sm">Add a client</Link>
              <Link href="/admin/projects/new" className="a-btn a-btn--sm">New project</Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="stack-lg">
          {[
            { title: "Active", rows: active },
            { title: "Delivered", rows: done },
          ].map((group) =>
            group.rows.length > 0 ? (
              <section className="panel" key={group.title}>
                <div className="panel-head">
                  <h2 className="panel-title">{group.title} <span className="dim">· {group.rows.length}</span></h2>
                </div>
                <div className="a-table-wrap">
                  <table className="a-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th className="num">Tasks open</th>
                        <th className="num">Budget</th>
                        <th className="num">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((p) => (
                        <tr key={p.id}>
                          <td><Link href={`/admin/projects/${p.id}`} className="a-link">{p.name}</Link></td>
                          <td>
                            <Link href={`/admin/clients/${p.client.id}`} className="a-link" style={{ fontWeight: 400 }}>
                              {p.client.company ?? p.client.name}
                            </Link>
                          </td>
                          <td><StatusPill status={p.status} /></td>
                          <td className="num">{p.tasks.length}</td>
                          <td className="num">{p.budgetMinor ? formatMinor(p.budgetMinor, p.currency) : "—"}</td>
                          <td className="num dim">{formatDate(p.dueAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null
          )}
        </div>
      )}
    </>
  );
}
