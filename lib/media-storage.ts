import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Media storage with two drivers:
 *   s3    — any S3-compatible bucket (Tigris, R2, Backblaze, AWS)
 *   local — data/uploads on the local filesystem
 *
 * Both are addressed by an opaque record id. Public URLs always go through
 * /api/media/[id]/file, so the bucket can stay private and swapping drivers
 * never changes a URL already published on the site.
 */

function s3Configured(): boolean {
  return (
    (process.env.MEDIA_DRIVER ?? "local") === "s3" &&
    Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)
  );
}

export function uploadDir(): string {
  return path.join(process.cwd(), "data", "uploads");
}

type S3Module = typeof import("@aws-sdk/client-s3");

let s3Cache: { client: InstanceType<S3Module["S3Client"]>; mod: S3Module } | null = null;

async function s3() {
  if (s3Cache) return s3Cache;
  const mod = await import("@aws-sdk/client-s3");
  const client = new mod.S3Client({
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION || "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  s3Cache = { client, mod };
  return s3Cache;
}

function keyFor(id: string): string {
  return `media/${id}`;
}

export async function writeMediaFile(id: string, bytes: Buffer, mimeType: string): Promise<void> {
  if (s3Configured()) {
    const { client, mod } = await s3();
    await client.send(
      new mod.PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: keyFor(id),
        Body: bytes,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return;
  }

  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, id), bytes);
}

export async function readMediaFile(id: string): Promise<Buffer | null> {
  if (!/^[a-z0-9]{10,32}$/.test(id)) return null;

  if (s3Configured()) {
    try {
      const { client, mod } = await s3();
      const res = await client.send(
        new mod.GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: keyFor(id) })
      );
      const raw = res.Body as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
      if (!raw?.transformToByteArray) return null;
      return Buffer.from(await raw.transformToByteArray());
    } catch {
      return null;
    }
  }

  try {
    return await readFile(path.join(uploadDir(), id));
  } catch {
    return null;
  }
}

/** Direct bucket URL, only valid when the bucket is public. */
export function publicUrlFor(id: string): string | null {
  const base = process.env.S3_PUBLIC_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${keyFor(id)}`;
}

export async function removeMediaFile(id: string): Promise<void> {
  if (!/^[a-z0-9]{10,32}$/.test(id)) return;

  if (s3Configured()) {
    try {
      const { client, mod } = await s3();
      await client.send(
        new mod.DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: keyFor(id) })
      );
    } catch {
      // deletion is best-effort; a dangling object is cheaper than a 500
    }
    return;
  }

  await unlink(path.join(uploadDir(), id)).catch(() => null);
}

export function storageDriver(): "s3" | "local" {
  return s3Configured() ? "s3" : "local";
}
