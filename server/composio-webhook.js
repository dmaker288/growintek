import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { refreshSocial } from "./integrations.js";
import { queueJob } from "./jobs.js";
import { now } from "./db.js";
export function verifyComposioWebhook(
  body,
  headers,
  secret,
  current = Date.now(),
) {
  const id = headers["webhook-id"],
    timestamp = headers["webhook-timestamp"],
    signatures = headers["webhook-signature"];
  if (
    !secret ||
    typeof id !== "string" ||
    !id ||
    id.length > 200 ||
    typeof timestamp !== "string" ||
    !/^\d{10}$/.test(timestamp) ||
    typeof signatures !== "string" ||
    !Buffer.isBuffer(body)
  )
    return false;
  if (Math.abs(current / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${id}.${timestamp}.`)
    .update(body)
    .digest("base64");
  return signatures.split(" ").some((s) => {
    const received = s.startsWith("v1,") ? s.slice(3) : s;
    return (
      Buffer.byteLength(received) === Buffer.byteLength(expected) &&
      timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    );
  });
}
export function composioWebhook(db) {
  return async (req, res) => {
    if (!process.env.COMPOSIO_WEBHOOK_SECRET)
      return res
        .status(503)
        .json({ error: "Configure the Composio webhook signing secret." });
    if (
      !verifyComposioWebhook(
        req.body,
        req.headers,
        process.env.COMPOSIO_WEBHOOK_SECRET,
      )
    )
      return res
        .status(401)
        .json({ error: "Invalid or expired webhook signature." });
    let payload;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload." });
    }
    const allowed = ["FACEBOOK", "INSTAGRAM", "YOUTUBE"]
      .map((n) => process.env[`COMPOSIO_${n}_ACCOUNT_ID`])
      .filter(Boolean);
    if (
      payload.type !== "composio.trigger.message" ||
      !allowed.includes(payload.metadata?.connected_account_id)
    )
      return res.status(200).json({ ignored: true });
    // Treat trigger content only as a notification. Retrieve public posts through the read adapter.
    const id =
      "social-webhook:" +
      createHash("sha256").update(req.headers["webhook-id"]).digest("hex");
    const claimed = await db.transaction(async () => {
      await queueJob(db, "social", {}, id);
      const row = await db
        .prepare("SELECT status,lease_until FROM jobs WHERE id=?")
        .get(id);
      if (
        row.status === "done" ||
        (row.status === "running" && Number(row.lease_until) > Date.now())
      )
        return false;
      await db
        .prepare(
          "UPDATE jobs SET status='running',lease_until=?,attempts=attempts+1,updated_at=? WHERE id=?",
        )
        .run(Date.now() + 90000, now(), id);
      return true;
    })();
    if (!claimed) return res.status(200).json({ duplicate: true });
    try {
      const cache = await refreshSocial(db);
      if (Object.values(cache).some((c) => c.status === "error"))
        throw new Error(
          "A social connection needs attention. The previous feed has been preserved.",
        );
      await db
        .prepare(
          "UPDATE jobs SET status='done',lease_until=NULL,updated_at=? WHERE id=?",
        )
        .run(now(), id);
      return res.json({ ok: true });
    } catch {
      await db
        .prepare(
          "UPDATE jobs SET status='pending',lease_until=NULL,error=?,available_at=?,updated_at=? WHERE id=?",
        )
        .run(
          "Social refresh failed. Check connection permissions.",
          Date.now() + 60000,
          now(),
          id,
        );
      return res
        .status(503)
        .json({
          error:
            "Refresh will be retried. Check social connection permissions.",
        });
    }
  };
}
