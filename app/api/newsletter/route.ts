import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 422 });
    }

    const email = parsed.data.email.toLowerCase();
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, name: parsed.data.name ?? null, consent: true },
      update: { consent: true },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not subscribe." }, { status: 500 });
  }
}
