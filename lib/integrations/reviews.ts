import "server-only";
import { prisma } from "@/lib/db";
import type { NormalisedReview, Platform, ReviewSummary, SyncReport } from "./types";

const LABEL: Record<string, string> = {
  GOOGLE: "Google Business Profile",
  TRUSTPILOT: "Trustpilot",
  FACEBOOK: "Facebook",
  DIRECT: "Direct",
};

const PROFILE_URL: Partial<Record<Platform, string>> = {
  GOOGLE:
    process.env.GBP_PROFILE_URL ??
    "https://www.google.com/maps/search/?api=1&query=GrowinTek",
  TRUSTPILOT:
    process.env.TRUSTPILOT_PROFILE_URL ?? "https://uk.trustpilot.com/review/growintek.com",
  FACEBOOK: process.env.FACEBOOK_PROFILE_URL ?? "https://www.facebook.com/growintek",
};

// ─────────────────────────────────────────────────────────────
// Google Business Profile
// Needs OAuth: client id/secret + refresh token minted once with the
// business.manage scope, then GBP_ACCOUNT_ID and GBP_LOCATION_ID.
// ─────────────────────────────────────────────────────────────

async function googleAccessToken(): Promise<string | null> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("google token exchange failed", res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export function googleConfigured(): boolean {
  // Either the Places API key (simplest) or the full OAuth Business Profile setup.
  return Boolean(
    process.env.GOOGLE_PLACES_API_KEY ||
      (process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN &&
        process.env.GBP_ACCOUNT_ID &&
        process.env.GBP_LOCATION_ID)
  );
}

// ─────────────────────────────────────────────────────────────
// Google Places API (New) — reviews without an OAuth dance.
//
// The old `places.reviews` field in the legacy API is gone; Places API (New)
// exposes `places/{id}.reviews` and lets you search for the place id with
// `places:searchText`. That is what this uses when a Places key is present.
// Note the API returns at most five reviews per place, newest-relative first —
// that is a platform limit, not something this code can work around.
// ─────────────────────────────────────────────────────────────

type PlacesReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
  publishTime?: string;
};

async function resolvePlaceId(key: string): Promise<string> {
  if (process.env.GOOGLE_PLACE_ID) return process.env.GOOGLE_PLACE_ID;

  const query = process.env.GOOGLE_PLACE_QUERY || "GrowinTek";
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 5 }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Places search ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    places?: { id?: string; displayName?: { text?: string }; formattedAddress?: string }[];
  };

  const first = json.places?.[0];
  if (!first?.id) {
    throw new Error(
      `No Google Business Profile found for “${query}”. Set GOOGLE_PLACE_ID explicitly.`
    );
  }

  console.info(`[reviews] resolved place: ${first.displayName?.text} (${first.formattedAddress})`);
  return first.id;
}

async function fetchGooglePlacesReviews(): Promise<NormalisedReview[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY!;
  const placeId = await resolvePlaceId(key);

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en&regionCode=GB`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,googleMapsUri,reviews",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Places details ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: PlacesReview[];
  };

  const profileUrl = json.googleMapsUri ?? PROFILE_URL.GOOGLE ?? null;

  return (json.reviews ?? []).map((r, i) => {
    const text = r.text?.text ?? r.originalText?.text ?? "";
    // Google appends "\n\n(Original)\n<text>" for translated reviews — strip it.
    const cleaned = text.split("\n\n(Original)")[0].trim();

    return {
      platform: "GOOGLE" as const,
      externalId: r.name?.split("/reviews/")[1] ?? `${placeId}-${i}-${r.publishTime ?? ""}`,
      authorName: r.authorAttribution?.displayName || "Google reviewer",
      authorUrl: r.authorAttribution?.uri ?? null,
      avatarUrl: r.authorAttribution?.photoUri ?? null,
      rating: r.rating ?? 5,
      text: cleaned || "(rating only, no comment)",
      reviewedAt: r.publishTime ? new Date(r.publishTime) : new Date(),
      platformScore: json.rating ?? null,
      platformTotal: json.userRatingCount ?? null,
      profileUrl,
    };
  });
}

async function fetchGoogleReviews(): Promise<NormalisedReview[]> {
  const token = await googleAccessToken();
  if (!token) throw new Error("Google token unavailable");

  const account = process.env.GBP_ACCOUNT_ID!;
  const location = process.env.GBP_LOCATION_ID!;
  const url = `https://mybusiness.googleapis.com/v4/accounts/${encodeURIComponent(
    account
  )}/locations/${encodeURIComponent(location)}/reviews?pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google reviews ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    reviews?: Array<{
      reviewId: string;
      reviewer?: { displayName?: string; profilePhotoUrl?: string };
      starRating?: string;
      comment?: string;
      createTime?: string;
      averageRating?: number;
      totalReviewCount?: number;
    }>;
    averageRating?: number;
    totalReviewCount?: number;
  };

  const avg = json.averageRating ?? null;
  const total = json.totalReviewCount ?? null;

  return (json.reviews ?? []).map((r) => ({
    platform: "GOOGLE" as const,
    externalId: r.reviewId,
    authorName: r.reviewer?.displayName || "Google reviewer",
    avatarUrl: r.reviewer?.profilePhotoUrl ?? null,
    rating: starToNumber(r.starRating),
    text: r.comment || "(rating only, no comment)",
    reviewedAt: r.createTime ? new Date(r.createTime) : new Date(),
    platformScore: avg,
    platformTotal: total,
    profileUrl: PROFILE_URL.GOOGLE,
  }));
}

function starToNumber(star?: string): number {
  switch (star) {
    case "ONE":
      return 1;
    case "TWO":
      return 2;
    case "THREE":
      return 3;
    case "FOUR":
      return 4;
    case "FIVE":
      return 5;
    default:
      return 5;
  }
}

// ─────────────────────────────────────────────────────────────
// Trustpilot — Business Units API. Requires a paid Business account for
// review API access; the key goes in TRUSTPILOT_API_KEY.
// ─────────────────────────────────────────────────────────────

export function trustpilotConfigured(): boolean {
  return Boolean(process.env.TRUSTPILOT_API_KEY && process.env.TRUSTPILOT_BUSINESS_UNIT_ID);
}

async function fetchTrustpilotReviews(): Promise<NormalisedReview[]> {
  const key = process.env.TRUSTPILOT_API_KEY!;
  const unit = process.env.TRUSTPILOT_BUSINESS_UNIT_ID!;

  const res = await fetch(
    `https://api.trustpilot.com/v1/business-units/${encodeURIComponent(unit)}/reviews?perPage=50&orderBy=recency`,
    { headers: { apikey: key, "Content-Type": "application/json" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Trustpilot ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    reviews?: Array<{
      id: string;
      stars: number;
      title?: string;
      text?: string;
      createdAt: string;
      consumer?: { displayName?: string; imageUrl?: string };
    }>;
    score?: { trustScore?: number; numberOfReviews?: number };
  };

  return (json.reviews ?? []).map((r) => ({
    platform: "TRUSTPILOT" as const,
    externalId: r.id,
    authorName: r.consumer?.displayName || "Trustpilot reviewer",
    avatarUrl: r.consumer?.imageUrl ?? null,
    rating: r.stars,
    text: [r.title, r.text].filter(Boolean).join(" — ") || "(rating only)",
    reviewedAt: new Date(r.createdAt),
    platformScore: json.score?.trustScore ?? null,
    platformTotal: json.score?.numberOfReviews ?? null,
    profileUrl: PROFILE_URL.TRUSTPILOT,
  }));
}

// ─────────────────────────────────────────────────────────────
// Facebook Page ratings.
// Note: Facebook retired the standalone Reviews tab in 2018. Pages now
// collect Recommendations, exposed via the Page 'ratings' edge. A page
// needs a long-lived page token with pages_read_engagement.
// ─────────────────────────────────────────────────────────────

export function facebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);
}

async function fetchFacebookReviews(): Promise<NormalisedReview[]> {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.FACEBOOK_PAGE_TOKEN!;

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
    pageId
  )}/ratings?fields=reviewer{name,picture},rating,review_text,created_time,open_graph_story&limit=50&access_token=${encodeURIComponent(
    token
  )}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Facebook ratings ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as {
    data?: Array<{
      created_time: string;
      rating?: number;
      review_text?: string;
      reviewer?: { name?: string; picture?: { data?: { url?: string } } };
    }>;
  };

  return (json.data ?? [])
    .filter((r) => r.rating)
    .map((r, i) => ({
      platform: "FACEBOOK" as const,
      externalId: `${pageId}-${r.created_time}-${i}`,
      authorName: r.reviewer?.name || "Facebook recommendation",
      avatarUrl: r.reviewer?.picture?.data?.url ?? null,
      rating: r.rating ?? 5,
      text: r.review_text || "(recommendation without text)",
      reviewedAt: new Date(r.created_time),
      profileUrl: PROFILE_URL.FACEBOOK,
    }));
}

// ─────────────────────────────────────────────────────────────
// Sync + read
// ─────────────────────────────────────────────────────────────

export async function syncReviews(): Promise<SyncReport[]> {
  const jobs: Array<{ platform: Platform; configured: boolean; run: () => Promise<NormalisedReview[]> }> = [
    {
      platform: "GOOGLE",
      configured: googleConfigured(),
      run: process.env.GOOGLE_PLACES_API_KEY ? fetchGooglePlacesReviews : fetchGoogleReviews,
    },
    { platform: "TRUSTPILOT", configured: trustpilotConfigured(), run: fetchTrustpilotReviews },
    { platform: "FACEBOOK", configured: facebookConfigured(), run: fetchFacebookReviews },
  ];

  const reports: SyncReport[] = [];

  for (const job of jobs) {
    if (!job.configured) {
      reports.push({
        platform: job.platform,
        ok: false,
        imported: 0,
        message: "No API credentials configured — using stored reviews only.",
      });
      continue;
    }

    try {
      const reviews = await job.run();
      let imported = 0;
      for (const r of reviews) {
        await prisma.review.upsert({
          where: { platform_externalId: { platform: r.platform, externalId: r.externalId } },
          create: {
            platform: r.platform,
            externalId: r.externalId,
            authorName: r.authorName,
            authorUrl: r.authorUrl ?? null,
            avatarUrl: r.avatarUrl ?? null,
            rating: r.rating,
            text: r.text,
            reviewedAt: r.reviewedAt,
            platformScore: r.platformScore ?? null,
            platformTotal: r.platformTotal ?? null,
            profileUrl: r.profileUrl ?? null,
          },
          update: {
            rating: r.rating,
            text: r.text,
            platformScore: r.platformScore ?? null,
            platformTotal: r.platformTotal ?? null,
            syncedAt: new Date(),
          },
        });
        imported += 1;
      }
      reports.push({ platform: job.platform, ok: true, imported, message: `${imported} reviews synced.` });
    } catch (err) {
      reports.push({
        platform: job.platform,
        ok: false,
        imported: 0,
        message: err instanceof Error ? err.message : "Sync failed.",
      });
    }
  }

  return reports;
}

/** Reads from the local cache — never calls a third party on a page render. */
export async function getReviewSummaries(limitPerPlatform = 4): Promise<ReviewSummary[]> {
  const platforms: Platform[] = ["GOOGLE", "TRUSTPILOT", "FACEBOOK"];

  const summaries = await Promise.all(
    platforms.map(async (platform) => {
      const rows = await prisma.review.findMany({
        where: { platform },
        orderBy: { reviewedAt: "desc" },
        take: limitPerPlatform,
      });
      const latest = rows[0];

      // Platform-level totals come from the last sync and apply to all rows.
      const total = latest?.platformTotal ?? rows.length;
      const score =
        latest?.platformScore ??
        (rows.length
          ? rows.reduce((s, r) => s + r.rating, 0) / rows.length
          : null);

      const connected =
        platform === "GOOGLE"
          ? googleConfigured()
          : platform === "TRUSTPILOT"
            ? trustpilotConfigured()
            : facebookConfigured();

      return {
        platform,
        label: LABEL[platform] ?? platform,
        score,
        total,
        profileUrl: latest?.profileUrl ?? PROFILE_URL[platform] ?? null,
        connected,
        syncedAt: latest?.syncedAt ?? null,
        reviews: rows.map((r) => ({
          platform: r.platform,
          externalId: r.externalId,
          authorName: r.authorName,
          rating: r.rating,
          text: r.text,
          reviewedAt: r.reviewedAt,
          avatarUrl: r.avatarUrl,
          profileUrl: r.profileUrl,
        })),
        warning: connected
          ? undefined
          : "API credentials not connected yet.",
      } satisfies ReviewSummary;
    })
  );

  return summaries;
}

/** Combined headline score across connected platforms, weighted by count. */
export function combinedScore(summaries: ReviewSummary[]): {
  score: number | null;
  total: number;
} {
  const withScore = summaries.filter((s) => s.score !== null && s.total > 0);
  if (!withScore.length) return { score: null, total: 0 };
  const total = withScore.reduce((sum, s) => sum + s.total, 0);
  const weighted = withScore.reduce((sum, s) => sum + (s.score ?? 0) * s.total, 0);
  return { score: Math.round((weighted / total) * 10) / 10, total };
}
