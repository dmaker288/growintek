import { prisma } from "@/lib/db";
import MediaUploader from "@/components/admin/MediaUploader";
import CopyButton from "@/components/admin/CopyButton";
import { updateMediaAlt, deleteMedia } from "@/lib/actions/media";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 120,
  });

  const totalBytes = assets.reduce((s, a) => s + a.size, 0);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Media</h1>
          <p className="page-sub">
            {assets.length} file{assets.length === 1 ? "" : "s"} · {(totalBytes / 1_048_576).toFixed(1)} MB stored.
            Alt text is required for accessibility — fill it in, or the image fails a basic audit.
          </p>
        </div>
      </header>

      <div className="stack-lg">
        <MediaUploader />

        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Library</h2>
          </div>
          {assets.length === 0 ? (
            <div className="empty">
              <strong>No media yet</strong>
              <span>Upload a logo or a case study image to use on the site.</span>
            </div>
          ) : (
            <div className="panel-body">
              <ul className="media-grid">
                {assets.map((a) => (
                  <li key={a.id} className="media-item">
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="media-thumb">
                      {a.mimeType.startsWith("image/") ? (
                        <img src={a.url} alt={a.alt ?? ""} loading="lazy" />
                      ) : (
                        <span className="media-file mono">{a.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}</span>
                      )}
                    </a>
                    <div className="media-meta">
                      <span className="media-name" title={a.filename}>{a.filename}</span>
                      <span className="dim tiny">{(a.size / 1024).toFixed(0)} KB · {a.mimeType.split("/")[1]}</span>
                    </div>
                    <form action={updateMediaAlt} className="media-alt">
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        name="alt"
                        defaultValue={a.alt ?? ""}
                        placeholder="Alt text…"
                        aria-label={`Alt text for ${a.filename}`}
                        className="a-input"
                      />
                      <button type="submit" className="a-btn a-btn--sm">Save</button>
                    </form>
                    <div className="media-actions">
                      <CopyButton value={a.url} />
                      <form action={deleteMedia}>
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="a-btn a-btn--sm a-btn--danger">Delete</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
          gap: .9rem;
        }
        .media-item {
          border: 1px solid #e2dcce;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
          display: grid;
          align-content: start;
        }
        .media-thumb {
          display: block;
          aspect-ratio: 4 / 3;
          background: #f0ece1;
          overflow: hidden;
        }
        .media-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .media-file {
          display: grid; place-items: center; height: 100%;
          font-size: .7rem; color: #9a9684; letter-spacing: .1em;
        }
        .media-meta { display: grid; gap: .1rem; padding: .5rem .6rem 0; min-width: 0; }
        .media-name { font-size: .74rem; font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .media-alt { display: flex; gap: .25rem; padding: .45rem .6rem; }
        .media-alt .a-input { min-height: 28px; font-size: .72rem; }
        .media-actions { display: flex; gap: .25rem; justify-content: space-between; padding: 0 .6rem .6rem; }
      `}</style>
    </>
  );
}
