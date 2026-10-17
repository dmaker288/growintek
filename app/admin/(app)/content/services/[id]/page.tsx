import Link from "next/link";
import { prisma } from "@/lib/db";
import ServiceForm from "@/components/admin/ServiceForm";

export const dynamic = "force-dynamic";

export default async function ServiceEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") {
    return (
      <>
        <header className="page-head">
          <div>
            <Link href="/admin/content/services" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
              ← All services
            </Link>
            <h1 className="page-title">New service</h1>
          </div>
        </header>
        <div style={{ maxWidth: "52rem" }}>
          <ServiceForm />
        </div>
      </>
    );
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return (
      <div className="empty">
        <strong>Service not found</strong>
        <Link href="/admin/content/services" className="a-link">Back to services</Link>
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/content/services" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All services
          </Link>
          <h1 className="page-title">{service.name}</h1>
        </div>
        {service.state === "PUBLISHED" && (
          <div className="page-actions">
            <Link href={`/services/${service.slug}`} target="_blank" className="a-btn">View live ↗</Link>
          </div>
        )}
      </header>
      <div style={{ maxWidth: "52rem" }}>
        <ServiceForm
          service={{
            id: service.id,
            slug: service.slug,
            name: service.name,
            tagline: service.tagline,
            summary: service.summary,
            outcomes: service.outcomes,
            deliverables: service.deliverables,
            fromPrice: service.fromPrice,
            order: service.order,
            state: service.state,
          }}
        />
      </div>
    </>
  );
}
