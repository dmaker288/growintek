import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { openDatabase, insert, list, now, publicData } from "../server/db.js";
import { createApp } from "../server/app.js";
import { hashPassword } from "../server/security.js";
import { validateDocument } from "../server/validation.js";
import { hasCommentLink } from "../shared/comment-policy.js";
import { seoHead } from "../server/seo.js";

test("comment policy blocks links, markup and encoded addresses while allowing ordinary prose", () => {
  for (const value of [
    "https://example.com",
    "example.com",
    "www.example.net",
    "test@example.com",
    "<a>hello</a>",
    "[visit](/path)",
    "example[dot]com",
    "example dot org",
    "https%3A%2F%2Fexample%2Ecom",
    "example&#46;com",
    "example。com",
    "exa\u200bmple.com",
    "example&period;com",
    "192.168.1.1",
    "/some/path",
  ])
    assert.equal(hasCommentLink(value), true, value);
  for (const value of [
    "This is a useful checklist. Next, I will try the process.",
    "I improved conversions by 12.5% in our own test.",
    "How would you prioritize discovery for a small team?",
    "A. Rana",
  ])
    assert.equal(hasCommentLink(value), false, value);
});

test("reader comments require confirmation, stay private until moderation, and cannot bypass CMS authorization", async () => {
  const db = openDatabase(":memory:");
  const { app } = await createApp({ db, rateLimits: false });
  await db
    .prepare("INSERT INTO admins VALUES(?,?,?,?)")
    .run(
      randomUUID(),
      "moderator@example.com",
      await hashPassword("Comments-test-password-57!"),
      now(),
    );
  const post = await insert(
    db,
    "posts",
    validateDocument("posts", {
      title: "Comment test article",
      slug: "comment-test",
      status: "published",
      content: "A useful article about careful planning. ".repeat(20),
    }),
  );
  const draft = await insert(
    db,
    "posts",
    validateDocument("posts", {
      title: "Private test article",
      slug: "private-comment-test",
      status: "draft",
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, body, headers = {}, method = "POST") =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const data = {
    postId: post.id,
    name: "A Reader",
    email: "reader@example.com",
    body: "How do you choose a sensible starting point for this process?",
    followsConfirmed: true,
  };
  const visible = async (id = post.id) => {
    const r = await fetch(base + `/api/posts/${id}/comments`);
    return r.json();
  };
  try {
    assert.equal(
      (await request("/api/comments", { ...data, followsConfirmed: false }))
        .status,
      400,
    );
    assert.equal(
      (
        await request("/api/comments", {
          ...data,
          body: "Please visit https://example.com",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await request("/api/comments", data, {
          Origin: "https://foreign.example",
        })
      ).status,
      403,
    );
    assert.equal(
      (await request("/api/comments", { ...data, postId: draft.id })).status,
      404,
    );
    assert.equal(
      (await fetch(base + `/api/posts/${draft.id}/comments`)).status,
      404,
    );
    assert.equal(
      (await request("/api/comments", { ...data, status: "approved" })).status,
      202,
    );
    assert.equal((await request("/api/comments", data)).status, 202);
    assert.equal(
      (await list(db, "comments")).length,
      1,
      "duplicates are not stored",
    );
    const comment = (await list(db, "comments"))[0];
    assert.equal(comment.status, "pending");
    assert.deepEqual((await visible()).comments, []);
    assert.equal(
      (
        await request("/api/comments", {
          ...data,
          email: "bot@example.com",
          website: "spam",
        })
      ).status,
      202,
    );
    assert.equal(
      (await list(db, "comments")).length,
      1,
      "honeypot is discarded",
    );
    const endpoint = `/api/admin/content/comments/${comment.id}`;
    assert.equal(
      (await request(endpoint, { ...comment, status: "approved" }, {}, "PUT"))
        .status,
      401,
    );
    const login = await request("/api/auth/login", {
      email: "moderator@example.com",
      password: "Comments-test-password-57!",
    });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const { csrf } = await login.json();
    assert.equal(
      (
        await request(
          endpoint,
          { ...comment, status: "approved" },
          { Cookie: cookie },
          "PUT",
        )
      ).status,
      403,
    );
    const headers = { Cookie: cookie, "x-csrf-token": csrf };
    const approved = await request(
      endpoint,
      { ...comment, status: "approved" },
      headers,
      "PUT",
    );
    assert.equal(approved.status, 200);
    const record = await approved.json();
    const comments = (await visible()).comments;
    assert.equal(comments.length, 1);
    assert.deepEqual(Object.keys(comments[0]).sort(), [
      "body",
      "createdAt",
      "id",
      "name",
    ]);
    assert.ok(
      !JSON.stringify(await publicData(db)).includes("reader@example.com"),
    );
    assert.equal(
      (
        await request(
          endpoint,
          { ...record, status: "rejected" },
          headers,
          "PUT",
        )
      ).status,
      200,
    );
    assert.deepEqual((await visible()).comments, []);
  } finally {
    await new Promise((r) => server.close(r));
    await db.close();
  }
});

test("comment rate limit persists across requests", async () => {
  const db = openDatabase(":memory:");
  const { app } = await createApp({ db });
  const post = await insert(
    db,
    "posts",
    validateDocument("posts", {
      title: "Rate limit article",
      slug: "rate-test",
      status: "published",
      content: "A useful article about careful planning. ".repeat(20),
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  try {
    for (let i = 0; i < 5; i++) {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: post.id,
            name: "Reader",
            email: "reader@example.com",
            body: "A useful observation about this process.",
            followsConfirmed: true,
          }),
        },
      );
      assert.equal(response.status, i < 4 ? 202 : 429);
    }
  } finally {
    await new Promise((r) => server.close(r));
    await db.close();
  }
});

test("search metadata supports uploaded images, complete breadcrumbs and real team profiles", () => {
  const data = {
    settings: { siteUrl: "https://growintek.example", social: {} },
    pages: [],
    services: [],
    portfolio: [],
    posts: [
      {
        slug: "sample",
        title: "Sample article",
        description: "Useful information",
        image: "https://cdn.example/cover.webp",
      },
    ],
    team: [
      {
        title: "Ijtiba Rana",
        role: "Developer",
        image: "/images/team.webp",
        linkedin: "https://www.linkedin.com/in/ijtibarana/",
      },
    ],
  };
  const head = seoHead("/blog/sample", data);
  assert.ok(head.includes('content="https://cdn.example/cover.webp"'));
  const schema = JSON.parse(
    head.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1],
  );
  assert.equal(
    schema.find((s) => s["@type"] === "BlogPosting").image,
    "https://cdn.example/cover.webp",
  );
  assert.deepEqual(
    schema
      .find((s) => s["@type"] === "BreadcrumbList")
      .itemListElement.map((i) => i.name),
    ["Home", "Blog", "Sample article"],
  );
  const about = seoHead("/about", data);
  assert.ok(about.includes('"@type":"AboutPage"'));
  assert.ok(about.includes("https://www.linkedin.com/in/ijtibarana/"));
});
