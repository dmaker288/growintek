import Link from "next/link";
import { prisma } from "@/lib/db";
import { togglePostState, deletePost } from "@/lib/actions/content";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Journal</h1>
          <p className="page-sub">
            Long-form posts. Drafts are invisible to the public site and to search engines.
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin/content/posts/new" className="a-btn a-btn--primary">New post</Link>
        </div>
      </header>

      <section className="panel">
        {posts.length === 0 ? (
          <div className="empty">
            <strong>No posts yet</strong>
            <span>Write the first one — it does not need to be long.</span>
            <div style={{ marginTop: ".6rem" }}>
              <Link href="/admin/content/posts/new" className="a-btn a-btn--sm a-btn--primary">Write a post</Link>
            </div>
          </div>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>State</th>
                  <th className="num">Reading</th>
                  <th className="num">Published</th>
                  <th className="actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/content/posts/${p.id}`} className="a-link">{p.title}</Link>
                      <div className="dim" style={{ fontSize: ".72rem" }}>/journal/{p.slug}</div>
                    </td>
                    <td><StatusPill status={p.state} /></td>
                    <td className="num dim">{p.readingMins} min</td>
                    <td className="num dim">
                      {p.publishedAt
                        ? p.publishedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="actions">
                      <div className="row-actions">
                        {p.state === "PUBLISHED" && (
                          <Link href={`/journal/${p.slug}`} target="_blank" className="a-btn a-btn--sm a-btn--ghost">View</Link>
                        )}
                        <form action={togglePostState}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="a-btn a-btn--sm">
                            {p.state === "PUBLISHED" ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <form action={deletePost}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="a-btn a-btn--sm a-btn--danger">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .row-actions { display: flex; gap: .3rem; justify-content: flex-end; flex-wrap: wrap; }
      `}</style>
    </>
  );
}
