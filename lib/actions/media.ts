"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser, assertSameOrigin } from "@/lib/auth";
import { writeMediaFile, removeMediaFile } from "@/lib/media-storage";
import type { MediaState } from "@/lib/action-types";

async function guard() {
  const user = await requireUser();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));
  return user;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
  ["application/pdf", "pdf"],
]);

export async function uploadMedia(_prev: MediaState, formData: FormData): Promise<MediaState> {
  await guard();

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a file first." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Files must be under 8 MB." };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, message: "Use JPG, PNG, WebP, AVIF, SVG or PDF." };
  }

  const id = randomUUID().replace(/-/g, "").slice(0, 24);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeMediaFile(id, bytes, file.type);

  await prisma.mediaAsset.create({
    data: {
      id,
      filename: file.name.slice(0, 160),
      mimeType: file.type,
      size: file.size,
      url: `/api/media/${id}/file`,
      alt: alt || null,
    },
  });

  revalidatePath("/admin/media");
  return { ok: true, message: "Uploaded.", id };
}

export async function updateMediaAlt(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);
  await prisma.mediaAsset.update({ where: { id }, data: { alt } }).catch(() => null);
  revalidatePath("/admin/media");
}

export async function deleteMedia(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;

  await prisma.mediaAsset.delete({ where: { id } }).catch(() => null);
  await removeMediaFile(id);
  revalidatePath("/admin/media");
}
