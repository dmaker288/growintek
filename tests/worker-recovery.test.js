import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  openDatabase,
  seed,
  insert,
  list,
  settings,
  saveSettings,
  now,
} from "../server/db.js";
import { queueJob, tick } from "../server/jobs.js";
import { createApp } from "../server/app.js";
import { hashPassword } from "../server/security.js";
test("a reclaimed daily job reuses the article already committed before a crash", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  const topicId = randomUUID();
  const post = await insert(db, "posts", {
    title: "Already generated",
    slug: "already-generated",
    topicId,
    content: "Approved article content",
    status: "review",
  });
  await queueJob(db, "daily-blog", { topicId }, "recovery-test");
  await db
    .prepare(
      "UPDATE jobs SET status='running',lease_until=0 WHERE id='recovery-test'",
    )
    .run();
  let providerCalls = 0;
  await tick(db, {
    dashscope: async () => {
      providerCalls++;
      throw new Error("Must not be called");
    },
  });
  const job = await db
    .prepare("SELECT * FROM jobs WHERE id='recovery-test'")
    .get();
  assert.equal(job.status, "complete");
  assert.equal(JSON.parse(job.data).result.postId, post.id);
  assert.equal(providerCalls, 0);
  assert.equal(
    (await list(db, "posts")).filter((p) => p.topicId === topicId).length,
    1,
  );
  db.close();
});
test("scheduled publications enforce editorial checks and retention deletes only old events", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  await saveSettings(db, { ...(await settings(db)), retentionDays: 30 });
  await insert(db, "posts", {
    title: "Unreviewed AI content",
    slug: "unreviewed-ai",
    status: "scheduled",
    publishedAt: "2020-01-01",
    content: "Article content ".repeat(40),
    aiGenerated: true,
    reviewed: false,
    sources: [],
  });
  await db
    .prepare("INSERT INTO events(path,event,day) VALUES(?,?,?)")
    .run("/", "pageview", "2020-01-01");
  await db
    .prepare("INSERT INTO events(path,event,day) VALUES(?,?,?)")
    .run("/", "pageview", now().slice(0, 10));
  await tick(db);
  assert.equal(
    (await list(db, "posts")).find((p) => p.slug === "unreviewed-ai").status,
    "scheduled",
  );
  assert.equal((await db.prepare("SELECT count(*) n FROM events").get()).n, 1);
  assert.match(
    (
      await db
        .prepare("SELECT error FROM jobs WHERE kind='publication-error'")
        .get()
    ).error,
    /reviewer/,
  );
  db.close();
});
test("core page metadata can be edited without silently unpublishing or deleting built-in routes", async () => {
  const db = openDatabase(":memory:");
  const { app } = await createApp({ db, rateLimits: false });
  await db
    .prepare("INSERT INTO admins VALUES(?,?,?,?)")
    .run(
      randomUUID(),
      "owner@example.com",
      await hashPassword("A-test-only-password!"),
      now(),
    );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "owner@example.com",
        password: "A-test-only-password!",
      }),
    });
    const csrf = (await login.json()).csrf;
    const headers = {
      "Content-Type": "application/json",
      Cookie: login.headers.get("set-cookie").split(";")[0],
      "x-csrf-token": csrf,
    };
    const home = (await list(db, "pages")).find((p) => p.slug === "home");
    assert.equal(
      (
        await fetch(base + `/api/admin/content/pages/${home.id}`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ revision: home.revision }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + `/api/admin/content/pages/${home.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ ...home, status: "draft" }),
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + `/api/admin/content/pages/${home.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ...home,
            seoTitle: "An updated homepage title",
          }),
        })
      ).status,
      200,
    );
  } finally {
    await new Promise((r) => server.close(r));
    db.close();
  }
});
test("public page payloads keep full article content only on its own URL", async () => {
  const { publicData, dataForPage } = await import("../server/db.js");
  const db = openDatabase(":memory:");
  await seed(db);
  const all = await publicData(db),
    post = all.posts[0];
  const home = dataForPage(all, "/");
  assert.equal(home.posts[0].content, "");
  assert.ok(home.posts[0].wordCount > 100);
  const article = dataForPage(all, `/blog/${post.slug}`);
  assert.equal(article.posts[0].content, post.content);
  assert.equal(article.posts[1].content, "");
  const policy = dataForPage(all, "/privacy-policy");
  assert.ok(
    policy.pages.find((p) => p.slug === "privacy-policy").content.length > 200,
  );
  db.close();
});
