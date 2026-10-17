import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * First-party analytics. Cookie-less by design:
 *  - no client id is stored anywhere
 *  - visitor identity is a hash of IP + salt + day, so it rotates daily and
 *    cannot be reversed or linked across days
 *  - no query strings are stored except a whitelisted CTA/form label
 *
 * That keeps the dashboard legitimate-interest based under UK/EU rules
 * without a consent banner for analytics itself.
 */

function salt(): string {
  return process.env.ANALYTICS_SALT ?? "dev-analytics-salt";
}

export function visitorHash(ip: string, day = new Date()): string {
  const dayKey = day.toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${salt()}|${dayKey}`).digest("hex").slice(0, 32);
}

export function sessionKey(ip: string): string {
  // Coarser than visitorHash: identifies a browser session for funnel maths
  // without being stable across days.
  return createHash("sha256").update(`s|${ip}|${salt()}`).digest("hex").slice(0, 24);
}

export function detectDevice(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

export function detectBrowser(userAgent: string): string {
  const ua = userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

export type TrackInput = {
  type?: "pageview" | "cta" | "form" | "outbound";
  path: string;
  referrer?: string | null;
  label?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  country?: string | null;
};

export async function recordEvent(input: TrackInput): Promise<void> {
  const ua = input.userAgent ?? "";
  const ip = input.ip ?? "0.0.0.0";

  await prisma.analyticsEvent.create({
    data: {
      visitorHash: visitorHash(ip),
      sessionId: sessionKey(ip),
      type: input.type ?? "pageview",
      path: normalisePath(input.path),
      referrer: input.referrer ? referrerHost(input.referrer) : null,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      country: input.country ?? null,
      label: input.label?.slice(0, 80) ?? null,
    },
  });
}

function normalisePath(path: string): string {
  const clean = (path || "/").split("?")[0].split("#")[0];
  if (!clean.startsWith("/")) return "/" + clean;
  return clean.slice(0, 200);
}

export function referrerHost(referrer: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).host.replace(/^www\./, "");
    const self = (process.env.NEXT_PUBLIC_SITE_URL ?? "")
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
    if (self && host === self) return "direct";
    if (/google\.|bing\.|duckduckgo|yahoo\./.test(host)) return "search";
    if (/instagram|facebook|linkedin|twitter|x\.com|tiktok|youtube|reddit/.test(host)) return "social";
    if (/mail\.|outlook|gmail/.test(host)) return "email";
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

export type Range = 7 | 30 | 90 | 365;

export function rangeStart(days: Range): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

export type DashboardData = {
  range: Range;
  visitors: number;
  pageviews: number;
  ctaClicks: number;
  formStarts: number;
  leads: number;
  conversionRate: number;
  byDay: { date: string; visitors: number; pageviews: number; leads: number }[];
  topPages: { path: string; views: number }[];
  referrers: { source: string; views: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  ctaLabels: { label: string; count: number }[];
  prev: { visitors: number; pageviews: number; ctaClicks: number; leads: number };
};

export async function getDashboard(range: Range): Promise<DashboardData> {
  const start = rangeStart(range);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - range);
  const prevEnd = start;

  const [events, prevEvents, leadsInRange, leadsPrev] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: start } },
      select: {
        visitorHash: true,
        type: true,
        path: true,
        referrer: true,
        device: true,
        browser: true,
        label: true,
        createdAt: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: prevStart, lt: prevEnd } },
      select: { visitorHash: true, type: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.lead.count({
      where: { createdAt: { gte: prevStart, lt: prevEnd } },
    }),
  ]);

  const visitors = new Set(events.map((e) => e.visitorHash)).size;
  const pageviews = events.filter((e) => e.type === "pageview").length;
  const ctaClicks = events.filter((e) => e.type === "cta").length;
  const formStarts = events.filter((e) => e.type === "form").length;

  // ── daily series, zero-filled so the chart never has holes
  const dayBuckets = new Map<string, { visitors: Set<string>; pageviews: number; leads: number }>();
  for (let i = 0; i < range; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayBuckets.set(d.toISOString().slice(0, 10), {
      visitors: new Set(),
      pageviews: 0,
      leads: 0,
    });
  }
  for (const e of events) {
    const key = e.createdAt.toISOString().slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    bucket.visitors.add(e.visitorHash);
    if (e.type === "pageview") bucket.pageviews += 1;
  }
  for (const l of leadsInRange) {
    const key = l.createdAt.toISOString().slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (bucket) bucket.leads += 1;
  }

  const byDay = Array.from(dayBuckets.entries()).map(([date, b]) => ({
    date,
    visitors: b.visitors.size,
    pageviews: b.pageviews,
    leads: b.leads,
  }));

  // ── rankings
  const pageMap = new Map<string, number>();
  const refMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const ctaMap = new Map<string, number>();

  for (const e of events) {
    if (e.type === "pageview") {
      pageMap.set(e.path, (pageMap.get(e.path) ?? 0) + 1);
      const ref = e.referrer ?? "direct";
      refMap.set(ref, (refMap.get(ref) ?? 0) + 1);
      deviceMap.set(e.device, (deviceMap.get(e.device) ?? 0) + 1);
      if (e.browser) browserMap.set(e.browser, (browserMap.get(e.browser) ?? 0) + 1);
    }
    if (e.type === "cta" && e.label) {
      ctaMap.set(e.label, (ctaMap.get(e.label) ?? 0) + 1);
    }
  }

  const sorted = (m: Map<string, number>, n: number) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);

  const conversionRate = visitors > 0 ? (leadsInRange.length / visitors) * 100 : 0;

  return {
    range,
    visitors,
    pageviews,
    ctaClicks,
    formStarts,
    leads: leadsInRange.length,
    conversionRate,
    byDay,
    topPages: sorted(pageMap, 8).map(([path, views]) => ({ path, views })),
    referrers: sorted(refMap, 6).map(([source, views]) => ({ source, views })),
    devices: sorted(deviceMap, 3).map(([device, count]) => ({ device, count })),
    browsers: sorted(browserMap, 5).map(([browser, count]) => ({ browser, count })),
    ctaLabels: sorted(ctaMap, 6).map(([label, count]) => ({ label, count })),
    prev: {
      visitors: new Set(prevEvents.map((e) => e.visitorHash)).size,
      pageviews: prevEvents.filter((e) => e.type === "pageview").length,
      ctaClicks: prevEvents.filter((e) => e.type === "cta").length,
      leads: leadsPrev,
    },
  };
}

export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}
