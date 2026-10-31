import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import {
  dashscope,
  searchConsoleReport,
  analyticsReport,
  submitSitemap,
  notifyIndexNow,
  refreshSocial,
} from "../server/integrations.js";
import { openDatabase, seed } from "../server/db.js";
const originalFetch = globalThis.fetch;
const keys = [
  "DASHSCOPE_API_KEY",
  "DASHSCOPE_BASE_URL",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GSC_PROPERTY",
  "GA4_PROPERTY_ID",
  "SITE_URL",
  "INDEXNOW_KEY",
  "META_PAGE_ID",
  "META_ACCESS_TOKEN",
  "INSTAGRAM_ACCOUNT_ID",
  "YOUTUBE_API_KEY",
  "YOUTUBE_CHANNEL_ID",
];
const before = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const k of keys) {
    if (before[k] === undefined) delete process.env[k];
    else process.env[k] = before[k];
  }
});
test("DashScope sends an authenticated regional JSON request and validates failures", async () => {
  process.env.DASHSCOPE_API_KEY = "test-secret";
  process.env.DASHSCOPE_BASE_URL =
    "https://workspace.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return Response.json({
      choices: [{ message: { content: JSON.stringify({ ideas: [] }) } }],
    });
  };
  assert.deepEqual(await dashscope([{ role: "user", content: "Example" }]), {
    ideas: [],
  });
  assert.match(call.url, /\/chat\/completions$/);
  assert.equal(call.options.headers.Authorization, "Bearer test-secret");
  assert.equal(
    JSON.parse(call.options.body).response_format.type,
    "json_object",
  );
  globalThis.fetch = async () => new Response("", { status: 401 });
  await assert.rejects(() => dashscope([]), /HTTP 401/);
  process.env.DASHSCOPE_BASE_URL = "https://untrusted.example/v1";
  await assert.rejects(() => dashscope([]), /official HTTPS/);
});
test("Google service-account adapters request real query and analytics shapes and submit a sitemap", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.GOOGLE_PRIVATE_KEY = privateKey.export({
    type: "pkcs8",
    format: "pem",
  });
  process.env.GOOGLE_CLIENT_EMAIL = "test@example.iam.gserviceaccount.com";
  process.env.GSC_PROPERTY = "sc-domain:growintek.example";
  process.env.GA4_PROPERTY_ID = "123456";
  process.env.SITE_URL = "https://growintek.example";
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes("oauth2"))
      return Response.json({
        access_token: "google-test-token",
        expires_in: 3600,
      });
    if (url.includes("searchAnalytics"))
      return Response.json({
        rows: [
          {
            keys: ["web development"],
            clicks: 3,
            impressions: 40,
            ctr: 0.075,
            position: 8.4,
          },
        ],
      });
    if (url.includes("runReport"))
      return Response.json({
        rows: [
          {
            dimensionValues: [{ value: "20261001" }],
            metricValues: [{ value: "12" }, { value: "14" }, { value: "22" }],
          },
        ],
      });
    return new Response("", { status: 200 });
  };
  const search = await searchConsoleReport();
  assert.equal(search.rows[0].position, 8.4);
  assert.deepEqual(
    JSON.parse(
      calls.find((c) => c.url.includes("searchAnalytics")).options.body,
    ).dimensions,
    ["query"],
  );
  const analytics = await analyticsReport();
  assert.equal(analytics.rows[0].metricValues[0].value, "12");
  assert.match((await submitSitemap()).message, /submitted/);
  assert.equal(
    calls.find((c) => c.url.includes("/sitemaps/")).options.method,
    "PUT",
  );
});
test("IndexNow posts only site URLs with the hosted verification key", async () => {
  process.env.SITE_URL = "https://growintek.example";
  process.env.INDEXNOW_KEY = "test-indexnow-key-1234";
  let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return new Response("", { status: 202 });
  };
  await notifyIndexNow(["/blog/example"]);
  assert.deepEqual(payload.urlList, ["https://growintek.example/blog/example"]);
  assert.equal(
    payload.keyLocation,
    "https://growintek.example/test-indexnow-key-1234.txt",
  );
});
test("social adapters normalize live provider responses and preserve explicit errors", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  process.env.META_PAGE_ID = "page";
  process.env.META_ACCESS_TOKEN = "meta-test";
  process.env.INSTAGRAM_ACCOUNT_ID = "instagram";
  process.env.YOUTUBE_API_KEY = "youtube-test";
  process.env.YOUTUBE_CHANNEL_ID = "channel";
  globalThis.fetch = async (url) => {
    if (url.includes("/posts?"))
      return Response.json({
        data: [
          {
            id: "f1",
            from: {id:"page"},is_published:true,is_hidden:false,
            message: "Facebook post",
            permalink_url: "https://www.facebook.com/test/posts/1",
            created_time: "2026-10-01",
          },
        ],
      });
    if (url.includes("/media?"))
      return Response.json({
        data: [
          {
            id: "i1",
            caption: "Instagram post",
            permalink: "https://www.instagram.com/p/test/",
            media_type: "IMAGE",
            media_url: "https://example.cdninstagram.com/test.jpg",
            timestamp: "2026-10-01",
          },
        ],
      });
    if (url.includes("/channels?"))
      return Response.json({
        items: [
          { contentDetails: { relatedPlaylists: { uploads: "uploads" } } },
        ],
      });
    return Response.json({
      items: [
        {
          id:"video123456",status:{privacyStatus:"public",embeddable:true},
          snippet: {
            resourceId: { videoId: "video123456" },
            channelId:"channel",
            title: "Video title",
            publishedAt: "2026-10-01",
            thumbnails: { high: { url: "https://i.ytimg.com/test.jpg" } },
          },
        },
      ],
    });
  };
  const feeds = await refreshSocial(db);
  assert.equal(feeds.facebook.posts[0].text, "Facebook post");
  assert.equal(feeds.instagram.status, "connected");
  assert.equal(
    feeds.youtube.posts[0].url,
    "https://www.youtube.com/watch?v=video123456",
  );
  globalThis.fetch = async () => new Response("", { status: 403 });
  const failed = await refreshSocial(db);
  assert.equal(failed.facebook.status, "error");
  assert.match(failed.facebook.error, /HTTP 403/);
  assert.equal(failed.facebook.posts.length, 1);
  db.close();
});
