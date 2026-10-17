"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, assertSameOrigin } from "@/lib/auth";
import type { ContentState } from "@/lib/action-types";

async function guard() {
  const user = await requireUser();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));
  return user;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// Posts
// ─────────────────────────────────────────────────────────────

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, "Title is too short.").max(200),
  slug: z.string().trim().max(120).optional(),
  excerpt: z.string().trim().min(10, "Write a one-sentence summary.").max(400),
  body: z.string().trim().min(50, "The post body is too short to be useful."),
  tags: z.string().optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDesc: z.string().trim().max(170).optional(),
  coverMediaId: z.string().optional(),
});

export async function savePost(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await guard();

  const parsed = postSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    tags: formData.get("tags") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDesc: formData.get("seoDesc") || undefined,
    coverMediaId: formData.get("coverMediaId") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the fields." };
  }

  const d = parsed.data;
  const slug = d.slug ? slugify(d.slug) : slugify(d.title);
  const tags = parseList(d.tags ?? null);
  const words = d.body.split(/\s+/).filter(Boolean).length;
  const readingMins = Math.max(1, Math.round(words / 220));

  const clash = await prisma.post.findUnique({ where: { slug } });
  if (clash && clash.id !== d.id) {
    return { ok: false, message: `The slug “${slug}” is already used by another post.` };
  }

  const data = {
    title: d.title,
    slug,
    excerpt: d.excerpt,
    body: d.body,
    tags,
    readingMins,
    seoTitle: d.seoTitle || null,
    seoDesc: d.seoDesc || null,
    coverMediaId: d.coverMediaId || null,
  };

  const post = d.id
    ? await prisma.post.update({ where: { id: d.id }, data })
    : await prisma.post.create({ data });

  revalidatePath("/journal");
  revalidatePath(`/journal/${post.slug}`);
  revalidatePath("/admin/content/posts");
  return { ok: true, message: "Saved.", id: post.id };
}

export async function togglePostState(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return;

  const publishing = post.state !== "PUBLISHED";
  await prisma.post.update({
    where: { id },
    data: {
      state: publishing ? "PUBLISHED" : "DRAFT",
      publishedAt: publishing ? (post.publishedAt ?? new Date()) : post.publishedAt,
    },
  });

  revalidatePath("/journal");
  revalidatePath(`/journal/${post.slug}`);
  revalidatePath("/admin/content/posts");
  revalidatePath("/admin");
}

export async function deletePost(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");
  await prisma.post.delete({ where: { id } }).catch(() => null);
  revalidatePath("/journal");
  revalidatePath("/admin/content/posts");
}

// ─────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────

export async function saveService(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await guard();

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const fromPrice = String(formData.get("fromPrice") ?? "").replace(/[^0-9.]/g, "");

  if (name.length < 2) return { ok: false, message: "Name is required." };
  if (summary.length < 20) return { ok: false, message: "Summary needs a little more detail." };

  const data = {
    name,
    slug,
    tagline,
    summary,
    outcomes: parseList(formData.get("outcomes")),
    deliverables: parseList(formData.get("deliverables")),
    fromPrice: fromPrice ? Math.round(Number(fromPrice) * 100) : null,
    order: Number(formData.get("order") ?? 0) || 0,
    state: (String(formData.get("state") ?? "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED"),
  };

  const service = id
    ? await prisma.service.update({ where: { id }, data })
    : await prisma.service.create({ data });

  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/admin/content/services");
  return { ok: true, message: "Saved.", id: service.id };
}

export async function deleteService(formData: FormData): Promise<void> {
  const user = await guard();
  if (user.role !== "ADMIN") return;
  const id = String(formData.get("id") ?? "");
  // Prefer archiving to deleting so live links never 404 unexpectedly.
  await prisma.service.update({ where: { id }, data: { state: "ARCHIVED" } }).catch(() => null);
  revalidatePath("/services");
  revalidatePath("/admin/content/services");
}

// ─────────────────────────────────────────────────────────────
// Case studies
// ─────────────────────────────────────────────────────────────

export async function saveProject(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await guard();

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);

  if (name.length < 3) return { ok: false, message: "Give the project a name." };
  if (summary.length < 20) return { ok: false, message: "Write a summary of at least a sentence." };

  let metrics: { label: string; value: string }[] = [];
  const rawMetrics = String(formData.get("metrics") ?? "").trim();
  if (rawMetrics) {
    try {
      const parsed = JSON.parse(rawMetrics) as { label?: string; value?: string }[];
      metrics = parsed
        .filter((m) => m.label && m.value)
        .map((m) => ({ label: String(m.label).slice(0, 60), value: String(m.value).slice(0, 30) }));
    } catch {
      return { ok: false, message: "Metrics must be valid JSON: [{\"label\":\"…\",\"value\":\"…\"}]" };
    }
  }

  const data = {
    name,
    slug,
    client: String(formData.get("client") ?? "").trim() || "Client",
    sector: String(formData.get("sector") ?? "").trim() || "General",
    location: String(formData.get("location") ?? "").trim() || null,
    summary,
    challenge: String(formData.get("challenge") ?? "").trim() || null,
    approach: String(formData.get("approach") ?? "").trim() || null,
    outcome: String(formData.get("outcome") ?? "").trim() || null,
    metrics,
    serviceId: String(formData.get("serviceId") ?? "") || null,
    featured: formData.get("featured") === "on",
    type: "CASE_STUDY" as const,
  };

  const project = id
    ? await prisma.project.update({ where: { id }, data })
    : await prisma.project.create({ data });

  revalidatePath("/work");
  revalidatePath(`/work/${project.slug}`);
  revalidatePath("/admin/content/work");
  return { ok: true, message: "Saved.", id: project.id };
}

export async function toggleProjectState(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return;

  await prisma.project.update({
    where: { id },
    data: { state: project.state === "PUBLISHED" ? "DRAFT" : "PUBLISHED" },
  });

  revalidatePath("/work");
  revalidatePath(`/work/${project.slug}`);
  revalidatePath("/admin/content/work");
}

// ─────────────────────────────────────────────────────────────
// Testimonials
// ─────────────────────────────────────────────────────────────

export async function saveTestimonial(_prev: ContentState, formData: FormData): Promise<ContentState> {
  await guard();

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5)));

  if (name.length < 2) return { ok: false, message: "Whose words are these?" };
  if (quote.length < 15) return { ok: false, message: "The quote is too short to be useful." };

  const data = {
    name,
    role: String(formData.get("role") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    quote,
    rating,
    approved: formData.get("approved") === "on",
    featured: formData.get("featured") === "on",
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || null,
  };

  const t = id
    ? await prisma.testimonial.update({ where: { id }, data })
    : await prisma.testimonial.create({ data });

  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/admin/content/reviews");
  return { ok: true, message: "Saved.", id: t.id };
}

export async function deleteTestimonial(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  revalidatePath("/reviews");
  revalidatePath("/admin/content/reviews");
}
