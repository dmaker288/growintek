import "server-only";

/**
 * Composio tool execution.
 *
 * Composio holds the OAuth grants for Facebook, Instagram and YouTube, so this
 * app never stores a Meta or Google social token. Each call names a tool slug
 * and the connected account to run it as.
 *
 * Docs: POST {base}/api/v3/tools/execute/{slug}
 *       headers: x-api-key
 *       body:    { arguments, connected_account_id, user_id }
 */

export type ComposioResult = {
  ok: boolean;
  data: unknown;
  error?: string;
};

export function composioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

export async function executeTool(
  slug: string,
  args: Record<string, unknown>,
  connectedAccountId?: string
): Promise<ComposioResult> {
  const key = process.env.COMPOSIO_API_KEY;
  if (!key) return { ok: false, data: null, error: "COMPOSIO_API_KEY is not set." };

  const base = (process.env.COMPOSIO_BASE_URL ?? "https://backend.composio.dev").replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/api/v3/tools/execute/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        arguments: args,
        connected_account_id: connectedAccountId || undefined,
        user_id: connectedAccountId ? undefined : "growintek",
      }),
      cache: "no-store",
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }

    if (!res.ok) {
      const message =
        (json as { error?: { message?: string }; message?: string } | null)?.error?.message ??
        (json as { message?: string } | null)?.message ??
        `Composio returned ${res.status}`;
      return { ok: false, data: json, error: message };
    }

    return { ok: true, data: json };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : "Composio request failed.",
    };
  }
}

/**
 * Composio wraps tool output differently depending on the app. This digs
 * through the common shapes — data.data, data.response_data, data.data.data —
 * and returns the payload object that actually holds the platform's records.
 */
export function unwrap(result: ComposioResult): Record<string, unknown> {
  if (!result.data || typeof result.data !== "object") return {};
  let node = result.data as Record<string, unknown>;

  for (let i = 0; i < 4; i++) {
    const next =
      (node.data as Record<string, unknown> | undefined) ??
      (node.response_data as Record<string, unknown> | undefined) ??
      (node.response as Record<string, unknown> | undefined);

    if (!next || typeof next !== "object" || next === node) break;
    node = next;
  }

  return node;
}
