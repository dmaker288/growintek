import {
  s3Configured,
  putS3Image,
  listS3Images,
  getS3Image,
} from "./s3-storage.js";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const configured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
function location() {
  const origin = new URL(process.env.SUPABASE_URL);
  if (origin.protocol !== "https:" || origin.username || origin.password)
    throw new Error("Use the HTTPS Supabase project URL.");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "growintek-media";
  if (!/^[a-z0-9-]+$/.test(bucket))
    throw new Error("Invalid storage bucket name.");
  return { origin: origin.origin, bucket };
}
function headers() {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
}
export async function storeImage(filename, buffer, db) {
  if (s3Configured()) {
    await putS3Image(filename, buffer);
  } else if (configured()) {
    const { origin, bucket } = location();
    const r = await fetch(`${origin}/storage/v1/object/${bucket}/${filename}`, {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "image/webp",
        "x-upsert": "false",
      },
      body: buffer,
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok)
      throw Object.assign(
        new Error(
          `Image storage returned HTTP ${r.status}. Check the bucket and server credentials.`,
        ),
        { status: 502 },
      );
  } else if (db?.provider === "postgresql") {
    if (buffer.length > 2 * 1024 * 1024)
      throw Object.assign(
        new Error(
          "Choose a smaller image. Optimized images can be up to 2 MB.",
        ),
        { status: 413 },
      );
    await db
      .prepare(
        "INSERT INTO media_assets(filename,data,created_at) VALUES(?,?,?)",
      )
      .run(filename, buffer.toString("base64"), new Date().toISOString());
  } else {
    if (process.env.VERCEL)
      throw Object.assign(
        new Error(
          "Connect your Prisma database or image storage before uploading images.",
        ),
        { status: 503 },
      );
    const dir = resolve(process.env.MEDIA_PATH || "data/media");
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(resolve(dir, filename), buffer, { mode: 0o600 });
  }
  return "/images/" + filename;
}
export async function listImages(db) {
  if (s3Configured()) return listS3Images();
  if (configured()) {
    const { origin, bucket } = location();
    const r = await fetch(`${origin}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix: "",
        limit: 1000,
        sortBy: { column: "created_at", order: "desc" },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok)
      throw Object.assign(new Error("Unable to list stored images."), {
        status: 502,
      });
    return (await r.json())
      .filter((x) => /^media-[a-f0-9-]+\.webp$/.test(x.name))
      .map((x) => "/images/" + x.name);
  }
  if (db?.provider === "postgresql")
    return (
      await db
        .prepare(
          "SELECT filename FROM media_assets ORDER BY created_at DESC LIMIT 1000",
        )
        .all()
    ).map((x) => "/images/" + x.filename);
  try {
    return (await readdir(resolve(process.env.MEDIA_PATH || "data/media")))
      .filter((x) => /^media-[a-f0-9-]+\.webp$/.test(x))
      .map((x) => "/images/" + x);
  } catch {
    return [];
  }
}
export async function serveImage(req, res, db) {
  const filename = req.path.split("/").pop();
  if (s3Configured()) {
    const bytes = await getS3Image(filename);
    if (bytes)
      return res
        .type("image/webp")
        .set("Cache-Control", "public,max-age=31536000,immutable")
        .send(bytes);
    // Keep any pre-existing database media readable after switching providers.
    if (db?.provider !== "postgresql") return res.sendStatus(404);
  }
  if (configured()) {
    const { origin, bucket } = location();
    const r = await fetch(`${origin}/storage/v1/object/${bucket}/${filename}`, {
      headers: headers(),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return res.sendStatus(r.status === 404 ? 404 : 502);
    return res
      .type("image/webp")
      .set("Cache-Control", "public,max-age=31536000,immutable")
      .send(Buffer.from(await r.arrayBuffer()));
  }
  if (db?.provider === "postgresql") {
    const row = await db
      .prepare("SELECT data FROM media_assets WHERE filename=?")
      .get(filename);
    if (!row) return res.sendStatus(404);
    return res
      .type("image/webp")
      .set("Cache-Control", "public,max-age=31536000,immutable")
      .send(Buffer.from(row.data, "base64"));
  }
  return res.sendFile(
    resolve(process.env.MEDIA_PATH || "data/media", filename),
    { maxAge: "1y", immutable: true },
  );
}
