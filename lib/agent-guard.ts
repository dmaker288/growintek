import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Shared guard rails for the public agent.
 *
 * - Per-visitor daily message cap, keyed on a hash of IP + salt (no IP stored).
 * - A simple in-memory sliding window per instance as a second line of
 *   defence against bursts. Not shared across serverless instances; the
 *   database count is the authoritative limit.
 */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const buckets = new Map<string, number[]>();

export function visitorKey(ip: string): string {
  const salt = process.env.ANALYTICS_SALT ?? "dev-salt";
  return createHash("sha256").update(`${ip}|agent|${salt}`).digest("hex").slice(0, 40);
}

export function burstAllowed(key: string): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // keep the map from growing without bound
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < WINDOW_MS)) buckets.delete(k);
    }
  }
  return true;
}

export async function dailyQuotaRemaining(key: string): Promise<number> {
  const limit = Number(process.env.AGENT_DAILY_MESSAGE_LIMIT ?? 40);
  const since = new Date(Date.now() - 86_400_000);

  const used = await prisma.analyticsEvent.count({
    where: {
      type: "agent",
      visitorHash: key,
      createdAt: { gte: since },
    },
  });

  return Math.max(0, limit - used);
}

export async function recordAgentMessage(key: string, chars: number): Promise<void> {
  await prisma.analyticsEvent.create({
    data: {
      // The column is named visitorHash; for agent events it holds the
      // agent-specific key so the two datasets never mix.
      visitorHash: key,
      sessionId: key.slice(0, 24),
      type: "agent",
      path: "/agent",
      label: `msg:${Math.min(chars, 4000)}`,
    },
  });
}
