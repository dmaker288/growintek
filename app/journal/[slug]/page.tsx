import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import CTABand from "@/components/site/CTABand";
import JsonLd from "@/components/site/JsonLd";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { site } from "@/lib/site";
import {
  articleNode,
  graph,
  organizationNode,
  personNode,
  websiteNode,
} from "@/lib/schema";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "Post not found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDesc ?? post.excerpt.slice(0, 158),
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt.slice(0, 158),
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.state !== "PUBLISHED") notFound();

  const related = await prisma.post.findMany({
    where: { state: "PUBLISHED", slug: { not: post.slug }, tags: { hasSome: post.tags } },
    take: 2,
    orderBy: { publishedAt: "desc" },
  });

  const html = renderMarkdown(post.body);

  return (
    <>
      <JsonLd
        data={graph([
          organizationNode(),
          websiteNode(),
          personNode(),
          articleNode({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            published: post.publishedAt,
            modified: post.updatedAt,
            keywords: post.tags,
          }),
        ])}
      />

      <article>
        <header className="post-head">
          <div className="wrap wrap--narrow">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Journal", path: "/journal" },
                { name: post.tags[0] ?? "Note", path: `/journal/${post.slug}` },
              ]}
            />
            <h1 className="display post-title">{post.title}</h1>
            <p className="lede">{post.excerpt}</p>
            <div className="post-byline">
              <span className="mono tiny">
                By <Link href="/about" className="byline-link">Ijtiba Rana</Link>
              </span>
              <span className="mono tiny">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Draft"}
              </span>
              <span className="mono tiny">{post.readingMins} min read</span>
            </div>
          </div>

          <style>{`
            .post-head { padding-block: clamp(2rem, 5vw, 4rem) var(--s-6); border-bottom: 1px solid var(--rule); }
            .post-title { font-size: var(--step-5); letter-spacing: -.035em; }
            .post-head .lede { margin-top: var(--s-4); }
            .post-byline { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: var(--s-5); color: var(--ink-faint); text-transform: uppercase; letter-spacing: .06em; }
            .byline-link { color: var(--ink-soft); text-decoration: none; }
            .byline-link:hover { color: var(--cobalt); text-decoration: underline; }
          `}</style>
        </header>

        <div className="wrap wrap--narrow">
          <div className="prose post-body" dangerouslySetInnerHTML={{ __html: html }} />

          {post.tags.length > 0 && (
            <ul className="post-tags">
              {post.tags.map((t) => (
                <li key={t} className="chip">{t}</li>
              ))}
            </ul>
          )}
        </div>

        <style>{`
          .post-body { padding-block: var(--s-7); font-size: 1.05rem; line-height: 1.78; }
          .post-body p { max-width: 68ch; }
          .post-tags { display: flex; flex-wrap: wrap; gap: .4rem; padding-bottom: var(--s-8); }
        `}</style>
      </article>

      {related.length > 0 && (
        <section className="section section--raised section--border section--tight">
          <div className="wrap">
            <p className="eyebrow" style={{ marginBottom: "1.25rem" }}>Related</p>
            <div className="related-grid">
              {related.map((r) => (
                <Link key={r.id} href={`/journal/${r.slug}`} className="related-card">
                  <span className="mono tiny muted">
                    {r.publishedAt
                      ? new Date(r.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                      : "Draft"}
                  </span>
                  <span className="related-title">{r.title}</span>
                  <span className="small muted">{r.excerpt}</span>
                </Link>
              ))}
            </div>
          </div>
          <style>{`
            .related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-4); }
            .related-card {
              display: grid;
              gap: .4rem;
              padding: var(--s-5);
              border: 1px solid var(--rule);
              border-radius: var(--radius-lg);
              background: var(--paper);
              text-decoration: none;
              transition: border-color var(--dur) var(--ease);
            }
            .related-card:hover { border-color: var(--cobalt); }
            .related-title { font-family: var(--font-display); font-size: var(--step-1); }
            @media (max-width: 700px) { .related-grid { grid-template-columns: 1fr; } }
          `}</style>
        </section>
      )}

      <CTABand
        title="Working on something similar?"
        body="If a post here described your problem, the intro call is the shortest route to a plan."
        cta="Book an intro call"
        href="/contact"
        secondary="Read more"
        secondaryHref="/journal"
      />
    </>
  );
}
