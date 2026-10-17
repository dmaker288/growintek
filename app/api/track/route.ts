import { NextRequest, NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-party event endpoint. Accepts beacon or fetch, responds 204.
 * Deliberately permissive about bad input: analytics must never throw
 * in a visitor's face.
 */
export async function POST(req: NextRequest) {
  try {
    // 2 KB is plenty for a pageview or CTA event.
    const raw = await req.text();
    if (raw.length > 2048) return new NextResponse(null, { status: 204 });

    const body = JSON.parse(raw || "{}") as {
      type?: string;
      path?: string;
      referrer?: string | null;
      label?: string | null;
    };

    const allowed = new Set(["pageview", "cta", "form", "outbound"]);
    const type = allowed.has(body.type ?? "") ? (body.type as "pageview" | "cta" | "form" | "outbound") : "pageview";

    if (!body.path || typeof body.path !== "string") {
      return new NextResponse(null, { status: 204 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "0.0.0.0";

    await recordEvent({
      type,
      path: body.path,
      referrer: body.referrer ?? null,
      label: body.label ?? null,
      userAgent: req.headers.get("user-agent"),
      ip,
      country: req.headers.get("x-vercel-ip-country"),
    });
  } catch {
    // swallow — never break the page for a tracking failure
  }

  return new NextResponse(null, { status: 204 });
}
