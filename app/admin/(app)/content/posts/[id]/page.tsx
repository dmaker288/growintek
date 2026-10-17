import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PostEditor from "@/components/admin/PostEditor";
import { togglePostState } from "@/lib/actions/content";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/content/posts" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All posts
          </Link>
          <h1 className="page-title">{post.title}</h1>
          <p className="page-sub">
            <StatusPill status={post.state} />
            <span style={{ marginLeft: ".5rem" }}>
              Last edited {post.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </p>
        </div>
        <div className="page-actions">
          {post.state === "PUBLISHED" && (
            <Link href={`/journal/${post.slug}`} target="_blank" className="a-btn">View live ↗</Link>
          )}
          <form action={togglePostState}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="a-btn">
              {post.state === "PUBLISHED" ? "Unpublish" : "Publish"}
            </button>
          </form>
        </div>
      </header>
      <div style={{ maxWidth: "56rem" }}>
        <PostEditor
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            body: post.body,
            tags: post.tags,
            seoTitle: post.seoTitle,
            seoDesc: post.seoDesc,
          }}
        />
      </div>
    </>
  );
}
