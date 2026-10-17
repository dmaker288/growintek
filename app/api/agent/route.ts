import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat, aiConfigured, type ChatMessage } from "@/lib/ai";
import { buildSiteContext, AGENT_SYSTEM_PROMPT } from "@/lib/agent-prompt";
import { visitorKey, burstAllowed, dailyQuotaRemaining, recordAgentMessage } from "@/lib/agent-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1500),
      })
    )
    .min(1)
    .max(12),
});

export async function POST(req: NextRequest) {
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "The assistant is not configured yet. Please email hello@growintek.com." },
      { status: 503 }
    );
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "0.0.0.0";
  const key = visitorKey(ip);

  if (!burstAllowed(key)) {
    return NextResponse.json(
      { error: "That was a few messages in a row. Give it a minute and try again." },
      { status: 429 }
    );
  }

  const remaining = await dailyQuotaRemaining(key);
  if (remaining <= 0) {
    return NextResponse.json(
      {
        error:
          "You have reached today's message limit for the assistant. Email hello@growintek.com and a person will reply within one working day.",
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Send a question under 1500 characters." }, { status: 422 });
  }

  // Only the last few turns are sent — long histories cost money and add
  // nothing to a sales conversation.
  const history = parsed.data.messages.slice(-8);

  let context: string;
  try {
    context = await buildSiteContext();
  } catch {
    context = "Context unavailable. Ask the visitor to email hello@growintek.com.";
  }

  const messages: ChatMessage[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT.replace("{{CONTEXT}}", context) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const result = await chat({ messages, temperature: 0.35, maxTokens: 500 });

  if (!result.ok) {
    console.error("[agent]", result.error);
    return NextResponse.json(
      {
        error:
          "I could not answer just now. Email hello@growintek.com and a person will reply within one working day.",
      },
      { status: 502 }
    );
  }

  await recordAgentMessage(key, result.text.length).catch(() => null);

  return NextResponse.json({
    reply: result.text,
    remaining: Math.max(0, remaining - 1),
  });
}
