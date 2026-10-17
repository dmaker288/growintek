import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies: websites and AI systems built for UK and Australian small businesses, with the numbers behind them.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const projects = await prisma.project.findMany({
    where: { state: "PUBLISHED", type: "CASE_STUDY" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { service: true, cover: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Work"
        title={
          <>
            Built, launched,
            <br />
            <em>measured.</em>
          </>
        }
        lede="A case study is only useful if it says what changed. Every entry here names the starting problem, what we built, and the number we watched afterwards."
      />

      <section className="section section--tight">
        <div className="wrap">
          {projects.length === 0 ? (
            <div className="empty-state">
              <p className="eyebrow">Case studies coming</p>
              <h2 className="display" style={{ fontSize: "var(--step-4)", marginTop: ".75rem" }}>
                We publish numbers, not logos.
              </h2>
              <p className="lede" style={{ marginTop: "1rem" }}>
                Client work is being written up now. In the meantime, the intro
                call includes a walkthrough of comparable builds and what they
                measured.
              </p>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                <Link href="/contact" className="btn btn--cobalt" data-cta="work-empty-book">
                  Book the walkthrough
                </Link>
                <Link href="/pricing" className="btn btn--ghost">See pricing</Link>
              </div>
            </div>
          ) : (
            <div className="work-list">
              {projects.map((p, i) => {
                const metrics = (p.metrics as { label: string; value: string }[]) ?? [];
                return (
                  <article key={p.id} className="work-item">
                    <div className="work-item-side">
                      <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                      <span className="tiny muted">{p.sector}</span>
                      {p.location && <span className="tiny muted">{p.location}</span>}
                    </div>
                    <div className="work-item-main">
                      <h2 className="work-item-title">
                        <Link href={`/work/${p.slug}`}>{p.name}</Link>
                      </h2>
                      <p className="work-item-client mono tiny">{p.client}</p>
                      <p className="work-item-summary">{p.summary}</p>
                      {metrics.length > 0 && (
                        <dl className="work-item-metrics">
                          {metrics.slice(0, 4).map((m) => (
                            <div key={m.label}>
                              <dt>{m.label}</dt>
                              <dd>{m.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <Link href={`/work/${p.slug}`} className="text-link small">
                        Read the case study <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <style>{`
          .work-list { border-top: 1px solid var(--rule-strong); }
          .work-item {
            display: grid;
            grid-template-columns: 8rem minmax(0, 1fr);
            gap: var(--s-5);
            padding: clamp(1.75rem, 4vw, 3rem) 0;
            border-bottom: 1px solid var(--rule);
          }
          .work-item-side { display: grid; gap: .35rem; align-content: start; }
          .work-item-side .mono { color: var(--cobalt); font-size: var(--step--2); margin-bottom: .3rem; }
          .work-item-main { display: grid; gap: .7rem; max-width: 56rem; }
          .work-item-title { font-family: var(--font-display); font-size: var(--step-4); letter-spacing: -.03em; }
          .work-item-title a { text-decoration: none; }
          .work-item-title a:hover { color: var(--cobalt); }
          .work-item-client { text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
          .work-item-summary { color: var(--ink-mute); font-size: var(--step--1); line-height: 1.65; }
          .work-item-metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem 2.5rem;
            padding: 1rem 0;
            border-top: 1px solid var(--rule);
            border-bottom: 1px solid var(--rule);
            margin: .3rem 0 .4rem;
          }
          .work-item-metrics div { display: grid; gap: .1rem; }
          .work-item-metrics dt { font-size: var(--step--2); color: var(--ink-mute); }
          .work-item-metrics dd { font-family: var(--font-mono); font-size: var(--step-1); font-weight: 500; }

          .empty-state { max-width: 40rem; padding-block: var(--s-6); }

          @media (max-width: 700px) {
            .work-item { grid-template-columns: 1fr; gap: .9rem; }
            .work-item-side { grid-auto-flow: column; justify-content: start; gap: .75rem; align-items: center; }
            .work-item-side .mono { margin-bottom: 0; }
          }
        `}</style>
      </section>

      <CTABand
        title="Your project could be the next one written up."
        body="We take two builds a month, and we only publish a case study when the client agrees to the numbers."
        cta="Book an intro call"
        href="/contact"
      />
    </>
  );
}
