// Read-only Composio tools. Connected account IDs belong to the deployment's project.
const channelKey = (name) => `COMPOSIO_${name.toUpperCase()}_ACCOUNT_ID`;
export const composioConfigured = (name) =>
  Boolean(process.env.COMPOSIO_API_KEY && process.env[channelKey(name)]);
export async function executeComposio(name, slug, args) {
  if (!composioConfigured(name))
    throw new Error(`Configure Composio for ${name} first.`);
  const response = await fetch(
    `https://backend.composio.dev/api/v3.1/tools/execute/${slug}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.COMPOSIO_API_KEY,
      },
      body: JSON.stringify({
        connected_account_id: process.env[channelKey(name)],
        version: process.env.COMPOSIO_TOOL_VERSION || "latest",
        arguments: args,
      }),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Composio ${name} returned HTTP ${response.status}. Check the connection and quota.`,
    );
  const result = await response.json();
  if (!result.successful)
    throw new Error(
      `Composio could not read ${name}. Check the connected account and permissions.`,
    );
  return result.data;
}
const safe = (value, hosts) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h))
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
};
export function normalizeSocial(name, items, owner) {
  return items
    .flatMap((p) => {
      let result;
      if (name === "facebook") {
        if (
          p.is_published !== true ||
          p.is_hidden === true ||
          String(p.from?.id) !== String(owner)
        )
          return [];
        const url = safe(p.permalink_url, ["facebook.com"]);
        const attachment = p.attachments?.data?.[0];
        result = {
          id: p.id,
          text: p.message || "From Growintek",
          url,
          image: safe(p.full_picture || attachment?.media?.image?.src, [
            "fbcdn.net",
          ]),
          date: p.created_time,
          kind: url?.includes("/reel/")
            ? "reel"
            : attachment?.type?.includes("video")
              ? "video"
              : "post",
        };
      } else if (name === "instagram") {
        const url = safe(p.permalink, ["instagram.com"]);
        result = {
          id: p.id,
          text: p.caption || "From Growintek",
          url,
          image: safe(
            p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
            ["cdninstagram.com", "fbcdn.net"],
          ),
          date: p.timestamp,
          kind:
            p.media_product_type === "REELS" || url?.includes("/reel/")
              ? "reel"
              : p.media_type === "VIDEO"
                ? "video"
                : "post",
        };
      } else {
        if (
          p.status?.privacyStatus !== "public" ||
          p.snippet?.channelId !== owner ||
          !/^[\w-]{11}$/.test(p.id)
        )
          return [];
        result = {
          id: p.id,
          text: p.snippet.title,
          url: `https://www.youtube.com/watch?v=${p.id}`,
          image: safe(p.snippet.thumbnails?.high?.url, ["ytimg.com"]),
          date: p.snippet.publishedAt,
          kind: "video",
          ...(p.status.embeddable ? { embedId: p.id } : {}),
        };
      }
      return result.url
        ? [{ ...result, text: String(result.text).slice(0, 1000) }]
        : [];
    })
    .slice(0, 12);
}
export async function composioFeed(name) {
  if (name === "facebook") {
    const owner = process.env.META_PAGE_ID;
    if (!owner) throw new Error("Set the Facebook Page ID.");
    const data = await executeComposio(name, "FACEBOOK_GET_PAGE_POSTS", {
      page_id: owner,
      limit: 12,
      fields:
        "id,message,created_time,permalink_url,full_picture,attachments,from,is_published,is_hidden",
    });
    return normalizeSocial(name, data.data || [], owner);
  }
  if (name === "instagram") {
    const data = await executeComposio(name, "INSTAGRAM_GET_IG_USER_MEDIA", {
      ig_user_id: process.env.INSTAGRAM_ACCOUNT_ID || "me",
      limit: 12,
      fields:
        "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
    });
    return normalizeSocial(name, data.data || []);
  }
  const owner = process.env.YOUTUBE_CHANNEL_ID;
  if (!owner) throw new Error("Set the YouTube channel ID.");
  const data = await executeComposio(name, "YOUTUBE_LIST_CHANNEL_VIDEOS", {
    channelId: owner,
    maxResults: 12,
  });
  const ids = (data.items || [])
    .map((p) => p.snippet?.resourceId?.videoId || p.id?.videoId)
    .filter(Boolean);
  if (!ids.length) return [];
  const details = await executeComposio(
    name,
    "YOUTUBE_GET_VIDEO_DETAILS_BATCH",
    { id: ids, parts: ["snippet", "status"] },
  );
  return normalizeSocial(name, details.items || [], owner);
}
