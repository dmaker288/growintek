import Link from "next/link";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  return (
    <>
      <header className="page-head">
        <div>
          <Link href="/admin/content/posts" className="a-btn a-btn--sm a-btn--ghost" style={{ marginBottom: ".6rem" }}>
            ← All posts
          </Link>
          <h1 className="page-title">New post</h1>
          <p className="page-sub">
            One specific idea, a number or a mistake. If a post cannot name one of
            those, it is not ready to publish.
          </p>
        </div>
      </header>
      <div style={{ maxWidth: "56rem" }}>
        <PostEditor />
      </div>
    </>
  );
}
