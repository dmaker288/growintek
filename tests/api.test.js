import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { createApp } from "../server/app.js";
import {
  openDatabase,
  now,
  insert,
  list,
  publicData,
  settings,
  saveSettings,
} from "../server/db.js";
import { hashPassword } from "../server/security.js";
import { invoiceTotals, validateDocument } from "../server/validation.js";
import { generateArticle, queueJob, tick, similarity } from "../server/jobs.js";
import { seoHead, routeInfo, publicPaths } from "../server/seo.js";
let db, server, base, cookie, csrf, temporary;
const password = "Test-only-password-47!";
async function request(
  path,
  { method = "GET", body, authorized = false, headers = {} } = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(authorized ? { Cookie: cookie, "x-csrf-token": csrf } : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
  const type = response.headers.get("content-type") || "";
  return {
    status: response.status,
    headers: response.headers,
    data:
      response.status === 204
        ? null
        : type.includes("json")
          ? await response.json()
          : await response.text(),
  };
}
before(async () => {
  temporary = mkdtempSync(join(tmpdir(), "grow-api-"));
  process.env.MEDIA_PATH = join(temporary, "media");
  db = openDatabase(":memory:");
  const setup = await createApp({ db, rateLimits: false });
  await db
    .prepare("INSERT INTO admins VALUES(?,?,?,?)")
    .run(randomUUID(), "test@example.com", await hashPassword(password), now());
  server = setup.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  db.close();
  rmSync(temporary, { recursive: true, force: true });
  delete process.env.MEDIA_PATH;
});
test("private collections require an authenticated session", async () => {
  const r = await request("/api/admin/content/leads");
  assert.equal(r.status, 401);
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("login rejects invalid credentials and issues a protected session", async () => {
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: "test@example.com", password: "wrong" },
      })
    ).status,
    401,
  );
  const r = await request("/api/auth/login", {
    method: "POST",
    body: { email: "test@example.com", password },
  });
  assert.equal(r.status, 200);
  assert.ok(r.data.csrf);
  const setCookie = r.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  cookie = setCookie.split(";")[0];
  csrf = r.data.csrf;
  assert.equal(
    (await request("/api/admin/session", { authorized: true })).data.email,
    "test@example.com",
  );
});
test("mutations reject missing CSRF tokens and foreign origins", async () => {
  const body = { title: "Example", slug: "example" };
  assert.equal(
    (
      await request("/api/admin/content/pages", {
        method: "POST",
        body,
        headers: { Cookie: cookie },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("/api/admin/content/pages", {
        method: "POST",
        body,
        authorized: true,
        headers: { Origin: "https://evil.example" },
      })
    ).status,
    403,
  );
});
test("lead form validates consent, stores inquiry and ignores injected pipeline fields", async () => {
  const body = {
    name: "Test Visitor",
    email: "visitor@example.com",
    industry: "Consulting",
    message: "I would like help planning a business website.",
    consent: true,
    status: "won",
    notes: "Injected",
  };
  assert.equal(
    (
      await request("/api/leads", {
        method: "POST",
        body: { ...body, consent: false },
      })
    ).status,
    400,
  );
  const r = await request("/api/leads", { method: "POST", body });
  assert.equal(r.status, 201);
  const leads = (
    await request("/api/admin/content/leads", { authorized: true })
  ).data;
  assert.equal(leads[0].status, "new");
  assert.equal(leads[0].notes, "");
  assert.equal(leads[0].industry, "Consulting");
  const count = leads.length;
  assert.equal(
    (
      await request("/api/leads", {
        method: "POST",
        body: { website: "spam.example" },
      })
    ).status,
    201,
  );
  assert.equal((await list(db, "leads")).length, count);
});
test("CMS draft privacy, public publishing, revision conflicts and unique addresses", async () => {
  const r = await request("/api/admin/content/posts", {
    method: "POST",
    authorized: true,
    body: {
      title: "A test editorial article",
      slug: "test-editorial",
      status: "draft",
      description:
        "Testing the real publishing workflow with a helpful description.",
      content: "This is a useful article. ".repeat(30),
      sources: [
        {
          title: "Private source",
          url: "https://example.com/source",
          notes:
            "Private research notes must never be serialized into public HTML.",
        },
      ],
    },
  });
  assert.equal(r.status, 201);
  const doc = r.data;
  assert.ok(!(await publicData(db)).posts.some((p) => p.id === doc.id));
  const saved = await request(`/api/admin/content/posts/${doc.id}`, {
    method: "PUT",
    authorized: true,
    body: { ...doc, status: "published" },
  });
  assert.equal(saved.status, 200);
  assert.equal(
    (
      await request(`/api/admin/content/posts/${doc.id}`, {
        method: "PUT",
        authorized: true,
        body: doc,
      })
    ).status,
    409,
  );
  const visible = (await publicData(db)).posts.find((p) => p.id === doc.id);
  assert.ok(visible);
  assert.equal(visible.sources[0].notes, undefined);
  assert.equal(
    (
      await request("/api/admin/content/posts", {
        method: "POST",
        authorized: true,
        body: doc,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/api/admin/content/posts/${doc.id}`, {
        method: "DELETE",
        authorized: true,
        body: { revision: saved.data.revision },
      })
    ).status,
    204,
  );
});
test("AI content requires sources and review before manual publication", () => {
  assert.throws(
    () =>
      validateDocument("posts", {
        title: "AI test",
        slug: "ai-test",
        status: "published",
        content: "Article content ".repeat(30),
        aiGenerated: true,
      }),
    /reviewer/,
  );
  assert.throws(
    () =>
      validateDocument("posts", {
        title: "AI test",
        slug: "ai-test",
        status: "published",
        content: "Article content ".repeat(30),
        aiGenerated: true,
        reviewed: true,
        reviewer: "Editor",
      }),
    /sources/,
  );
  assert.throws(
    () =>
      validateDocument("posts", {
        title: "Schedule test",
        slug: "scheduled-test",
        status: "scheduled",
        publishedAt: now(),
      }),
    /future/,
  );
});
test("client relations, invoice rounding and referential deletion protection", async () => {
  const c = await request("/api/admin/content/clients", {
    method: "POST",
    authorized: true,
    body: {
      name: "Test Client",
      email: "client@example.com",
      company: "Example Studio",
    },
  });
  assert.equal(c.status, 201);
  const body = {
    number: "INV-TEST",
    clientId: c.data.id,
    dueDate: "2026-12-01",
    currency: "USD",
    taxRate: 7.5,
    items: [
      { description: "Discovery", quantity: 3, unitPrice: 19.99 },
      { description: "Design", quantity: 1.5, unitPrice: 100 },
    ],
  };
  assert.deepEqual(invoiceTotals(body), {
    subtotal: 209.97,
    tax: 15.75,
    total: 225.72,
  });
  const i = await request("/api/admin/content/invoices", {
    method: "POST",
    authorized: true,
    body,
  });
  assert.equal(i.status, 201);
  assert.equal(
    (
      await request("/api/admin/content/invoices", {
        method: "POST",
        authorized: true,
        body,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/api/admin/content/clients/${c.data.id}`, {
        method: "DELETE",
        authorized: true,
        body: { revision: c.data.revision },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request("/api/admin/content/invoices", {
        method: "POST",
        authorized: true,
        body: { ...body, number: "INV-INVALID", clientId: randomUUID() },
      })
    ).status,
    400,
  );
});
test("images are decoded, resized and stored safely; SVG uploads are rejected", async () => {
  const blob = await sharp({
    create: { width: 2200, height: 100, channels: 3, background: "#32aa87" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append(
    "image",
    new Blob([blob], { type: "image/png" }),
    "../../unsafe.png",
  );
  const result = await request("/api/admin/media", {
    method: "POST",
    authorized: true,
    body: form,
  });
  assert.equal(result.status, 201);
  assert.match(result.data.url, /^\/images\/media-[a-f0-9-]+\.webp$/);
  const served = await fetch(base + result.data.url);
  assert.equal(served.status, 200);
  const metadata = await sharp(
    Buffer.from(await served.arrayBuffer()),
  ).metadata();
  assert.equal(metadata.width, 2000);
  assert.equal(metadata.format, "webp");
  const unsafe = new FormData();
  unsafe.append(
    "image",
    new Blob(["<svg/>"], { type: "image/svg+xml" }),
    "bad.svg",
  );
  assert.equal(
    (
      await request("/api/admin/media", {
        method: "POST",
        authorized: true,
        body: unsafe,
      })
    ).status,
    400,
  );
});
test("analytics requires consent and does not store admin page events", async () => {
  assert.equal(
    (
      await request("/api/events", {
        method: "POST",
        body: { path: "/", event: "pageview", consent: false },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/api/events", {
        method: "POST",
        body: { path: "/", event: "pageview", consent: true },
      })
    ).status,
    204,
  );
  await request("/api/events", {
    method: "POST",
    body: { path: "/admin", event: "pageview", consent: true },
  });
  assert.equal(
    (await db.prepare("SELECT count(*) as n FROM events").get()).n,
    1,
  );
});
test("crawl files and metadata exclude admin and escape unsafe content", async () => {
  process.env.SITE_URL = "https://growintek.example";
  const sitemap = (await request("/sitemap.xml")).data;
  assert.match(
    sitemap,
    /https:\/\/growintek.example\/services\/web-development/,
  );
  assert.ok(!sitemap.includes("/admin"));
  assert.ok(!sitemap.includes("/home<"));
  assert.match((await request("/robots.txt")).data, /Disallow: \/admin/);
  assert.match((await request("/llms.txt")).data, /# Growintek/);
  assert.match((await request("/feed.xml")).data, /<rss/);
  const data = await publicData(db);
  assert.equal(routeInfo("/blog/no-such-post", data).exists, false);
  assert.equal(
    routeInfo("/services/web-development/extra", data).exists,
    false,
  );
  data.pages.find((p) => p.slug === "about").seoTitle =
    'Test "><script>alert(1)</script>';
  assert.ok(!seoHead("/about", data).includes("<script>alert"));
  assert.equal(
    new Set(publicPaths(data).map((p) => p.path)).size,
    publicPaths(data).length,
  );
  delete process.env.SITE_URL;
});
test("unconfigured providers report actionable errors instead of fabricated data", async () => {
  const integrations = (
    await request("/api/admin/integrations", { authorized: true })
  ).data;
  assert.equal(
    integrations.find((i) => i.id === "dashscope").configured,
    false,
  );
  assert.equal(
    (await request("/api/admin/search-console", { authorized: true })).status,
    503,
  );
  assert.equal(
    (await request("/api/admin/analytics", { authorized: true })).status,
    503,
  );
});
test("scheduled content publishes through the worker", async () => {
  const d = await insert(db, "posts", {
    title: "Due scheduled article",
    slug: "due-scheduled",
    status: "scheduled",
    content: "A helpful substantive article. ".repeat(20),
    publishedAt: "2020-01-01T00:00:00Z",
  });
  await tick(db);
  assert.equal(
    (await list(db, "posts")).find((p) => p.id === d.id).status,
    "published",
  );
});
test("AI draft uses approved sources, remains in review, consumes topic once and rejects fabricated citations", async () => {
  await saveSettings(db, { ...(await settings(db)), aiApproval: true });
  const sources = [
    {
      title: "Approved source one",
      url: "https://example.com/a",
      notes:
        "A source with verified facts about a small workflow and its inputs.",
    },
    {
      title: "Approved source two",
      url: "https://example.com/b",
      notes:
        "A separate source describing constraints and documented operating procedures.",
    },
  ];
  const topic = await insert(db, "keywords", {
    title: "Independent editorial topic",
    slug: "independent-editorial",
    status: "ready",
    intent: "informational",
    market: "Global",
    sources,
    notes: "Helpful practical guidance.",
  });
  const content = Array.from(
    { length: 120 },
    (_, i) =>
      `Practical consideration ${i}: assess process ${i * 9} and verify requirement ${i * 13} before proceeding.`,
  ).join("\n\n");
  const client = async () => ({
    title: "A practical guide to a better business process",
    description:
      "A carefully scoped guide to assessing business processes, choosing useful measurements and planning for reliable day-to-day ownership.",
    category: "Automation",
    content,
    sourceUrls: sources.map((s) => s.url),
  });
  const post = await generateArticle(db, topic.id, client);
  assert.equal(post.status, "review");
  assert.equal(post.aiGenerated, true);
  assert.equal(
    (await list(db, "keywords")).find((t) => t.id === topic.id).status,
    "used",
  );
  assert.ok(!(await publicData(db)).posts.some((p) => p.id === post.id));
  await assert.rejects(
    () => generateArticle(db, topic.id, client),
    /ready keyword/,
  );
  const second = await insert(db, "keywords", {
    ...topic,
    id: undefined,
    title: "Different topic",
    slug: "different-topic",
    status: "ready",
  });
  await assert.rejects(
    () =>
      generateArticle(db, second.id, async () => ({
        ...(await client()),
        sourceUrls: [
          "https://invented.example/a",
          "https://invented.example/b",
        ],
      })),
    /outside/,
  );
  assert.equal(similarity(content, content), 1);
});
test("daily jobs are idempotent and failures retain diagnostics", async () => {
  await saveSettings(db, {
    ...(await settings(db)),
    aiEnabled: true,
    aiHour: 0,
  });
  await tick(db, {
    dashscope: async () => {
      throw new Error("Simulated provider outage");
    },
  });
  await tick(db, {
    dashscope: async () => {
      throw new Error("Simulated provider outage");
    },
  });
  const jobs = await db
    .prepare("SELECT * FROM jobs WHERE kind='daily-blog'")
    .all();
  assert.equal(jobs.length, 1);
  assert.ok(jobs[0].error);
  assert.equal(jobs[0].status, "pending");
  await queueJob(db, "article", { topicId: randomUUID() }, "invalid-topic-job");
  await tick(db);
  assert.match(
    (
      await db
        .prepare("SELECT error FROM jobs WHERE id=?")
        .get("invalid-topic-job")
    ).error,
    /ready keyword/,
  );
});

test("team profiles support authenticated edits, hide drafts and validate social links", async () => {
  assert.equal((await request("/api/admin/content/team")).status, 401);
  const profile = {
    title: "Test Person",
    slug: "test-person",
    role: "Developer",
    status: "draft",
    website: "",
    linkedin: "https://www.linkedin.com/in/test-profile/",
    order: 5,
  };
  const created = await request("/api/admin/content/team", {
    method: "POST",
    body: profile,
    authorized: true,
  });
  assert.equal(created.status, 201);
  assert.ok(!(await publicData(db)).team.some((p) => p.id === created.data.id));
  const endpoint = "/api/admin/content/team/" + created.data.id;
  assert.equal(
    (
      await request(endpoint, {
        method: "PUT",
        body: { ...created.data, linkedin: "javascript:alert(1)" },
        authorized: true,
      })
    ).status,
    400,
  );
  const published = await request(endpoint, {
    method: "PUT",
    body: {
      ...created.data,
      status: "published",
      linkedin: "https://www.linkedin.com/in/updated/",
    },
    authorized: true,
  });
  assert.equal(published.status, 200);
  assert.equal(
    (await publicData(db)).team.find((p) => p.id === created.data.id).linkedin,
    "https://www.linkedin.com/in/updated/",
  );
  assert.equal(
    (
      await request(endpoint, {
        method: "PUT",
        body: { ...created.data, status: "published" },
        authorized: true,
      })
    ).status,
    409,
  );
});

test("logout revokes the server-side session", async () => {
  assert.equal(
    (
      await request("/api/admin/logout", {
        method: "POST",
        authorized: true,
        body: {},
      })
    ).status,
    204,
  );
  assert.equal(
    (await request("/api/admin/session", { authorized: true })).status,
    401,
  );
});
