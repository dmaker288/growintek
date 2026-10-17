import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe: confirms the app can reach the database. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "growintek",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, service: "growintek" }, { status: 503 });
  }
}
