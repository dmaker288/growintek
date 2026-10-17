import Link from "next/link";
import { prisma } from "@/lib/db";
import ProjectForm from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true, currency: true },
  });

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/projects" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All projects
          </Link>
          <h1 className="page-title">New project</h1>
          <p className="page-sub">
            Scope notes are internal. Keep them specific enough that future-you
            remembers what was agreed.
          </p>
        </div>
      </header>

      <div style={{ maxWidth: "54rem" }}>
        {clients.length === 0 ? (
          <section className="panel">
            <div className="empty">
              <strong>Add a client first</strong>
              <span>Every project belongs to a client record.</span>
              <div style={{ marginTop: ".6rem" }}>
                <Link href="/admin/clients/new" className="a-btn a-btn--sm a-btn--primary">New client</Link>
              </div>
            </div>
          </section>
        ) : (
          <ProjectForm clients={clients} defaultClientId={client} />
        )}
      </div>
    </>
  );
}
