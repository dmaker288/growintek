import { prisma } from "@/lib/db";
import { deleteTestimonial } from "@/lib/actions/content";
import TestimonialForm from "@/components/admin/TestimonialForm";
import Stars from "@/components/site/Stars";

export const dynamic = "force-dynamic";

export default async function TestimonialsAdminPage() {
  const [testimonials, liveReviews] = await Promise.all([
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { reviewedAt: "desc" }, take: 8 }),
  ]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-sub">
            Quotes you collect directly. Platform reviews live in Integrations and are
            pulled by API — they are never typed in here.
          </p>
        </div>
      </header>

      <div className="stack-lg">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Collected quotes</h2>
            <span className="dim" style={{ fontSize: ".72rem" }}>
              {testimonials.filter((t) => t.approved).length} visible ·{" "}
              {testimonials.filter((t) => !t.approved).length} awaiting approval
            </span>
          </div>
          {testimonials.length === 0 ? (
            <div className="empty">
              <strong>No testimonials yet</strong>
              <span>
                The seeded placeholder stays hidden until approved. Paste a real
                client quote and tick “Approved” when they have agreed to it.
              </span>
            </div>
          ) : (
            <ul className="t-list">
              {testimonials.map((t) => (
                <li key={t.id} className="t-item">
                  <div className="t-head">
                    <Stars rating={t.rating} />
                    <span className={`pill ${t.approved ? "pill--green" : "pill--amber"}`}>
                      {t.approved ? "approved" : "not approved"}
                    </span>
                    {t.featured && <span className="pill pill--blue">featured</span>}
                  </div>
                  <blockquote>“{t.quote}”</blockquote>
                  <div className="t-foot">
                    <span className="dim">
                      {t.name}
                      {t.role ? `, ${t.role}` : ""}
                      {t.company ? ` · ${t.company}` : ""}
                    </span>
                    <form action={deleteTestimonial}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="a-btn a-btn--sm a-btn--danger">Delete</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <TestimonialForm />

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">From platform APIs</h2>
            <span className="dim" style={{ fontSize: ".72rem" }}>read-only · last 8</span>
          </div>
          {liveReviews.length === 0 ? (
            <div className="empty">
              <span>No synced reviews. Add credentials in Integrations, then run a sync.</span>
            </div>
          ) : (
            <ul className="t-list">
              {liveReviews.map((r) => (
                <li key={r.id} className="t-item">
                  <div className="t-head">
                    <Stars rating={r.rating} />
                    <span className="pill pill--grey">{r.platform.toLowerCase()}</span>
                  </div>
                  <blockquote>“{r.text}”</blockquote>
                  <div className="t-foot">
                    <span className="dim">{r.authorName}</span>
                    <span className="dim tiny">
                      {r.reviewedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <style>{`
        .t-list { display: grid; }
        .t-item { display: grid; gap: .5rem; padding: 1rem 1.1rem; border-bottom: 1px solid #efeadd; }
        .t-item:last-child { border-bottom: 0; }
        .t-head { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .t-item blockquote { font-size: .86rem; line-height: 1.6; color: #3d3c31; }
        .t-foot { display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: .78rem; }
        .tiny { font-size: .7rem; }
      `}</style>
    </>
  );
}
