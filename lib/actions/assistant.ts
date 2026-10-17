"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, assertSameOrigin } from "@/lib/auth";
import { chat, generateImage } from "@/lib/ai";
import { readingMinutes, excerptFrom } from "@/lib/markdown";
import { writeMediaFile } from "@/lib/media-storage";
import type { AssistantState } from "@/lib/action-types";

async function guard() {
  const user = await requireUser();
  const h = await headers();
  assertSameOrigin(h.get("origin"), h.get("host"));
  return user;
}

/**
 * CMS assistant. Three jobs, all explicitly requested by the editor:
 *  - draft   : a full journal post from a title + brief
 *  - improve : rewrite the body currently in the editor
 *  - image   : generate a featured image and store it in media
 *
 * Nothing saves to a post automatically — the editor reviews and pastes.
 */
export async function runAssistant(
  _prev: AssistantState,
  formData: FormData
): Promise<AssistantState> {
  await guard();

  const intent = String(formData.get("intent") ?? "draft");
  const instruction = String(formData.get("instruction") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const currentBody = String(formData.get("body") ?? "").trim();
  const keywords = String(formData.get("keywords") ?? "").trim();

  if (intent === "image") {
    const subject = instruction || title || "abstract editorial illustration for a web studio";
    const prompt = [
      "Editorial photograph for a small business web studio.",
      subject,
      "Warm natural light, bone and sage palette, muted cobalt accents, shallow depth of field,",
      "no text, no logos, no faces looking at camera, uncluttered, calm, premium magazine feel.",
    ].join(" ");

    const img = await generateImage(prompt, "1280*720");
    if (!img.ok || !img.bytes) {
      return { ok: false, message: img.error ?? "Image generation failed." };
    }

    let bytes = img.bytes;
    let mime = img.mimeType ?? "image/png";

    // Prefer WebP when the runtime can encode it; otherwise store the original.
    try {
      const webp = await encodeWebp(bytes);
      if (webp) {
        bytes = webp;
        mime = "image/webp";
      }
    } catch {
      // keep the original format
    }

    if (bytes.byteLength > 8 * 1024 * 1024) {
      return { ok: false, message: "Generated image is over 8 MB. Try a simpler prompt." };
    }

    const id = randomUUID().replace(/-/g, "").slice(0, 24);
    await writeMediaFile(id, bytes, mime);

    await prisma.mediaAsset.create({
      data: {
        id,
        filename: `${(title || "generated").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.${mime === "image/webp" ? "webp" : "png"}`,
        mimeType: mime,
        size: bytes.byteLength,
        url: `/api/media/${id}/file`,
        alt: subject.slice(0, 180),
      },
    });

    revalidatePath("/admin/media");

    return {
      ok: true,
      message: "Image generated and saved to Media.",
      imageId: id,
      imageUrl: `/api/media/${id}/file`,
    };
  }

  if (intent === "improve") {
    if (currentBody.length < 40) {
      return { ok: false, message: "Write a rough draft first, then ask for a rewrite." };
    }

    const res = await chat({
      messages: [
        {
          role: "system",
          content:
            "You are a copy editor for a small UK web studio called GrowinTek. Rewrite the draft so it is tighter, more specific and plainer. British English. Keep the author's meaning, every number and every code-level detail. Remove filler, hedges and any sentence that could apply to any competitor. Keep the Markdown structure. Return only the rewritten post body, no commentary.",
        },
        {
          role: "user",
          content: `TITLE: ${title || "(untitled)"}\n${keywords ? `KEYWORDS TO KEEP NATURAL: ${keywords}\n` : ""}\nDRAFT:\n${currentBody}`,
        },
      ],
      temperature: 0.4,
      maxTokens: 2000,
    });

    if (!res.ok) return { ok: false, message: res.error ?? "The model did not respond." };

    const body = res.text;
    return {
      ok: true,
      message: "Rewrite ready — review it, then save the post.",
      body,
      excerpt: excerptFrom(body, 200),
      resultId: cryptoId(),
    };
  }

  // intent === "draft"
  const topic = instruction || title;
  if (topic.length < 5) {
    return { ok: false, message: "Give the assistant a topic or a working title first." };
  }

  const res = await chat({
    messages: [
      {
        role: "system",
        content: `You write the GrowinTek journal. GrowinTek is a two-person studio building websites, AI agents and automation for owner-run businesses in the UK and Australia.

RULES
- British English. Direct, plain, slightly dry. No hype, no "in today's fast-paced world", no exclamation marks.
- 700–1,000 words. Markdown: a short opening paragraph, then 3–4 "## " sections. Use **bold** sparingly. At most one "> " pull quote. No bullet lists longer than five items.
- Open with a specific, concrete observation — a number, a mistake, a real scenario. Never open with a definition.
- Include at least one honest caveat: when this advice does not apply, or what it costs.
- Reference realistic figures but never invent a named client, testimonial or statistic you cannot attribute. Prefer "in our experience" to a fake study.
- End with a short paragraph, not a call to action.
- Return JSON only, in this shape: {"title": "...", "excerpt": "one sentence under 200 characters", "body": "markdown", "keywords": ["..."]}`,
      },
      {
        role: "user",
        content: `Topic: ${topic}\n${title ? `Working title: ${title}\n` : ""}${keywords ? `Target keywords: ${keywords}\n` : ""}Audience: owner-run businesses in the UK and Australia considering a website, an AI agent or automation.`,
      },
    ],
    temperature: 0.7,
    maxTokens: 2400,
  });

  if (!res.ok) return { ok: false, message: res.error ?? "The model did not respond." };

  const parsed = extractJson(res.text);
  if (!parsed?.body) {
    return {
      ok: true,
      message: "The model returned plain text rather than JSON. Review and paste it.",
      body: res.text,
      resultId: cryptoId(),
    };
  }

  const body = String(parsed.body);
  return {
    ok: true,
    message: `Draft ready — about ${readingMinutes(body)} minutes of reading. Review before publishing.`,
    title: parsed.title ? String(parsed.title) : title,
    excerpt: parsed.excerpt ? String(parsed.excerpt).slice(0, 300) : excerptFrom(body, 200),
    body,
    resultId: cryptoId(),
  };
}

function cryptoId(): string {
  return randomUUID();
}

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * WebP encoding without a native dependency: the browser-free canvas API is
 * unavailable on the server, so this returns null and the caller stores the
 * original format. Install `sharp` and swap this out if WebP is required.
 */
async function encodeWebp(_bytes: Buffer): Promise<Buffer | null> {
  return null;
}
