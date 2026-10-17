import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";
import { deleteService } from "@/lib/actions/content";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const services = await prisma.service.findMany({ orderBy: { order: "asc" } });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-sub">
            Each service has its own page. Archiving hides it without breaking existing links.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/content/services/new" className="a-btn a-btn--primary">New service</Link>
        </div>
      </header>

      <section className="panel">
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Slug</th>
                <th>State</th>
                <th className="num">From</th>
                <th className="num">Order</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/admin/content/services/${s.id}`} className="a-link">{s.name}</Link></td>
                  <td className="dim mono-num" style={{ fontSize: ".74rem" }}>/services/{s.slug}</td>
                  <td><StatusPill status={s.state} /></td>
                  <td className="num">{s.fromPrice ? formatMinor(s.fromPrice, "GBP") : "—"}</td>
                  <td className="num dim">{s.order}</td>
                  <td className="actions">
                    <div className="row-actions">
                      {s.state === "PUBLISHED" && (
                        <Link href={`/services/${s.slug}`} target="_blank" className="a-btn a-btn--sm a-btn--ghost">View</Link>
                      )}
                      <Link href={`/admin/content/services/${s.id}`} className="a-btn a-btn--sm">Edit</Link>
                      {s.state !== "ARCHIVED" && (
                        <form action={deleteService}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="a-btn a-btn--sm a-btn--danger">Archive</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.row-actions { display: flex; gap: .3rem; justify-content: flex-end; flex-wrap: wrap; }`}</style>
    </>
  );
}
