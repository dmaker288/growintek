import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";
import CTABand from "@/components/site/CTABand";
import PageHero from "@/components/site/PageHero";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Website development, AI agents, business automation and IT support for small and mid-sized businesses in the UK, Australia and Europe.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { state: "PUBLISHED" },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Services"
        title={
          <>
            The site is the start.
            <br />
            <em>The system is the point.</em>
          </>
        }
        lede="Four services that fit together. Most clients start with one and add the rest when they see where the leakage is."
        aside={
          <div className="hero-aside">
            <p className="mono tiny">Not sure which?</p>
            <p className="small">
              Book the intro call. We will tell you which one you actually need,
              and which one you do not.
            </p>
            <Link href="/contact" className="btn btn--sm" data-cta="services-book">
              Book a call
            </Link>
          </div>
        }
      />

      <section className="section section--tight">
        <div className="wrap">
          {services.length === 0 ? (
            <p className="muted">
              Services are being updated. <Link href="/contact" className="text-link">Get in touch</Link> in the meantime.
            </p>
          ) : (
            <div className="svc-list">
              {services.map((s, i) => (
                <article key={s.id} className="svc-row">
                  <span className="mono svc-idx">{String(i + 1).padStart(2, "0")}</span>
                  <div className="svc-copy">
                    <h2 className="svc-heading">
                      <Link href={`/services/${s.slug}`}>{s.name}</Link>
                    </h2>
                    <p className="svc-tagline">{s.tagline}</p>
                    <p className="svc-summary">{s.summary}</p>
                    {s.outcomes.length > 0 && (
                      <ul className="svc-outcomes">
                        {s.outcomes.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    )}
                    <div className="svc-links">
                      <Link href={`/services/${s.slug}`} className="text-link small">
                        What is included <span aria-hidden="true">→</span>
                      </Link>
                      {s.fromPrice ? (
                        <span className="mono svc-price">
                          from {formatMinor(s.fromPrice, s.currency)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <style>{`
          .svc-list { border-top: 1px solid var(--rule-strong); }
          .svc-row {
            display: grid;
            grid-template-columns: 5rem minmax(0, 1fr);
            gap: var(--s-4);
            padding: clamp(1.75rem, 4vw, 3rem) 0;
            border-bottom: 1px solid var(--rule);
          }
          .svc-idx { color: var(--cobalt); font-size: var(--step--2); padding-top: .5rem; }
          .svc-copy { display: grid; gap: .7rem; max-width: 62rem; }
          .svc-heading { font-family: var(--font-display); font-size: var(--step-4); letter-spacing: -.03em; }
          .svc-heading a { text-decoration: none; }
          .svc-heading a:hover { color: var(--cobalt); }
          .svc-tagline { font-size: var(--step-1); color: var(--ink); max-width: 46ch; }
          .svc-summary { color: var(--ink-mute); font-size: var(--step--1); line-height: 1.65; max-width: 68ch; }
          .svc-outcomes { display: flex; flex-wrap: wrap; gap: .4rem .7rem; margin-top: .2rem; }
          .svc-outcomes li { font-size: var(--step--2); color: var(--ink-soft); border: 1px solid var(--rule); padding: .3em .65em; border-radius: var(--radius-pill); background: var(--paper-raised); }
          .svc-links { display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem; margin-top: .5rem; }
          .svc-price { font-size: var(--step--1); color: var(--ink-soft); }
          @media (max-width: 620px) {
            .svc-row { grid-template-columns: 1fr; gap: .75rem; }
            .svc-idx { padding-top: 0; }
          }
        `}</style>
      </section>

      <CTABand
        title="Start with the leak."
        body="If you are not sure whether you need a website, an agent or just a better form, the intro call answers it in twenty minutes."
        cta="Book the intro call"
        href="/contact"
      />
    </>
  );
}
