import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHero from "@/components/site/PageHero";
import CTABand from "@/components/site/CTABand";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Notes on building websites, AI agents and automation for small businesses — what worked, what did not, and what it cost.",
  alternates: { canonical: "/journal" },
};

export default async function JournalPage() {
  const posts = await prisma.post.findMany({
    where: { state: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="Journal"
        title={
          <>
            Notes from
            <br />
            <em>the build.</em>
          </>
        }
        lede="Practical write-ups on the work: what we tried, what broke, what it cost. No thought-leadership."
      />

      <section className="section section--tight">
        <div className="wrap">
          {posts.length === 0 ? (
            <div style={{ maxWidth: "40rem" }}>
              <p className="eyebrow">Empty for now</p>
              <h2 className="display" style={{ fontSize: "var(--step-4)", marginTop: ".7rem" }}>
                First post is being written.
              </h2>
              <p className="lede" style={{ marginTop: "1rem" }}>
                The journal publishes when there is something worth saying. It
                will not be filled with AI-generated filler to look busy.
              </p>
              <Link href="/contact" className="btn btn--cobalt" style={{ marginTop: "1.5rem" }}>
                Talk to us instead
              </Link>
            </div>
          ) : (
            <>
              {lead && (
                <Link href={`/journal/${lead.slug}`} className="lead-post" data-cta="journal-lead">
                  <div className="lead-post-side">
                    <span className="eyebrow eyebrow--cobalt">Latest</span>
                    <span className="mono tiny muted">
                      {lead.publishedAt
                        ? new Date(lead.publishedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Draft"}
                    </span>
                  </div>
                  <div className="lead-post-main">
                    <h2 className="display lead-post-title">{lead.title}</h2>
                    <p className="lede" style={{ fontSize: "var(--step-1)" }}>
                      {lead.excerpt}
                    </p>
                    <span className="text-link small">
                      Read · {lead.readingMins} min <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <ul className="post-list">
                  {rest.map((p) => (
                    <li key={p.id}>
                      <Link href={`/journal/${p.slug}`} className="post-row">
                        <span className="post-main">
                          <span className="post-title">{p.title}</span>
                          <span className="post-excerpt">{p.excerpt}</span>
                        </span>
                        <span className="post-meta mono">
                          {p.publishedAt
                            ? new Date(p.publishedAt).toLocaleDateString("en-GB", {
                                month: "short",
                                year: "numeric",
                              })
                            : "Draft"}
                          <span aria-hidden="true"> · </span>
                          {p.readingMins} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <style>{`
          .lead-post {
            display: grid;
            grid-template-columns: 9rem minmax(0, 1fr);
            gap: var(--s-5);
            padding: var(--s-6) 0 var(--s-7);
            border-bottom: 1px solid var(--rule-strong);
            text-decoration: none;
          }
          .lead-post-side { display: grid; gap: .5rem; align-content: start; }
          .lead-post-main { display: grid; gap: var(--s-4); max-width: 52rem; }
          .lead-post-title { font-size: var(--step-4); letter-spacing: -.03em; }
          .lead-post:hover .lead-post-title { color: var(--cobalt); }

          .post-list { border-top: 0; }
          .post-list > li { border-bottom: 1px solid var(--rule); }
          .post-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: var(--s-4);
            align-items: baseline;
            padding: 1.3rem 0;
            text-decoration: none;
            transition: padding-left var(--dur) var(--ease), background var(--dur) var(--ease);
          }
          .post-row:hover { padding-left: .75rem; background: var(--paper-raised); }
          .post-main { display: grid; gap: .3rem; }
          .post-title { font-family: var(--font-display); font-size: var(--step-2); letter-spacing: -.02em; }
          .post-excerpt { font-size: var(--step--1); color: var(--ink-mute); max-width: 64ch; }
          .post-meta { font-size: var(--step--2); color: var(--ink-faint); white-space: nowrap; }

          @media (max-width: 700px) {
            .lead-post { grid-template-columns: 1fr; gap: var(--s-3); }
            .post-row { grid-template-columns: 1fr; gap: .4rem; }
          }
        `}</style>
      </section>

      <CTABand
        title="Want this in your inbox?"
        body="One email a month, only when there is a real lesson to share. The signup is in the footer."
        cta="Start a project"
        href="/contact"
      />
    </>
  );
}
