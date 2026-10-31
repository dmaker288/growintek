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
  publicData,
} from "../server/db.js";
import { fundsReport } from "../server/finance.js";
import { validateDocument } from "../server/validation.js";
import { generateArticle } from "../server/jobs.js";
import { DatabaseRateLimitStore } from "../server/rate-limit-store.js";
import { createApp } from "../server/app.js";
import { normalizeSocial, composioFeed } from "../server/composio.js";

for (const provider of [
  "sqlite",
  ...(process.env.TEST_POSTGRES_URL ? ["postgresql"] : []),
]) {
  test(`${provider}: transactional CMS, funds, automatic publishing and shared rate limits`, async () => {
    const old = process.env.DATABASE_URL;
    if (provider === "postgresql")
      process.env.DATABASE_URL = process.env.TEST_POSTGRES_URL;
    const db = openDatabase(provider === "sqlite" ? ":memory:" : "unused");
    try {
      await seed(db);
      assert.equal(db.provider, provider);
      assert.ok((await publicData(db)).sections.length > 10);
      await assert.rejects(
        db.transaction(async () => {
          await insert(db, "transactions", {
            title: "rollback",
            type: "income",
            amount: 1,
            currency: "USD",
            status: "recorded",
          });
          throw new Error("rollback test");
        }),
        /rollback test/,
      );
      assert.ok(
        !(await list(db, "transactions")).some((x) => x.title === "rollback"),
      );
      const ids = [];
      for (const data of [
        { title: "Income USD", type: "income", amount: 10.12, currency: "USD" },
        {
          title: "Expense USD",
          type: "expense",
          amount: 0.13,
          currency: "USD",
        },
        { title: "Income PKR", type: "income", amount: 1000, currency: "PKR" },
        {
          title: "Void income",
          type: "income",
          amount: 500,
          currency: "USD",
          status: "void",
        },
      ])
        ids.push(
          (
            await insert(
              db,
              "transactions",
              validateDocument("transactions", {
                status: "recorded",
                date: "2026-10-31",
                ...data,
              }),
            )
          ).id,
        );
      const report = await fundsReport(db);
      assert.equal(
        report.currencies.find((x) => x.currency === "USD").balance,
        9.99,
      );
      assert.equal(
        report.currencies.find((x) => x.currency === "PKR").balance,
        1000,
      );
      assert.throws(() =>
        validateDocument("transactions", {
          title: "Precision",
          type: "income",
          amount: 1.001,
          currency: "USD",
          date: "2026-10-31",
        }),
      );
      const scope = randomUUID(),
        a = new DatabaseRateLimitStore(db, scope),
        b = new DatabaseRateLimitStore(db, scope);
      a.init({ windowMs: 60000 });
      b.init({ windowMs: 60000 });
      const increments = await Promise.all([
        a.increment("test-ip"),
        b.increment("test-ip"),
        a.increment("test-ip"),
      ]);
      assert.deepEqual(increments.map((x) => x.totalHits).sort(), [1, 2, 3]);
      await a.resetKey("test-ip");
      const config = await settings(db);
      await saveSettings(db, { ...config, aiApproval: false });
      const topic = await insert(db, "keywords", {
        title: `Autopublish ${randomUUID()}`,
        slug: `auto-${randomUUID()}`,
        status: "ready",
        sources: [
          {
            title: "One",
            url: "https://example.com/one",
            notes: "A verified source note with practical detail.",
          },
          {
            title: "Two",
            url: "https://example.com/two",
            notes: "Another verified source with a separate fact.",
          },
        ],
      });
      ids.push(topic.id);
      const content = Array.from(
        { length: 75 },
        (_, i) =>
          `Unique workflow ${i} has dependency ${i * 7} and criterion ${i * 17}. Measure ownership and inputs before automation.`,
      ).join("\n\n");
      const output = {
        title: "A practical guide to thoughtful automation",
        description:
          "Understand the useful steps and decisions behind a practical business workflow, with clear ownership and measurable success criteria.",
        content,
        category: "Automation",
        sourceUrls: topic.sources.map((x) => x.url),
      };
      const both = await Promise.all([
        generateArticle(db, topic.id, async () => output),
        generateArticle(db, topic.id, async () => output),
      ]);
      assert.equal(both[0].id, both[1].id);
      assert.equal(both[0].status, "published");
      ids.push(both[0].id);
      assert.equal(
        (await list(db, "posts")).filter((x) => x.topicId === topic.id).length,
        1,
      );
      await saveSettings(db, config);
      for (const id of ids)
        await db.prepare("DELETE FROM documents WHERE id=?").run(id);
    } finally {
      await db.close();
      if (old === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = old;
    }
  });
}
test("cron rejects unknown callers and accepts only the configured secret", async () => {
  const old = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "a-test-only-cron-secret";
  const db = openDatabase(":memory:");
  const { app } = await createApp({ db, rateLimits: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const url = `http://127.0.0.1:${server.address().port}/api/cron`;
  try {
    assert.equal((await fetch(url)).status, 401);
    assert.equal(
      (await fetch(url, { headers: { Authorization: "Bearer wrong" } })).status,
      401,
    );
    assert.equal(
      (
        await fetch(url, {
          headers: { Authorization: "Bearer a-test-only-cron-secret" },
        })
      ).status,
      200,
    );
  } finally {
    await new Promise((r) => server.close(r));
    await db.close();
    if (old === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = old;
  }
});
test("Composio adapter filters private and visitor content and distinguishes reels", async () => {
  assert.equal(
    normalizeSocial(
      "facebook",
      [
        {
          id: "1",
          is_published: true,
          from: { id: "visitor" },
          permalink_url: "https://www.facebook.com/1",
        },
      ],
      "owner",
    ).length,
    0,
  );
  assert.equal(
    normalizeSocial(
      "youtube",
      [
        {
          id: "abcdefghijk",
          status: { privacyStatus: "unlisted" },
          snippet: { channelId: "owner" },
        },
      ],
      "owner",
    ).length,
    0,
  );
  const fetchOriginal = globalThis.fetch,
    env = { ...process.env };
  process.env.COMPOSIO_API_KEY = "private-test-key";
  process.env.COMPOSIO_USER_ID = "test-user";
  process.env.COMPOSIO_INSTAGRAM_ACCOUNT_ID = "test-account";
  globalThis.fetch = async (url, options) => {
    assert.equal(
      url,
      "https://backend.composio.dev/api/v3.1/tools/execute/INSTAGRAM_GET_IG_USER_MEDIA",
    );
    assert.equal(options.headers["x-api-key"], "private-test-key");
    assert.equal(JSON.parse(options.body).connected_account_id, "test-account");
    assert.equal(JSON.parse(options.body).user_id, "test-user");
    return Response.json({
      successful: true,
      data: {
        data: [
          {
            id: "ig1",
            media_type: "VIDEO",
            media_product_type: "REELS",
            permalink: "https://www.instagram.com/reel/verified/",
            caption: "Verified reel",
            timestamp: "2026-10-31",
          },
        ],
      },
    });
  };
  try {
    const posts = await composioFeed("instagram");
    assert.equal(posts[0].kind, "reel");
    assert.equal(posts[0].text, "Verified reel");
  } finally {
    globalThis.fetch = fetchOriginal;
    for (const key of Object.keys(process.env))
      if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});

test('Supabase storage uploads WebP privately and returns a same-origin media URL',async()=>{
 const {storeImage,listImages}=await import('../server/storage.js');
 const oldFetch=globalThis.fetch,previous={...process.env};
 process.env.SUPABASE_URL='https://test.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-private-role';
 const name='media-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp';let uploaded=false;
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.headers.Authorization,'Bearer test-private-role');
  if(url.includes('/object/list/'))return Response.json([{name}]);
  assert.equal(url,`https://test.supabase.co/storage/v1/object/growintek-media/${name}`);
  assert.equal(options.headers['Content-Type'],'image/webp');assert.equal(options.headers['x-upsert'],'false');uploaded=true;return Response.json({Key:name});
 };
 try{assert.equal(await storeImage(name,Buffer.from('webp-test')),`/images/${name}`);assert.ok(uploaded);assert.deepEqual(await listImages(),[`/images/${name}`]);}finally{globalThis.fetch=oldFetch;for(const k of Object.keys(process.env))if(!(k in previous))delete process.env[k];Object.assign(process.env,previous);}
});
