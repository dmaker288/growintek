import Link from "next/link";
import { prisma } from "@/lib/db";
import { toggleProjectState } from "@/lib/actions/content";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function WorkAdminPage() {
  const projects = await prisma.project.findMany({
    where: { type: "CASE_STUDY" },
    orderBy: { createdAt: "desc" },
    include: { service: { select: { name: true } } },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Case studies</h1>
          <p className="page-sub">
            Hidden until published. The seeded entries are placeholders — replace them
            with real engagements before going live.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/content/work/new" className="a-btn a-btn--primary">New case study</Link>
        </div>
      </header>

      <section className="panel">
        {projects.length === 0 ? (
          <div className="empty">
            <strong>No case studies</strong>
            <span>Write one up when a client agrees to the numbers.</span>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>State</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/content/work/${p.id}`} className="a-link">{p.name}</Link>
                      {p.featured && <span className="pill pill--amber" style={{ marginLeft: ".4rem" }}>featured</span>}
                    </td>
                    <td className="dim">{p.client}</td>
                    <td className="dim">{p.service?.name ?? "—"}</td>
                    <td><StatusPill status={p.state} /></td>
                    <td className="actions">
                      <div className="row-actions">
                        {p.state === "PUBLISHED" && (
                          <Link href={`/work/${p.slug}`} target="_blank" className="a-btn a-btn--sm a-btn--ghost">View</Link>
                        )}
                        <form action={toggleProjectState}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="a-btn a-btn--sm">
                            {p.state === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`.row-actions { display: flex; gap: .3rem; justify-content: flex-end; flex-wrap: wrap; }`}</style>
    </>
  );
}
