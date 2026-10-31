import { createHash } from "node:crypto";
import { queueJob } from "./jobs.js";

// The SDK's event id identifies the trigger, not an individual delivery.
export async function queueSocialEvent(
  db,
  event,
  env = process.env,
  current = Date.now(),
) {
  const account = event?.metadata?.connectedAccount;
  if (
    !env.COMPOSIO_USER_ID ||
    !env.COMPOSIO_YOUTUBE_ACCOUNT_ID ||
    account?.id !== env.COMPOSIO_YOUTUBE_ACCOUNT_ID ||
    account?.userId !== env.COMPOSIO_USER_ID ||
    event?.triggerSlug !== "YOUTUBE_NEW_ACTIVITY_TRIGGER" ||
    (env.COMPOSIO_YOUTUBE_TRIGGER_ID &&
      event.id !== env.COMPOSIO_YOUTUBE_TRIGGER_ID)
  )
    return null;
  const digest = createHash("sha256")
    .update(JSON.stringify(event.payload ?? {}))
    .digest("hex");
  return queueJob(
    db,
    "social",
    { source: "composio-trigger" },
    `social-stream:${Math.floor(current / 60000)}:${digest}`,
  );
}

// Persistent hosts only. Vercel receives signed HTTP webhooks instead.
export function startComposioStream(db, options = {}) {
  const env = options.env || process.env;
  if (
    env.VERCEL ||
    env.COMPOSIO_STREAM_ENABLED !== "true" ||
    !env.COMPOSIO_API_KEY ||
    !env.COMPOSIO_USER_ID ||
    !env.COMPOSIO_YOUTUBE_ACCOUNT_ID
  )
    return async () => {};
  const log = options.log || console;
  const makeClient =
    options.makeClient ||
    (async () => {
      process.env.TELEMETRY_DISABLED = "true";
      const { Composio } = await import("@composio/core");
      return new Composio({ apiKey: env.COMPOSIO_API_KEY });
    });
  let stopped = false,
    client,
    retry;
  const pendingEvents = new Set();
  function scheduleRetry() {
    if (stopped || retry) return;
    log.warn(
      "Social trigger connection interrupted; retrying. Scheduled refresh remains active.",
    );
    retry = setTimeout(() => {
      retry = undefined;
      connecting = connect();
    }, options.retryMs ?? 30000);
    retry.unref?.();
  }
  async function connect() {
    try {
      await client?.triggers.unsubscribe();
      if (stopped) return;
      client = await makeClient();
      if (stopped) {
        await client.triggers.unsubscribe();
        return;
      }
      await client.triggers.subscribe(
        (event) => {
          if (stopped) return;
          const work = queueSocialEvent(db, event, env).catch(() =>
            log.error(
              "Unable to queue a social trigger. Scheduled refresh remains active.",
            ),
          );
          pendingEvents.add(work);
          void work.finally(() => pendingEvents.delete(work));
          return work;
        },
        {
          toolkits: ["youtube"],
          connectedAccountId: env.COMPOSIO_YOUTUBE_ACCOUNT_ID,
          userId: env.COMPOSIO_USER_ID,
          ...(env.COMPOSIO_YOUTUBE_TRIGGER_ID
            ? { triggerId: env.COMPOSIO_YOUTUBE_TRIGGER_ID }
            : {}),
        },
        scheduleRetry,
      );
    } catch {
      scheduleRetry();
    }
  }
  let connecting = connect();
  return async () => {
    stopped = true;
    clearTimeout(retry);
    await client?.triggers.unsubscribe().catch(() => {});
    await connecting;
    await Promise.allSettled([...pendingEvents]);
  };
}
