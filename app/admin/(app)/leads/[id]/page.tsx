import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateLeadStatus, convertLeadToClient } from "@/lib/actions/crm";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/leads" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All leads
          </Link>
          <h1 className="page-title">{lead.name}</h1>
          <p className="page-sub">
            {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="page-actions">
          {lead.email && (
            <a href={`mailto:${lead.email}?subject=Re: your enquiry`} className="a-btn a-btn--primary">
              Reply by email
            </a>
          )}
          {!lead.convertedClientId ? (
            <form action={convertLeadToClient}>
              <input type="hidden" name="id" value={lead.id} />
              <button type="submit" className="a-btn">Convert to client</button>
            </form>
          ) : (
            <Link href={`/admin/clients/${lead.convertedClientId}`} className="a-btn">
              Open client record
            </Link>
          )}
        </div>
      </header>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">What they wrote</h2>
            <span className="pill pill--grey">
              {lead.createdAt.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="panel-body">
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: ".9rem" }}>
              {lead.message}
            </p>
          </div>
          <div className="panel-foot">
            Consent recorded at submission · Source: {lead.source.toLowerCase()}
            {lead.sourceDetail ? ` · ${lead.sourceDetail}` : ""}
          </div>
        </section>

        <aside className="stack-lg">
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Details</h2>
            </div>
            <div className="panel-body">
              <dl className="kv">
                <div><dt>Budget</dt><dd>{lead.budget ?? "—"}</dd></div>
                <div><dt>Service</dt><dd>{lead.service ?? "—"}</dd></div>
                <div><dt>Country</dt><dd>{lead.country ?? "—"}</dd></div>
                <div><dt>Source</dt><dd>{lead.source.toLowerCase()}</dd></div>
                <div><dt>Status</dt><dd>{lead.status.toLowerCase()}</dd></div>
              </dl>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Move this lead</h2>
            </div>
            <div className="panel-body">
              <form action={updateLeadStatus} className="a-form">
                <input type="hidden" name="id" value={lead.id} />
                <div className="a-field">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue={lead.status} className="a-select">
                    <option value="NEW">New</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal sent</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <button type="submit" className="a-btn a-btn--primary">Update status</button>
              </form>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .kv { display: grid; gap: .6rem; font-size: .82rem; }
        .kv > div { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #efeadd; padding-bottom: .5rem; }
        .kv > div:last-child { border-bottom: 0; padding-bottom: 0; }
        .kv dt { color: #9a9684; }
        .kv dd { color: #17180f; font-weight: 500; text-align: right; }
      `}</style>
    </>
  );
}
