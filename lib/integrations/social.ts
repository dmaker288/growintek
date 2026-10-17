import "server-only";
import { prisma } from "@/lib/db";
import { executeTool, unwrap, composioConfigured } from "./composio";
import type {
  NormalisedSocialPost,
  SocialFeed,
  SocialPlatform,
  SyncReport,
} from "./types";

/**
 * Social feeds.
 *
 * Primary path: Composio, which already holds the Meta and Google OAuth
 * grants — no social tokens are stored in this app.
 * Fallback path: direct Graph/Data API calls using the env credentials,
 * kept so the site still works if Composio is ever disconnected.
 *
 * Everything is cached into SocialPost, so page renders never wait on a
 * third-party API.
 */

const IG_ACCOUNT = () => process.env.COMPOSIO_INSTAGRAM_ACCOUNT_ID;
const FB_ACCOUNT = () => process.env.COMPOSIO_FACEBOOK_ACCOUNT_ID;
const YT_ACCOUNT = () => process.env.COMPOSIO_YOUTUBE_ACCOUNT_ID;

export function instagramConnected(): boolean {
  return Boolean(
    (composioConfigured() && IG_ACCOUNT()) ||
      (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID && process.env.FACEBOOK_PAGE_TOKEN)
  );
}

export function youtubeConnected(): boolean {
  return Boolean(
    (composioConfigured() && YT_ACCOUNT()) ||
      (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID)
  );
}

export function facebookConnected(): boolean {
  return Boolean(
    (composioConfigured() && FB_ACCOUNT()) ||
      (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN)
  );
}

// ─────────────────────────────────────────────────────────────
// Composio adapters
// ─────────────────────────────────────────────────────────────

type AnyRec = Record<string, unknown>;

function list(payload: Record<string, unknown>): AnyRec[] {
  const candidates = [payload.data, payload.items, payload.media, payload.posts, payload.videos];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as AnyRec[];
  }
  return [];
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function fetchInstagramViaComposio(): Promise<NormalisedSocialPost[]> {
  const res = await executeTool(
    "INSTAGRAM_GET_IG_USER_MEDIA",
    {
      ig_user_id: "me",
      limit: 24,
      fields:
        "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,total_like_count,total_comments_count,total_views_count",
    },
    IG_ACCOUNT()
  );
  if (!res.ok) throw new Error(res.error ?? "Instagram via Composio failed");

  const rows = list(unwrap(res));

  return rows.map((m) => {
    const isVideo = m.media_type === "VIDEO";
    const isReel = m.media_product_type === "REELS";
    // media_url on video expires; thumbnail_url is the durable preview.
    const thumb = str(m.thumbnail_url) ?? (isVideo ? null : str(m.media_url));

    return {
      platform: "instagram" as const,
      externalId: String(m.id),
      kind: isReel ? ("reel" as const) : isVideo ? ("video" as const) : ("image" as const),
      caption: str(m.caption)?.slice(0, 400) ?? null,
      thumbnailUrl: thumb,
      mediaUrl: str(m.media_url),
      permalink: str(m.permalink),
      postedAt: m.timestamp ? new Date(String(m.timestamp)) : new Date(),
      metrics: {
        likes: num(m.total_like_count ?? m.like_count),
        comments: num(m.total_comments_count ?? m.comments_count),
        views: num(m.total_views_count ?? m.view_count),
      },
    };
  });
}

async function fetchFacebookViaComposio(): Promise<NormalisedSocialPost[]> {
  const pageId = process.env.FACEBOOK_PAGE_ID || "me";

  const [posts, videos] = await Promise.all([
    executeTool(
      "FACEBOOK_GET_PAGE_POSTS",
      {
        page_id: pageId,
        limit: 20,
        fields:
          "id,message,created_time,permalink_url,full_picture,reactions.summary(true),comments.summary(true),shares",
      },
      FB_ACCOUNT()
    ),
    executeTool(
      "FACEBOOK_GET_PAGE_VIDEOS",
      { page_id: pageId, limit: 10, fields: "id,created_time,description,title,picture,permalink_url" },
      FB_ACCOUNT()
    ),
  ]);

  const out: NormalisedSocialPost[] = [];
  const seen = new Set<string>();

  for (const p of list(unwrap(posts))) {
    const id = String(p.id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const reactions = (p.reactions as AnyRec | undefined)?.summary as AnyRec | undefined;
    const commentsSummary = (p.comments as AnyRec | undefined)?.summary as AnyRec | undefined;
    const shares = p.shares as AnyRec | undefined;

    out.push({
      platform: "facebook",
      externalId: id,
      kind: "post",
      caption: str(p.message)?.slice(0, 400) ?? null,
      thumbnailUrl: str(p.full_picture),
      mediaUrl: str(p.permalink_url),
      permalink: str(p.permalink_url),
      postedAt: p.created_time ? new Date(String(p.created_time)) : new Date(),
      metrics: {
        reactions: num(reactions?.total_count),
        comments: num(commentsSummary?.total_count),
        shares: num(shares?.count),
      },
    });
  }

  for (const v of list(unwrap(videos))) {
    const id = String(v.id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);

    out.push({
      platform: "facebook",
      externalId: id,
      kind: "video",
      caption: (str(v.title) ?? str(v.description))?.slice(0, 400) ?? null,
      thumbnailUrl: str(v.picture),
      mediaUrl: str(v.permalink_url),
      permalink: str(v.permalink_url),
      postedAt: v.created_time ? new Date(String(v.created_time)) : new Date(),
      metrics: {},
    });
  }

  return out.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
}

async function fetchYouTubeViaComposio(): Promise<NormalisedSocialPost[]> {
  const channel = process.env.YOUTUBE_CHANNEL_ID || "@growinteksolutions";

  const res = await executeTool(
    "YOUTUBE_LIST_CHANNEL_VIDEOS",
    { channelId: channel, part: "snippet", maxResults: 30 },
    YT_ACCOUNT()
  );
  if (!res.ok) throw new Error(res.error ?? "YouTube via Composio failed");

  const payload = unwrap(res);
  const rows = list(payload);

  const posts: NormalisedSocialPost[] = rows
    .map((item): NormalisedSocialPost | null => {
      const snip = (item.snippet ?? {}) as AnyRec;
      const resource = (snip.resourceId ?? {}) as AnyRec;
      const id = str(resource.videoId);
      if (!id) return null;

      const thumbs = (snip.thumbnails ?? {}) as Record<string, { url?: string }>;
      const thumb = thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? null;
      const title = str(snip.title);
      const looksShort = title ? /#shorts|#short\b/i.test(title) : false;

      return {
        platform: "youtube" as const,
        externalId: id,
        kind: looksShort ? ("short" as const) : ("video" as const),
        caption: title,
        thumbnailUrl: thumb ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        mediaUrl: `https://www.youtube.com/watch?v=${id}`,
        permalink: looksShort
          ? `https://www.youtube.com/shorts/${id}`
          : `https://www.youtube.com/watch?v=${id}`,
        postedAt: snip.publishedAt ? new Date(String(snip.publishedAt)) : new Date(),
        metrics: {},
      };
    })
    .filter((p): p is NormalisedSocialPost => p !== null);

  // Enrich durations so Shorts are classified properly, not by hashtag alone.
  const ids = posts.map((p) => p.externalId).slice(0, 50);
  if (ids.length > 0) {
    try {
      const details = await executeTool(
        "YOUTUBE_GET_VIDEO_DETAILS_BATCH",
        { id: ids.join(",") },
        YT_ACCOUNT()
      );
      if (details.ok) {
        const byId = new Map<string, AnyRec>();
        for (const item of list(unwrap(details))) {
          if (item.id) byId.set(String(item.id), item);
        }

        for (const post of posts) {
          const detail = byId.get(post.externalId);
          if (!detail) continue;
          const seconds = isoSeconds(
            String(((detail.contentDetails ?? {}) as AnyRec).duration ?? "")
          );
          if (seconds > 0 && seconds <= 61) {
            post.kind = "short";
            post.permalink = `https://www.youtube.com/shorts/${post.externalId}`;
          }
          post.metrics = {
            ...post.metrics,
            views: num(((detail.statistics ?? {}) as AnyRec).viewCount),
            likes: num(((detail.statistics ?? {}) as AnyRec).likeCount),
            seconds,
          };
        }
      }
    } catch {
      // duration is an enhancement, not a requirement
    }
  }

  return posts;
}

function isoSeconds(iso: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return num(d) * 86400 + num(h) * 3600 + num(min) * 60 + num(s);
}

// ─────────────────────────────────────────────────────────────
// Direct API fallbacks (used only when Composio is not configured)
// ─────────────────────────────────────────────────────────────

async function fetchInstagramDirect(): Promise<NormalisedSocialPost[]> {
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID!;
  const token = process.env.FACEBOOK_PAGE_TOKEN!;
  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(igId)}/media?fields=${fields}&limit=24&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Instagram ${res.status}`);
  const json = (await res.json()) as { data?: AnyRec[] };

  return (json.data ?? []).map((m) => ({
    platform: "instagram" as const,
    externalId: String(m.id),
    kind: m.media_type === "VIDEO" ? ("reel" as const) : ("image" as const),
    caption: str(m.caption)?.slice(0, 400) ?? null,
    thumbnailUrl: str(m.thumbnail_url) ?? (m.media_type === "IMAGE" ? str(m.media_url) : null),
    mediaUrl: str(m.media_url),
    permalink: str(m.permalink),
    postedAt: m.timestamp ? new Date(String(m.timestamp)) : new Date(),
    metrics: { likes: num(m.like_count), comments: num(m.comments_count) },
  }));
}

async function fetchYouTubeDirect(): Promise<NormalisedSocialPost[]> {
  const key = process.env.YOUTUBE_API_KEY!;
  const channelId = process.env.YOUTUBE_CHANNEL_ID!;

  const ch = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(key)}`,
    { cache: "no-store" }
  );
  if (!ch.ok) throw new Error(`YouTube channel ${ch.status}`);
  const chJson = (await ch.json()) as { items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] };
  const uploads = chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("YouTube uploads playlist not found");

  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${encodeURIComponent(uploads)}&maxResults=30&key=${encodeURIComponent(key)}`,
    { cache: "no-store" }
  );
  if (!listRes.ok) throw new Error(`YouTube playlist ${listRes.status}`);
  const listJson = (await listRes.json()) as { items?: { snippet: AnyRec }[] };

  return (listJson.items ?? []).map((item) => {
    const snip = item.snippet;
    const id = String(((snip.resourceId ?? {}) as AnyRec).videoId ?? "");
    const thumbs = (snip.thumbnails ?? {}) as Record<string, { url?: string }>;
    return {
      platform: "youtube" as const,
      externalId: id,
      kind: "video" as const,
      caption: str(snip.title),
      thumbnailUrl: thumbs.high?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      mediaUrl: `https://www.youtube.com/watch?v=${id}`,
      permalink: `https://www.youtube.com/watch?v=${id}`,
      postedAt: new Date(String(snip.publishedAt)),
      metrics: {},
    };
  });
}

async function fetchFacebookDirect(): Promise<NormalisedSocialPost[]> {
  const pageId = process.env.FACEBOOK_PAGE_ID!;
  const token = process.env.FACEBOOK_PAGE_TOKEN!;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/posts?fields=id,message,permalink_url,created_time,full_picture&limit=16&access_token=${encodeURIComponent(token)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Facebook posts ${res.status}`);
  const json = (await res.json()) as { data?: AnyRec[] };

  return (json.data ?? []).map((p) => ({
    platform: "facebook" as const,
    externalId: String(p.id),
    kind: "post" as const,
    caption: str(p.message)?.slice(0, 400) ?? null,
    thumbnailUrl: str(p.full_picture),
    mediaUrl: str(p.permalink_url),
    permalink: str(p.permalink_url),
    postedAt: new Date(String(p.created_time)),
    metrics: {},
  }));
}

// ─────────────────────────────────────────────────────────────
// Sync
// ─────────────────────────────────────────────────────────────

export async function syncSocial(): Promise<SyncReport[]> {
  const jobs: {
    platform: SocialPlatform;
    connected: boolean;
    run: () => Promise<NormalisedSocialPost[]>;
  }[] = [
    {
      platform: "instagram",
      connected: instagramConnected(),
      run: composioConfigured() && IG_ACCOUNT() ? fetchInstagramViaComposio : fetchInstagramDirect,
    },
    {
      platform: "youtube",
      connected: youtubeConnected(),
      run: composioConfigured() && YT_ACCOUNT() ? fetchYouTubeViaComposio : fetchYouTubeDirect,
    },
    {
      platform: "facebook",
      connected: facebookConnected(),
      run: composioConfigured() && FB_ACCOUNT() ? fetchFacebookViaComposio : fetchFacebookDirect,
    },
  ];

  const reports: SyncReport[] = [];

  for (const job of jobs) {
    if (!job.connected) {
      reports.push({
        platform: job.platform,
        ok: false,
        imported: 0,
        message: "Not connected — add the Composio account id or direct API credentials.",
      });
      continue;
    }

    try {
      const posts = await job.run();
      let imported = 0;

      for (const p of posts) {
        if (!p.externalId) continue;
        await prisma.socialPost.upsert({
          where: { platform_externalId: { platform: p.platform, externalId: p.externalId } },
          create: {
            platform: p.platform,
            externalId: p.externalId,
            kind: p.kind,
            caption: p.caption ?? null,
            thumbnailUrl: p.thumbnailUrl ?? null,
            mediaUrl: p.mediaUrl ?? null,
            permalink: p.permalink ?? null,
            postedAt: p.postedAt,
            metrics: p.metrics ?? {},
          },
          update: {
            kind: p.kind,
            caption: p.caption ?? null,
            thumbnailUrl: p.thumbnailUrl ?? null,
            mediaUrl: p.mediaUrl ?? null,
            permalink: p.permalink ?? null,
            metrics: p.metrics ?? {},
            syncedAt: new Date(),
          },
        });
        imported += 1;
      }

      reports.push({
        platform: job.platform,
        ok: true,
        imported,
        message: `${imported} ${job.platform} items synced${composioConfigured() ? " via Composio" : ""}.`,
      });
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

export async function getSocialFeeds(limit = 12): Promise<SocialFeed[]> {
  const config: { platform: SocialPlatform; label: string; connected: boolean }[] = [
    { platform: "instagram", label: "Instagram", connected: instagramConnected() },
    { platform: "youtube", label: "YouTube Shorts", connected: youtubeConnected() },
    { platform: "facebook", label: "Facebook", connected: facebookConnected() },
  ];

  return Promise.all(
    config.map(async ({ platform, label, connected }) => {
      const rows = await prisma.socialPost.findMany({
        where: { platform },
        orderBy: { postedAt: "desc" },
        take: limit,
      });

      return {
        platform,
        label,
        connected,
        posts: rows.map((r) => ({
          platform: r.platform as SocialPlatform,
          externalId: r.externalId,
          kind: r.kind as NormalisedSocialPost["kind"],
          caption: r.caption,
          thumbnailUrl: r.thumbnailUrl,
          mediaUrl: r.mediaUrl,
          permalink: r.permalink,
          postedAt: r.postedAt,
          metrics: (r.metrics as Record<string, number>) ?? {},
        })),
        syncedAt: rows[0]?.syncedAt ?? null,
        warning: connected ? undefined : "Not connected yet.",
      } satisfies SocialFeed;
    })
  );
}

/** True when at least one feed has cached posts to show. */
export async function hasSocialPosts(): Promise<boolean> {
  const count = await prisma.socialPost.count();
  return count > 0;
}
