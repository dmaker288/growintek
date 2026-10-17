import Link from "next/link";
import { prisma } from "@/lib/db";
import CaseStudyForm from "@/components/admin/CaseStudyForm";

export const dynamic = "force-dynamic";

export default async function CaseStudyEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const services = await prisma.service.findMany({
    select: { id: true, name: true },
    orderBy: { order: "asc" },
  });

  if (id === "new") {
    return (
      <>
        <header className="page-head">
          <div>
            <Link href="/admin/content/work" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
              ← All case studies
            </Link>
            <h1 className="page-title">New case study</h1>
          </div>
        </header>
        <div style={{ maxWidth: "52rem" }}>
          <CaseStudyForm services={services} />
        </div>
      </>
    );
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return (
      <div className="empty">
        <strong>Not found</strong>
        <Link href="/admin/content/work" className="a-link">Back to case studies</Link>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/content/work" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All case studies
          </Link>
          <h1 className="page-title">{project.name}</h1>
        </div>
        {project.state === "PUBLISHED" && (
          <div className="page-actions">
            <Link href={`/work/${project.slug}`} target="_blank" className="a-btn">View live ↗</Link>
          </div>
        )}
      </header>
      <div style={{ maxWidth: "52rem" }}>
        <CaseStudyForm
          services={services}
          project={{
            id: project.id,
            slug: project.slug,
            name: project.name,
            client: project.client,
            sector: project.sector,
            location: project.location,
            summary: project.summary,
            challenge: project.challenge,
            approach: project.approach,
            outcome: project.outcome,
            metrics: (project.metrics as { label: string; value: string }[]) ?? [],
            serviceId: project.serviceId,
            featured: project.featured,
            state: project.state,
          }}
        />
      </div>
    </>
  );
}
