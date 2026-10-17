import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import CTABand from "@/components/site/CTABand";
import JsonLd from "@/components/site/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { graph, organizationNode, personNode, serviceNode, websiteNode } from "@/lib/schema";

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug } });
  if (!service) return { title: "Service not found" };
  return {
    title: service.name,
    description: service.summary.slice(0, 158),
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.name, description: service.summary.slice(0, 158) },
  };
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug },
    include: {
      projects: {
        where: { state: "PUBLISHED" },
        take: 2,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!service || service.state === "ARCHIVED") notFound();

  return (
    <>
      <JsonLd
        data={graph([
          organizationNode(),
          websiteNode(),
          serviceNode({
            name: service.name,
            description: service.summary,
            slug: service.slug,
            fromPrice: service.fromPrice,
            currency: service.currency,
          }),
          personNode(),
        ])}
      />

      <section className="svc-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Services", path: "/services" },
              { name: service.name, path: `/services/${service.slug}` },
            ]}
          />
          <h1 className="display svc-hero-title">{service.name}</h1>
          <p className="svc-hero-tagline">{service.tagline}</p>
          <p className="lede">{service.summary}</p>
          <div className="svc-hero-actions">
            <Link href="/contact" className="btn btn--cobalt" data-cta={`svc-${service.slug}-book`}>
              Discuss this scope
            </Link>
            <Link href="/pricing" className="btn btn--ghost">
              See pricing
            </Link>
          </div>
        </div>

        <style>{`
          .svc-hero {
            padding-block: clamp(2rem, 5vw, 4rem);
            border-bottom: 1px solid var(--rule);
            background: radial-gradient(52rem 26rem at 88% -10%, rgba(27,44,224,.06), transparent 60%);
          }
          .crumbs { display: flex; gap: .5rem; align-items: center; color: var(--ink-faint); margin-bottom: var(--s-5); text-transform: uppercase; letter-spacing: .08em; }
          .crumbs a { color: var(--ink-mute); text-decoration: none; }
          .crumbs a:hover { color: var(--cobalt); }
          .svc-hero-title { font-size: var(--step-6); letter-spacing: -.04em; }
          .svc-hero-tagline { font-family: var(--font-display); font-size: var(--step-2); font-style: italic; color: var(--cobalt); margin-top: .5rem; }
          .svc-hero .lede { margin-top: var(--s-4); }
          .svc-hero-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: var(--s-5); }
        `}</style>
      </section>

      <section className="section section--tight">
        <div className="wrap detail-grid">
          <div className="detail-main">
            <h2 className="detail-h2">What you get</h2>
            <ul className="deliverables">
              {service.deliverables.map((d, i) => (
                <li key={d}>
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <h2 className="detail-h2">What changes</h2>
            <div className="outcome-grid">
              {service.outcomes.map((o) => (
                <div key={o} className="outcome">
                  <span className="outcome-tick" aria-hidden="true">✓</span>
                  <p>{o}</p>
                </div>
              ))}
            </div>

            {service.projects.length > 0 && (
              <>
                <h2 className="detail-h2">Work like this</h2>
                <div className="mini-work">
                  {service.projects.map((p) => (
                    <Link key={p.id} href={`/work/${p.slug}`} className="mini-work-card">
                      <span className="mono tiny muted">{p.sector}</span>
                      <span className="mini-work-name">{p.name}</span>
                      <span className="small muted">{p.summary}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="detail-side">
            <div className="side-card">
              <p className="eyebrow">At a glance</p>
              <dl className="side-list">
                <div>
                  <dt>Typical timeline</dt>
                  <dd>{timelineFor(service.slug)}</dd>
                </div>
                <div>
                  <dt>Who it suits</dt>
                  <dd>{audienceFor(service.slug)}</dd>
                </div>
                <div>
                  <dt>Ownership</dt>
                  <dd>Code, content and accounts in your name</dd>
                </div>
                <div>
                  <dt>Ongoing</dt>
                  <dd>Optional care plan from £95/mo</dd>
                </div>
              </dl>
              <Link href="/contact" className="btn btn--sm side-btn" data-cta={`svc-${service.slug}-side`}>
                Start a conversation
              </Link>
            </div>
          </aside>
        </div>

        <style>{`
          .detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: var(--s-8); align-items: start; }
          .detail-main { display: grid; gap: var(--s-5); }
          .detail-h2 { font-family: var(--font-display); font-size: var(--step-3); margin-top: var(--s-4); }
          .deliverables { border-top: 1px solid var(--rule-strong); }
          .deliverables li {
            display: grid;
            grid-template-columns: 3rem 1fr;
            gap: var(--s-3);
            padding: .9rem 0;
            border-bottom: 1px solid var(--rule);
            font-size: var(--step-0);
            color: var(--ink-soft);
          }
          .deliverables .mono { font-size: var(--step--2); color: var(--ink-faint); padding-top: .22rem; }
          .outcome-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
          .outcome { display: flex; gap: .6rem; align-items: flex-start; padding: .85rem; background: var(--paper-raised); border: 1px solid var(--rule); border-radius: var(--radius); }
          .outcome-tick { color: #4d7a3a; font-size: .85rem; line-height: 1.5; }
          .outcome p { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.5; }
          .mini-work { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-4); }
          .mini-work-card {
            display: grid;
            gap: .35rem;
            padding: var(--s-4);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
            text-decoration: none;
            transition: border-color var(--dur) var(--ease);
          }
          .mini-work-card:hover { border-color: var(--cobalt); }
          .mini-work-name { font-family: var(--font-display); font-size: var(--step-1); }

          .side-card {
            position: sticky;
            top: calc(var(--header-h) + 1.5rem);
            display: grid;
            gap: var(--s-4);
            padding: var(--s-5);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
          }
          .side-list { display: grid; gap: .85rem; }
          .side-list > div { display: grid; gap: .15rem; padding-bottom: .85rem; border-bottom: 1px solid var(--rule); }
          .side-list > div:last-child { border-bottom: 0; padding-bottom: 0; }
          .side-list dt { font-family: var(--font-mono); font-size: var(--step--2); text-transform: uppercase; letter-spacing: .08em; color: var(--ink-faint); }
          .side-list dd { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.45; }
          .side-btn { justify-content: center; }

          @media (max-width: 960px) {
            .detail-grid { grid-template-columns: 1fr; gap: var(--s-6); }
            .side-card { position: static; }
          }
          @media (max-width: 620px) {
            .outcome-grid, .mini-work { grid-template-columns: 1fr; }
          }
        `}</style>
      </section>

      <CTABand
        title="Get a fixed quote, not a range."
        body="Send three sentences about the project. You get a written scope and price within two working days, or an honest referral if it is not our work."
        cta="Request a quote"
        href="/start"
        secondary="See pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}

function timelineFor(slug: string): string {
  switch (slug) {
    case "websites":
      return "2–4 weeks from content received";
    case "ai-agents":
      return "10–15 working days to pilot";
    case "automation":
      return "1–3 weeks depending on systems";
    case "it-support":
      return "Setup in 2–5 days, then ongoing";
    default:
      return "Discussed on the call";
  }
}

function audienceFor(slug: string): string {
  switch (slug) {
    case "websites":
      return "Businesses with a working offer and a weak site";
    case "ai-agents":
      return "Teams losing enquiries outside office hours";
    case "automation":
      return "Anyone re-typing the same data into three tools";
    case "it-support":
      return "Small teams without an in-house IT person";
    default:
      return "SMBs in the UK, Australia and Ireland";
  }
}
