import {
  composioConfigured,
  composioFeed,
  normalizeSocial,
} from "./composio.js";
import { createSign } from "node:crypto";
import { settings, list, saveSettings, now } from "./db.js";
export class IntegrationError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}
const configured = (...keys) => keys.every((key) => Boolean(process.env[key]));
export async function integrationStatus(db) {
  const s = await settings(db);
  return [
    {
      id: "dashscope",
      name: "DashScope AI",
      configured: configured("DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL"),
      detail: "Server-side Qwen drafts and keyword ideas",
      required: "DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL",
    },
    {
      id: "search-console",
      name: "Google Search Console",
      configured: configured(
        "GOOGLE_CLIENT_EMAIL",
        "GOOGLE_PRIVATE_KEY",
        "GSC_PROPERTY",
        "SITE_URL",
      ),
      detail: "Queries, average position and sitemap submission",
      required: "Google service account, GSC_PROPERTY, SITE_URL",
    },
    {
      id: "analytics",
      name: "Google Analytics 4",
      configured:
        configured(
          "GOOGLE_CLIENT_EMAIL",
          "GOOGLE_PRIVATE_KEY",
          "GA4_PROPERTY_ID",
        ) && Boolean(s.gaId),
      detail: "Consent-based tracking and measured reports",
      required: "Google service account, GA4_PROPERTY_ID, measurement ID",
    },
    {
      id: "social-updates",
      name: "Automatic social updates",
      configured: ["facebook", "instagram", "youtube"].some(composioConfigured),
      detail: process.env.VERCEL
        ? "Daily at 09:00 Pakistan time through the deployed cron. Signed webhooks refresh supported events sooner."
        : "Feeds refresh hourly while the server runs. YouTube trigger notifications queue an earlier refresh when the listener is enabled.",
      required: "Connected social accounts and a running worker or deployed cron",
    },
    {
      id: "composio-webhook",
      name: "Composio webhook",
      configured: configured("COMPOSIO_WEBHOOK_SECRET"),
      detail:
        "Signed event delivery refreshes public feeds, with replay protection",
      required: "COMPOSIO_WEBHOOK_SECRET and matching connected account IDs",
      endpoint: process.env.SITE_URL
        ? process.env.SITE_URL + "/api/webhooks/composio"
        : "/api/webhooks/composio",
    },
    {
      id: "business-profile",
      name: "Google Business Profile",
      configured: configured(
        "GOOGLE_BUSINESS_CLIENT_ID",
        "GOOGLE_BUSINESS_CLIENT_SECRET",
        "GOOGLE_BUSINESS_REFRESH_TOKEN",
      ),
      detail:
        "Read managed business accounts after Google project approval and owner authorization",
      required:
        "Approved Business Profile API access and owner OAuth refresh token",
    },
    {
      id: "indexnow",
      name: "IndexNow",
      configured: configured("INDEXNOW_KEY", "SITE_URL"),
      detail: "Notify participating search engines about published URLs",
      required: "INDEXNOW_KEY, SITE_URL",
    },
    {
      id: "facebook",
      name: "Facebook",
      configured:
        composioConfigured("facebook") ||
        configured("META_PAGE_ID", "META_ACCESS_TOKEN"),
      detail: "Recent public page posts",
      required: "Composio API key, user ID, Facebook account ID, META_PAGE_ID",
    },
    {
      id: "instagram",
      name: "Instagram",
      configured:
        composioConfigured("instagram") ||
        configured("INSTAGRAM_ACCOUNT_ID", "META_ACCESS_TOKEN"),
      detail: "Recent professional-account media",
      required: "Composio API key, user ID, Instagram account ID",
    },
    {
      id: "youtube",
      name: "YouTube",
      configured:
        composioConfigured("youtube") ||
        configured("YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"),
      detail: "Recent channel videos",
      required:
        "Composio API key, user ID, YouTube account ID, YOUTUBE_CHANNEL_ID",
    },
  ];
}
async function fetchJson(url, options = {}, provider = "Provider") {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new IntegrationError(
      `${provider} could not be reached. Check its connection and try again.`,
      502,
    );
  }
  if (!response.ok)
    throw new IntegrationError(
      `${provider} returned HTTP ${response.status}. Check credentials, permissions and quota.`,
      502,
    );
  try {
    return await response.json();
  } catch {
    throw new IntegrationError(
      `${provider} returned an unreadable response.`,
      502,
    );
  }
}
export async function dashscope(messages) {
  if (!configured("DASHSCOPE_API_KEY", "DASHSCOPE_BASE_URL"))
    throw new IntegrationError(
      "Configure the DashScope key and regional base URL on the server first.",
    );
  const base = new URL(process.env.DASHSCOPE_BASE_URL);
  if (
    base.protocol !== "https:" ||
    !/^(?:[a-z0-9-]+\.)*(?:aliyuncs\.com)$/.test(base.hostname)
  )
    throw new IntegrationError(
      "DashScope base URL must be an official HTTPS aliyuncs.com endpoint.",
    );
  const data = await fetchJson(
    `${base.href.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_MODEL || "qwen-plus",
        messages,
        temperature: 0.65,
        max_tokens: 6500,
        response_format: { type: "json_object" },
        enable_thinking: false,
      }),
    },
    "DashScope",
  );
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    throw new IntegrationError(
      "DashScope returned invalid structured content. No article was published.",
      502,
    );
  }
}
let googleCache;
export async function googleToken() {
  if (!configured("GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"))
    throw new IntegrationError(
      "Configure the Google service account on the server first.",
    );
  if (googleCache && googleCache.expires > Date.now()) return googleCache.token;
  const iat = Math.floor(Date.now() / 1000);
  const encode = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: process.env.GOOGLE_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 })}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  let signature;
  try {
    signature = signer.sign(
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      "base64url",
    );
  } catch {
    throw new IntegrationError(
      "The Google private key is not a valid PEM key.",
    );
  }
  const data = await fetchJson(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${unsigned}.${signature}`,
      }),
    },
    "Google OAuth",
  );
  googleCache = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}
export async function searchConsoleReport() {
  if (!process.env.GSC_PROPERTY)
    throw new IntegrationError(
      "Set GSC_PROPERTY and grant the service account access to the verified property.",
    );
  const token = await googleToken();
  const end = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    start = new Date(Date.now() - 31 * 86400000).toISOString().slice(0, 10);
  const data = await fetchJson(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_PROPERTY)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        dimensions: ["query"],
        rowLimit: 100,
      }),
    },
    "Search Console",
  );
  return {
    startDate: start,
    endDate: end,
    rows: data.rows || [],
    note: "Average positions reflect the property and date range; they are not fixed live rankings.",
  };
}
export async function analyticsReport() {
  if (!process.env.GA4_PROPERTY_ID)
    throw new IntegrationError(
      "Set GA4_PROPERTY_ID and grant the Google service account Viewer access.",
    );
  const token = await googleToken();
  const daily = await fetchJson(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(process.env.GA4_PROPERTY_ID)}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
      }),
    },
    "Google Analytics",
  );
  const property = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(process.env.GA4_PROPERTY_ID)}`;
  const report = (suffix, body) =>
    fetchJson(
      property + suffix,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      "Google Analytics",
    );
  const extra = await Promise.allSettled([
    report(":runReport", {
      dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagedSessions" },
      ],
    }),
    report(":runRealtimeReport", { metrics: [{ name: "activeUsers" }] }),
    report(":runReport", {
      dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    fetchJson(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${encodeURIComponent(process.env.GA4_PROPERTY_ID)}/dataStreams`,
      { headers: { Authorization: `Bearer ${token}` } },
      "Analytics Admin",
    ),
  ]);
  const value = (i) =>
    extra[i].status === "fulfilled" ? extra[i].value : null;
  const streams = (value(3)?.dataStreams || [])
    .filter((s) => s.type === "WEB_DATA_STREAM")
    .map((s) => ({
      name: s.displayName,
      measurementId: s.webStreamData?.measurementId,
      url: s.webStreamData?.defaultUri,
    }));
  return {
    ...daily,
    propertyId: process.env.GA4_PROPERTY_ID,
    serviceAccount: process.env.GOOGLE_CLIENT_EMAIL,
    summary: value(0)?.rows?.[0]?.metricValues?.map((m) => Number(m.value)) || [
      0, 0, 0, 0,
    ],
    realtime: value(1)
      ? (value(1).rows?.[0]?.metricValues?.[0]?.value ?? "0")
      : null,
    channels: value(2)?.rows || [],
    streams,
    checkedAt: now(),
    warnings: extra.flatMap((x, i) =>
      x.status === "rejected"
        ? [
            ["Totals", "Realtime", "Channels", "Admin API"][i] +
              ": " +
              x.reason.message,
          ]
        : [],
    ),
  };
}
export async function submitSitemap() {
  if (!configured("GSC_PROPERTY", "SITE_URL"))
    throw new IntegrationError(
      "Configure SITE_URL and the verified Search Console property.",
    );
  const token = await googleToken(),
    sitemap = `${process.env.SITE_URL.replace(/\/$/, "")}/sitemap.xml`;
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_PROPERTY)}/sitemaps/${encodeURIComponent(sitemap)}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new IntegrationError(
      `Search Console returned HTTP ${response.status}. Sitemap submission was not confirmed.`,
      502,
    );
  return {
    message:
      "Sitemap submitted to Search Console. Google decides whether and when to index URLs.",
  };
}
export async function notifyIndexNow(paths) {
  if (!configured("SITE_URL", "INDEXNOW_KEY"))
    throw new IntegrationError(
      "Configure SITE_URL and INDEXNOW_KEY on the server first.",
    );
  const base = new URL(process.env.SITE_URL),
    key = process.env.INDEXNOW_KEY;
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key))
    throw new IntegrationError(
      "INDEXNOW_KEY must contain 8–128 letters, digits or hyphens.",
    );
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: base.host,
      key,
      keyLocation: `${base.origin}/${key}.txt`,
      urlList: paths.map((path) => new URL(path, base).href),
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (![200, 202].includes(response.status))
    throw new IntegrationError(
      `IndexNow returned HTTP ${response.status}.`,
      502,
    );
  return {
    message:
      "URL notification accepted by IndexNow. Acceptance does not guarantee indexing.",
  };
}
export async function refreshSocial(db) {
  const version = process.env.META_GRAPH_VERSION || "v24.0";
  const tasks = {
    facebook: async () => {
      const d = await fetchJson(
        `https://graph.facebook.com/${version}/${encodeURIComponent(process.env.META_PAGE_ID)}/posts?fields=id,message,created_time,permalink_url,full_picture,attachments,from,is_published,is_hidden&limit=12`,
        {
          headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
        },
        "Facebook",
      );
      return normalizeSocial(
        "facebook",
        d.data || [],
        process.env.META_PAGE_ID,
      );
    },
    instagram: async () => {
      const d = await fetchJson(
        `https://graph.facebook.com/${version}/${encodeURIComponent(process.env.INSTAGRAM_ACCOUNT_ID)}/media?fields=id,caption,permalink,media_url,media_type,media_product_type,thumbnail_url,timestamp&limit=12`,
        {
          headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
        },
        "Instagram",
      );
      return normalizeSocial("instagram", d.data || []);
    },
    youtube: async () => {
      const c = await fetchJson(
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(process.env.YOUTUBE_CHANNEL_ID)}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY)}`,
        {},
        "YouTube",
      );
      const playlist = c.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!playlist)
        throw new IntegrationError("YouTube channel was not found.");
      const d = await fetchJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=6&playlistId=${encodeURIComponent(playlist)}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY)}`,
        {},
        "YouTube",
      );
      const ids = (d.items || []).map((p) => p.snippet.resourceId.videoId);
      if (!ids.length) return [];
      const details = await fetchJson(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${ids.join(",")}&key=${encodeURIComponent(process.env.YOUTUBE_API_KEY)}`,
        {},
        "YouTube",
      );
      return normalizeSocial(
        "youtube",
        details.items || [],
        process.env.YOUTUBE_CHANNEL_ID,
      );
    },
  };
  const status = await integrationStatus(db),
    previous = (await settings(db)).socialCache || {},
    cache = {};
  await Promise.all(
    Object.entries(tasks).map(async ([name, fn]) => {
      if (!status.find((s) => s.id === name).configured) {
        cache[name] = previous[name] || { status: "unconfigured", posts: [] };
        return;
      }
      try {
        cache[name] = {
          status: "connected",
          posts: await (composioConfigured(name) ? composioFeed(name) : fn()),
          updatedAt: now(),
        };
      } catch (e) {
        cache[name] = {
          ...previous[name],
          status: "error",
          error: e.message,
          posts: previous[name]?.posts || [],
        };
      }
    }),
  );
  await db.transaction(async () => {
    const s = await settings(db);
    await saveSettings(db, { ...s, socialCache: cache });
  })();
  return cache;
}
export async function seoAudit(db) {
  const docs = (
    await Promise.all(
      ["services", "pages", "posts", "portfolio"].map(async (kind) =>
        (await list(db, kind))
          .filter((d) => d.status === "published")
          .map((d) => ({ ...d, kind })),
      ),
    )
  ).flat();
  const findings = [];
  for (const d of docs) {
    const prefix =
      d.kind === "posts" ? "/blog/" : d.kind === "pages" ? "/" : `/${d.kind}/`;
    const path =
      d.kind === "pages" && d.slug === "home" ? "/" : prefix + d.slug;
    const templateContent =
      d.kind === "pages" &&
      [
        "home",
        "about",
        "services",
        "seo",
        "portfolio",
        "blog",
        "contact",
      ].includes(d.slug);
    for (const [name, pass, detail] of [
      [
        "Page title",
        Boolean(d.seoTitle || d.title),
        "Add a unique, descriptive title.",
      ],
      [
        "Meta description",
        (d.seoDescription || d.description || "").length >= 50 &&
          (d.seoDescription || d.description || "").length <= 160,
        "Aim for a useful description around 50–160 characters.",
      ],
      [
        "Useful content",
        templateContent || (d.content || "").length >= 200,
        "Add substantive, helpful page content.",
      ],
      [
        "Editorial review",
        !d.aiGenerated || Boolean(d.reviewed && d.reviewer),
        "Identify the editor and verify AI-assisted content.",
      ],
      [
        "Image description",
        d.kind !== "portfolio" || Boolean(d.imageAlt),
        "Describe portfolio artwork for nonvisual readers.",
      ],
    ])
      findings.push({
        path,
        check: name,
        pass,
        detail: pass ? "Present" : detail,
      });
  }
  findings.push({
    path: "Site",
    check: "Production canonical domain",
    pass: Boolean(process.env.SITE_URL?.startsWith("https://")),
    detail: "Configure the canonical HTTPS SITE_URL before launch.",
  });
  findings.push({
    path: "Site",
    check: "Legal operator details",
    pass: Boolean((await settings(db)).email && (await settings(db)).country),
    detail: "Confirm business contact email and legal jurisdiction.",
  });
  return {
    checkedAt: now(),
    score: Math.round(
      (findings.filter((f) => f.pass).length / Math.max(findings.length, 1)) *
        100,
    ),
    findings,
    scope:
      "Content and configuration checks. This is not a backlink, field performance or full accessibility audit.",
  };
}
