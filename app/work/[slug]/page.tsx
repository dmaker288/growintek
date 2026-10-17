import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import CTABand from "@/components/site/CTABand";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.project.findUnique({ where: { slug } });
  if (!p) return { title: "Case study not found" };
  return {
    title: p.name,
    description: p.summary.slice(0, 158),
    alternates: { canonical: `/work/${p.slug}` },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { service: true, cover: true },
  });

  if (!project || project.state !== "PUBLISHED") notFound();

  const metrics = (project.metrics as { label: string; value: string }[]) ?? [];

  const sections = [
    { key: "challenge", label: "The problem", body: project.challenge },
    { key: "approach", label: "What we built", body: project.approach },
    { key: "outcome", label: "What changed", body: project.outcome },
  ].filter((s) => s.body);

  return (
    <>
      <article>
        <header className="cs-head">
          <div className="wrap">
            <nav className="crumbs tiny mono" aria-label="Breadcrumb">
              <Link href="/work">Work</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{project.client}</span>
            </nav>
            <div className="cs-head-grid">
              <div>
                <p className="eyebrow eyebrow--cobalt">{project.sector}</p>
                <h1 className="display cs-title">{project.name}</h1>
                <p className="lede">{project.summary}</p>
              </div>
              <dl className="cs-facts">
                <div>
                  <dt>Client</dt>
                  <dd>{project.client}</dd>
                </div>
                {project.location && (
                  <div>
                    <dt>Location</dt>
                    <dd>{project.location}</dd>
                  </div>
                )}
                {project.service && (
                  <div>
                    <dt>Service</dt>
                    <dd>{project.service.name}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          <style>{`
            .cs-head { padding-block: clamp(2rem, 5vw, 4rem); border-bottom: 1px solid var(--rule); }
            .crumbs { display: flex; gap: .5rem; align-items: center; color: var(--ink-faint); margin-bottom: var(--s-5); text-transform: uppercase; letter-spacing: .08em; }
            .crumbs a { color: var(--ink-mute); text-decoration: none; }
            .cs-head-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, .7fr); gap: var(--s-7); align-items: end; }
            .cs-title { font-size: var(--step-5); letter-spacing: -.035em; margin-top: .5rem; }
            .cs-head .lede { margin-top: var(--s-4); }
            .cs-facts { display: grid; gap: .9rem; border-left: 1px solid var(--rule); padding-left: var(--s-5); }
            .cs-facts dt { font-family: var(--font-mono); font-size: var(--step--2); text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
            .cs-facts dd { font-size: var(--step--1); color: var(--ink-soft); }
            @media (max-width: 820px) {
              .cs-head-grid { grid-template-columns: 1fr; gap: var(--s-5); }
              .cs-facts { border-left: 0; padding-left: 0; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .75rem; border-top: 1px solid var(--rule); padding-top: var(--s-4); }
            }
          `}</style>
        </header>

        {metrics.length > 0 && (
          <section className="cs-metrics">
            <div className="wrap cs-metrics-grid">
              {metrics.map((m) => (
                <div key={m.label} className="cs-metric">
                  <span className="cs-metric-value">{m.value}</span>
                  <span className="cs-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
            <style>{`
              .cs-metrics { border-bottom: 1px solid var(--rule); background: var(--paper-raised); }
              .cs-metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
                gap: 1px;
                background: var(--rule);
              }
              .cs-metric { background: var(--paper-raised); padding: var(--s-5) var(--s-5); display: grid; gap: .25rem; }
              .cs-metric-value { font-family: var(--font-display); font-size: var(--step-4); letter-spacing: -.03em; color: var(--cobalt); }
              .cs-metric-label { font-size: var(--step--2); color: var(--ink-mute); text-transform: uppercase; letter-spacing: .06em; font-family: var(--font-mono); }
            `}</style>
          </section>
        )}

        <section className="section">
          <div className="wrap cs-body">
            {sections.map((s) => (
              <div key={s.key} className="cs-section">
                <h2 className="cs-section-title">{s.label}</h2>
                <div className="prose">
                  {s.body!.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <style>{`
            .cs-body { display: grid; gap: var(--s-7); max-width: 46rem; }
            .cs-section { display: grid; gap: var(--s-4); }
            .cs-section + .cs-section { border-top: 1px solid var(--rule); padding-top: var(--s-6); }
            .cs-section-title { font-family: var(--font-display); font-size: var(--step-2); letter-spacing: -.02em; }
          `}</style>
        </section>
      </article>

      <CTABand
        title="A similar problem?"
        body="If this sounds like what is happening in your business, the intro call is the fastest way to find out what it would take."
        cta="Book an intro call"
        href="/contact"
        secondary="More work"
        secondaryHref="/work"
      />
    </>
  );
}
