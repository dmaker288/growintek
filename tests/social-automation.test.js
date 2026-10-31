import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { openDatabase, seed } from "../server/db.js";
import { queueJob, tick } from "../server/jobs.js";
import {
  queueSocialEvent,
  startComposioStream,
} from "../server/composio-stream.js";
import { composioWebhook } from "../server/composio-webhook.js";

test("trigger events are restricted to the configured owner and do not suppress later deliveries", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  const env = {
    COMPOSIO_USER_ID: "owner",
    COMPOSIO_YOUTUBE_ACCOUNT_ID: "account",
    COMPOSIO_YOUTUBE_TRIGGER_ID: "trigger",
  };
  const event = {
    id: "trigger",
    triggerSlug: "YOUTUBE_NEW_ACTIVITY_TRIGGER",
    metadata: { connectedAccount: { id: "account", userId: "owner" } },
    payload: { video: "one" },
  };
  try {
    assert.equal(
      await queueSocialEvent(
        db,
        {
          ...event,
          metadata: { connectedAccount: { id: "other", userId: "owner" } },
        },
        env,
      ),
      null,
    );
    assert.equal(
      await queueSocialEvent(db, event, { ...env, COMPOSIO_USER_ID: "other" }),
      null,
    );
    const id = await queueSocialEvent(db, event, env, 60000);
    assert.equal(await queueSocialEvent(db, event, env, 60000), id);
    assert.notEqual(
      await queueSocialEvent(
        db,
        { ...event, payload: { video: "two" } },
        env,
        60000,
      ),
      id,
    );
    assert.notEqual(await queueSocialEvent(db, event, env, 120000), id);
    const rows = await db
      .prepare("SELECT * FROM jobs WHERE kind='social'")
      .all();
    assert.equal(rows.length, 3);
    assert.ok(rows.every((row) => !row.data.includes("video")));
  } finally {
    await db.close();
  }
});

test("social jobs retry a partial provider failure, then record compact successful results", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  try {
    await queueJob(db, "social", {}, "social-retry");
    await tick(db, {
      refreshSocial: async () => ({ youtube: { status: "error", posts: [] } }),
    });
    let row = await db
      .prepare("SELECT * FROM jobs WHERE id=?")
      .get("social-retry");
    assert.equal(row.status, "pending");
    assert.equal(row.attempts, 1);
    await db.prepare("UPDATE jobs SET available_at=0 WHERE id=?").run(row.id);
    await tick(db, {
      refreshSocial: async () => ({
        youtube: { status: "connected", posts: [{ text: "Public video" }] },
      }),
    });
    row = await db.prepare("SELECT * FROM jobs WHERE id=?").get(row.id);
    assert.equal(row.status, "complete");
    assert.equal(row.error, null);
    assert.equal(JSON.parse(row.data).result.youtube.count, 1);
    assert.ok(!row.data.includes("Public video"));
  } finally {
    await db.close();
  }
});

test("the stream retries authorization failure and stops cleanly; Vercel never opens a socket", async () => {
  const env = {
    COMPOSIO_STREAM_ENABLED: "true",
    COMPOSIO_API_KEY: "fixture",
    COMPOSIO_USER_ID: "owner",
    COMPOSIO_YOUTUBE_ACCOUNT_ID: "account",
  };
  let attempts = 0,
    closed = 0,
    ready;
  const connected = new Promise((resolve) => {
    ready = resolve;
  });
  const stop = startComposioStream(null, {
    env,
    retryMs: 5,
    log: { warn() {}, error() {} },
    makeClient: async () => ({
      triggers: {
        async subscribe(_callback, filters, error) {
          assert.equal(filters.userId, "owner");
          if (++attempts === 1) error({ status: 401 });
          else ready();
        },
        async unsubscribe() {
          closed++;
        },
      },
    }),
  });
  await Promise.race([
    connected,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("No retry")), 500),
    ),
  ]);
  await stop();
  assert.equal(attempts, 2);
  assert.ok(closed >= 2);
  const disabled = startComposioStream(null, {
    env: { ...env, VERCEL: "1" },
    makeClient: async () => {
      throw new Error("Must not initialize");
    },
  });
  await disabled();
});

test("signed webhook refreshes once and recognizes jobs already completed by the worker", async () => {
  const db = openDatabase(":memory:");
  await seed(db);
  const previous = { ...process.env };
  process.env.COMPOSIO_WEBHOOK_SECRET = "test-signing-secret";
  process.env.COMPOSIO_YOUTUBE_ACCOUNT_ID = "account";
  const body = Buffer.from(
    JSON.stringify({
      type: "composio.trigger.message",
      metadata: { connected_account_id: "account" },
    }),
  );
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = {
    "webhook-id": "event-one",
    "webhook-timestamp": timestamp,
    "webhook-signature": createHmac(
      "sha256",
      process.env.COMPOSIO_WEBHOOK_SECRET,
    )
      .update(`event-one.${timestamp}.`)
      .update(body)
      .digest("base64"),
  };
  let reads = 0,
    result;
  const handler = composioWebhook(db, {
    refreshSocial: async () => {
      reads++;
      return { youtube: { status: "connected", posts: [] } };
    },
  });
  const res = {
    status() {
      return this;
    },
    json(data) {
      result = data;
      return this;
    },
  };
  try {
    await handler({ body, headers }, res);
    assert.deepEqual(result, { ok: true });
    const row = await db
      .prepare("SELECT * FROM jobs WHERE kind='social'")
      .get();
    assert.equal(row.status, "complete");
    await handler({ body, headers }, res);
    assert.deepEqual(result, { duplicate: true });
    assert.equal(reads, 1);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
    await db.close();
  }
});
