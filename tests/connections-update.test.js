import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyComposioWebhook } from "../server/composio-webhook.js";
import { storeImage, listImages, serveImage } from "../server/storage.js";
test("Composio signature rejects tampering, expired timestamps and malformed lengths", () => {
  const secret = "fixture-secret",
    timestamp = String(Math.floor(Date.now() / 1000)),
    body = Buffer.from('{"type":"test"}');
  const h = { "webhook-id": "msg-test", "webhook-timestamp": timestamp };
  h["webhook-signature"] =
    "v1," +
    createHmac("sha256", secret)
      .update(`msg-test.${timestamp}.`)
      .update(body)
      .digest("base64");
  assert.equal(verifyComposioWebhook(body, h, secret), true);
  assert.equal(verifyComposioWebhook(Buffer.from("{}"), h, secret), false);
  assert.equal(
    verifyComposioWebhook(body, h, secret, Date.now() + 301000),
    false,
  );
  assert.equal(
    verifyComposioWebhook(body, { ...h, "webhook-signature": "v1,x" }, secret),
    false,
  );
  assert.equal(verifyComposioWebhook(body, h, ""), false);
});
test("Prisma media storage survives separate requests, serves exact bytes and bounds size", async () => {
  const env = { ...process.env };
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rows = new Map();
  const db = {
    provider: "postgresql",
    prepare(sql) {
      return {
        async run(name, data) {
          rows.set(name, data);
        },
        async all() {
          return [...rows.keys()].map((filename) => ({ filename }));
        },
        async get(name) {
          return rows.has(name) ? { data: rows.get(name) } : undefined;
        },
      };
    },
  };
  const name = "media-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.webp",
    bytes = Buffer.from("webp-fixture");
  try {
    await storeImage(name, bytes, db);
    assert.deepEqual(await listImages(db), ["/images/" + name]);
    let output;
    const res = {
      type() {
        return this;
      },
      set() {
        return this;
      },
      send(data) {
        output = data;
      },
      sendStatus(status) {
        output = status;
      },
    };
    await serveImage({ path: "/images/" + name }, res, db);
    assert.deepEqual(output, bytes);
    await serveImage({ path: "/images/missing.webp" }, res, db);
    assert.equal(output, 404);
    await assert.rejects(
      () => storeImage(name, Buffer.alloc(2 * 1024 * 1024 + 1), db),
      (e) => e.status === 413,
    );
  } finally {
    Object.assign(process.env, env);
  }
});
