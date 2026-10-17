import "server-only";

/**
 * Model access. DashScope (Qwen, OpenAI-compatible) is primary; Google AI
 * Studio (Gemini) is the fallback when DashScope fails or is not configured.
 *
 * Server-only on purpose: these keys must never reach a client bundle, so the
 * chat surfaces call route handlers that import this module.
 */

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ChatOptions = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type ChatResult = {
  ok: boolean;
  text: string;
  provider: "dashscope" | "gemini" | "none";
  error?: string;
};

const DASHSCOPE_BASE = () =>
  (process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");

export function aiConfigured(): boolean {
  return Boolean(process.env.DASHSCOPE_API_KEY || process.env.GOOGLE_AI_API_KEY);
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  const dashscopeKey = process.env.DASHSCOPE_API_KEY;

  if (dashscopeKey) {
    const result = await callDashScope(dashscopeKey, options);
    if (result.ok) return result;
    console.warn("[ai] DashScope failed, trying Gemini:", result.error);
  }

  const googleKey = process.env.GOOGLE_AI_API_KEY;
  if (googleKey) {
    return callGemini(googleKey, options);
  }

  return {
    ok: false,
    text: "",
    provider: "none",
    error: dashscopeKey
      ? "The model provider is unavailable. Email us and we will reply directly."
      : "No model provider configured.",
  };
}

async function callDashScope(key: string, options: ChatOptions): Promise<ChatResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);

  try {
    const res = await fetch(`${DASHSCOPE_BASE()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.DASHSCOPE_CHAT_MODEL ?? "qwen-max",
        messages: options.messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? Number(process.env.AGENT_MAX_TOKENS ?? 700),
        stream: false,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, text: "", provider: "dashscope", error: `DashScope ${res.status}: ${(await res.text()).slice(0, 300)}` };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) return { ok: false, text: "", provider: "dashscope", error: "Empty completion." };
    return { ok: true, text, provider: "dashscope" };
  } catch (err) {
    return {
      ok: false,
      text: "",
      provider: "dashscope",
      error: err instanceof Error ? err.message : "DashScope request failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(key: string, options: ChatOptions): Promise<ChatResult> {
  const model = process.env.GOOGLE_AI_MODEL ?? "gemini-2.5-flash";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 45_000);

  // Gemini keeps the system prompt separate and requires alternating turns.
  const system = options.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: {
            temperature: options.temperature ?? 0.4,
            maxOutputTokens: options.maxTokens ?? Number(process.env.AGENT_MAX_TOKENS ?? 700),
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return { ok: false, text: "", provider: "gemini", error: `Gemini ${res.status}: ${(await res.text()).slice(0, 300)}` };
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";

    if (!text) return { ok: false, text: "", provider: "gemini", error: "Empty completion." };
    return { ok: true, text, provider: "gemini" };
  } catch (err) {
    return {
      ok: false,
      text: "",
      provider: "gemini",
      error: err instanceof Error ? err.message : "Gemini request failed.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Image generation via Qwen, normalised to WebP.
 * Returns a data buffer plus the mime type actually produced.
 */
export async function generateImage(
  prompt: string,
  size: "1024*1024" | "1280*720" | "720*1280" = "1280*720"
): Promise<{ ok: boolean; bytes?: Buffer; mimeType?: string; error?: string }> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) return { ok: false, error: "DASHSCOPE_API_KEY is not set." };

  try {
    const res = await fetch(
      `${DASHSCOPE_BASE()}/services/aigc/text2image/image-synthesis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "X-DashScope-Async": "disable",
        },
        body: JSON.stringify({
          model: process.env.DASHSCOPE_IMAGE_MODEL ?? "qwen-image-2.0",
          input: { prompt },
          parameters: { size, n: 1 },
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return { ok: false, error: `Image model ${res.status}: ${(await res.text()).slice(0, 300)}` };
    }

    const json = (await res.json()) as {
      output?: { results?: { url?: string }[] };
    };
    const url = json.output?.results?.[0]?.url;
    if (!url) return { ok: false, error: "The image model returned no URL." };

    const img = await fetch(url, { cache: "no-store" });
    if (!img.ok) return { ok: false, error: "Could not download the generated image." };

    const original = Buffer.from(await img.arrayBuffer());
    const mime = img.headers.get("content-type") ?? "image/png";

    // Re-encoding to WebP is handled by the caller (sharp, if installed);
    // the model usually returns PNG, which is fine to store directly.
    return { ok: true, bytes: original, mimeType: mime };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Image generation failed." };
  }
}
