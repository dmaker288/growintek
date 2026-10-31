import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { databaseAdapter } from "./database-adapter.js";

export function openDatabase(
  filename = process.env.DATABASE_PATH || "data/growintek.sqlite",
) {
  const db = databaseAdapter(filename);
  if (db.provider === "sqlite") {
    db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (id TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, kind TEXT NOT NULL, slug TEXT NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(kind, slug));
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS admins (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, kind TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, available_at INTEGER NOT NULL, lease_until INTEGER, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, path TEXT NOT NULL, event TEXT NOT NULL, day TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS docs_kind ON documents(kind);
    CREATE INDEX IF NOT EXISTS jobs_pending ON jobs(status, available_at);
    CREATE INDEX IF NOT EXISTS events_day ON events(day);
  `);
  }
  return db;
}
export const now = () => new Date().toISOString();
export async function list(db, kind) {
  return (
    await db
      .prepare("SELECT * FROM documents WHERE kind=? ORDER BY updated_at DESC")
      .all(kind)
  ).map(decode);
}
export async function get(db, kind, id) {
  return decode(
    await db
      .prepare("SELECT * FROM documents WHERE kind=? AND id=?")
      .get(kind, id),
  );
}
function decode(row) {
  return row
    ? {
        ...JSON.parse(row.data),
        id: row.id,
        slug: row.slug,
        revision: row.revision,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}
export async function insert(db, kind, data) {
  const id = randomUUID(),
    date = now();
  await db
    .prepare(
      "INSERT INTO documents(id,kind,slug,data,created_at,updated_at) VALUES(?,?,?,?,?,?)",
    )
    .run(id, kind, data.slug || id, JSON.stringify(data), date, date);
  return await get(db, kind, id);
}
export async function update(db, kind, id, data, revision) {
  const result = await db
    .prepare(
      "UPDATE documents SET slug=?,data=?,revision=revision+1,updated_at=? WHERE kind=? AND id=? AND revision=?",
    )
    .run(data.slug || id, JSON.stringify(data), now(), kind, id, revision);
  if (!result.changes)
    throw Object.assign(
      new Error(
        "This record changed in another session. Refresh before saving.",
      ),
      { status: 409 },
    );
  return await get(db, kind, id);
}
export async function settings(db) {
  return JSON.parse(
    (await db.prepare("SELECT data FROM settings WHERE id=1").get()).data,
  );
}
export async function saveSettings(db, data) {
  await db
    .prepare("UPDATE settings SET data=?,revision=revision+1 WHERE id=1")
    .run(JSON.stringify(data));
}
export async function log(db, actor, action, target) {
  await db
    .prepare(
      "INSERT INTO audit_log(actor,action,target,created_at) VALUES(?,?,?,?)",
    )
    .run(actor, action, target, now());
}
export function isPublic(doc) {
  return (
    doc.status === "published" &&
    (!doc.publishedAt || Date.parse(doc.publishedAt) <= Date.now())
  );
}
export async function publicData(db) {
  const s = await settings(db);
  return {
    services: (await list(db, "services"))
      .filter(isPublic)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    portfolio: (await list(db, "portfolio"))
      .filter(isPublic)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
    posts: (await list(db, "posts"))
      .filter(isPublic)
      .sort(
        (a, b) =>
          Date.parse(b.publishedAt || b.createdAt) -
          Date.parse(a.publishedAt || a.createdAt),
      )
      .map((p) => ({
        ...p,
        sources: (p.sources || []).map(({ title, url }) => ({ title, url })),
      })),
    pages: (await list(db, "pages")).filter(isPublic),
    team: (await list(db, "team"))
      .filter(isPublic)
      .sort((a, b) => a.order - b.order),
    sections: (await list(db, "sections"))
      .filter(isPublic)
      .sort((a, b) => a.order - b.order),
    settings: {
      brand: s.brand,
      email: s.email,
      legalName: s.legalName,
      country: s.country,
      siteUrl: process.env.SITE_URL || "",
      gaId: s.gaId,
      social: s.social,
    },
  };
}
export async function seed(db) {
  const data = JSON.parse(
    readFileSync(new URL("../shared/seed.json", import.meta.url), "utf8"),
  );
  await db.transaction(async () => {
    if (!(await db.prepare("SELECT 1 FROM settings WHERE id=1").get())) {
      await db
        .prepare("INSERT INTO settings(id,data) VALUES(1,?)")
        .run(JSON.stringify(data.settings));
      for (const kind of [
        "services",
        "portfolio",
        "posts",
        "pages",
        "keywords",
        "team",
      ])
        for (const item of data[kind] || []) await insert(db, kind, item);
    }
    if (
      !(await db
        .prepare("SELECT 1 FROM schema_migrations WHERE version=?")
        .get("core-pages-v1"))
    ) {
      for (const page of data.pages.filter((p) =>
        [
          "home",
          "about",
          "services",
          "seo",
          "portfolio",
          "blog",
          "contact",
        ].includes(p.slug),
      ))
        if (!(await list(db, "pages")).some((p) => p.slug === page.slug))
          await insert(db, "pages", page);
      await db
        .prepare("INSERT INTO schema_migrations VALUES(?)")
        .run("core-pages-v1");
    }
    if (
      !(await db
        .prepare("SELECT 1 FROM schema_migrations WHERE version=?")
        .get("display-order-v1"))
    ) {
      for (const kind of ["services", "portfolio"])
        for (const item of data[kind]) {
          const current = (await list(db, kind)).find(
            (d) => d.slug === item.slug,
          );
          if (current && current.order === undefined)
            await update(
              db,
              kind,
              current.id,
              { ...current, order: item.order },
              current.revision,
            );
        }
      await db
        .prepare("INSERT INTO schema_migrations VALUES(?)")
        .run("display-order-v1");
    }
    if (
      !(await db
        .prepare("SELECT 1 FROM schema_migrations WHERE version=?")
        .get("cloud-content-v1"))
    ) {
      if (!(await list(db, "sections")).length)
        for (const item of data.sections) await insert(db, "sections", item);
      const current = await settings(db);
      const snapshot = JSON.parse(
        readFileSync(
          new URL("../shared/social-snapshot.json", import.meta.url),
          "utf8",
        ),
      );
      await saveSettings(db, {
        ...current,
        aiApproval: false,
        aiTimezone: "Asia/Karachi",
        aiHour: 9,
        social: Object.fromEntries(
          Object.entries(data.settings.social).map(([k, v]) => [
            k,
            current.social[k] || v,
          ]),
        ),
        socialCache:
          current.socialCache &&
          Object.values(current.socialCache).some((c) => c.posts?.length)
            ? current.socialCache
            : snapshot,
      });
      await db
        .prepare("INSERT INTO schema_migrations VALUES(?)")
        .run("cloud-content-v1");
    }
    if (
      !(await db
        .prepare("SELECT 1 FROM schema_migrations WHERE version=?")
        .get("editorial-policy-auto-v1"))
    ) {
      const policy = (await list(db, "pages")).find(
        (p) => p.slug === "editorial-policy",
      );
      if (
        policy &&
        policy.content.includes("The default workflow requires an editor")
      )
        await update(
          db,
          "pages",
          policy.id,
          {
            ...policy,
            content: policy.content.replace(
              "The default workflow requires an editor to check accuracy, sources, relevance and originality before publication. An automation check cannot replace professional judgment.",
              "Articles may publish after automated source, format and duplication checks under our selected publishing settings. These articles disclose when no human review has taken place. An editor can also review and correct an article before or after publication. Automated checks cannot replace professional judgment.",
            ),
          },
          policy.revision,
        );
      await db
        .prepare("INSERT INTO schema_migrations VALUES(?)")
        .run("editorial-policy-auto-v1");
    }
  })();
}
// Keep page payloads small as the editorial archive grows.
export function dataForPage(data, path = "/") {
  const [section, slug] = path.split("/").filter(Boolean);
  const currentPage = path === "/" ? "home" : section;
  return {
    ...data,
    team: section === "about" ? data.team || [] : [],
    services: data.services.map((d) => ({
      ...d,
      content: section === "services" && slug === d.slug ? d.content : "",
    })),
    portfolio: data.portfolio.map((d) => ({
      ...d,
      content: section === "portfolio" && slug === d.slug ? d.content : "",
    })),
    posts: data.posts.map((d) => ({
      ...d,
      wordCount: (d.content || "").trim().split(/\s+/).filter(Boolean).length,
      content: section === "blog" && slug === d.slug ? d.content : "",
      sources: section === "blog" && slug === d.slug ? d.sources : [],
    })),
    pages: data.pages.map((d) => ({
      ...d,
      content: !slug && d.slug === currentPage ? d.content : "",
    })),
  };
}
