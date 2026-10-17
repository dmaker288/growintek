import { NextRequest, NextResponse } from "next/server";
import { syncReviews } from "@/lib/integrations/reviews";
import { syncSocial } from "@/lib/integrations/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduled sync, called by Vercel Cron (see vercel.json) or any scheduler.
 * Protected by CRON_SECRET so it cannot be spammed from outside.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const [reviews, social] = await Promise.all([syncReviews(), syncSocial()]);

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    results: [...reviews, ...social],
  });
}
