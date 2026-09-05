import { SYSTEM_PROMPT } from "./knowledge.js";
import {
  getFreshLeetCode,
  refreshLeetCodeCache,
} from "./leetcode.js";

const ALLOWED_ORIGINS = [
  "https://wick19.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY = 6;
const MAX_TOKENS = 384;
const MAX_CHAT_BODY_BYTES = 8_000;

/** Short utterances only — keeps free Neurons in check. */
const MAX_AUDIO_BYTES = 280_000; // ~280KB
const MIN_AUDIO_BYTES = 800;

/** Chat rate limits */
const IP_PER_MINUTE = 3;
const IP_PER_HOUR = 10;
const GLOBAL_PER_DAY = 120;

/** Stricter STT limits (Whisper costs more Neurons than chat). */
const STT_IP_PER_MINUTE = 2;
const STT_IP_PER_HOUR = 6;
const STT_GLOBAL_PER_DAY = 40;

const FREE_NEURONS_PER_DAY = 10_000;
const QUOTA_KILL_CACHE = "https://concierge.rate/quota-kill/";

const CF_CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
/** English-only tiny Whisper — cheapest ASR on Workers AI free tier. */
const CF_STT_MODEL = "@cf/openai/whisper-tiny-en";

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilNextUtcMidnight() {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(60, Math.floor((next - now.getTime()) / 1000));
}

async function isDailyQuotaKilled(cache) {
  const hit = await cache.match(new Request(`${QUOTA_KILL_CACHE}${utcDay()}`));
  return Boolean(hit);
}

async function armDailyQuotaKill(cache) {
  await cache.put(
    new Request(`${QUOTA_KILL_CACHE}${utcDay()}`),
    new Response("1", {
      headers: {
        "Cache-Control": `max-age=${secondsUntilNextUtcMidnight()}`,
      },
    })
  );
}

function isNeuronQuotaError(err) {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("4006") ||
    /daily free allocation/i.test(msg) ||
    (/neuron/i.test(msg) &&
      /limit|exceed|used up|allocation|upgrade/i.test(msg))
  );
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Portfolio-Token, X-Audio-Format",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
  });
}

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function originAllowed(origin) {
  return ALLOWED_ORIGINS.includes(origin);
}

function tokenOk(request, env) {
  const expected = env.ACCESS_TOKEN;
  if (!expected) return true;
  const got = request.headers.get("X-Portfolio-Token") || "";
  return got === expected;
}

async function bumpCounter(cache, keyUrl, limit, ttlSeconds) {
  const key = new Request(keyUrl);
  const hit = await cache.match(key);
  let count = 0;
  if (hit) {
    count = Number(await hit.text()) || 0;
  }
  if (count >= limit) {
    return { ok: false, count };
  }
  count += 1;
  await cache.put(
    key,
    new Response(String(count), {
      headers: { "Cache-Control": `max-age=${ttlSeconds}` },
    })
  );
  return { ok: true, count };
}

async function allowRequest(request, { stt = false } = {}) {
  const cache = caches.default;
  const ip = encodeURIComponent(clientIp(request));
  const now = new Date();
  const minute = `${now.toISOString().slice(0, 16)}`;
  const hour = `${now.toISOString().slice(0, 13)}`;
  const day = now.toISOString().slice(0, 10);
  const prefix = stt ? "stt" : "chat";

  const perMin = stt ? STT_IP_PER_MINUTE : IP_PER_MINUTE;
  const perHour = stt ? STT_IP_PER_HOUR : IP_PER_HOUR;
  const perDay = stt ? STT_GLOBAL_PER_DAY : GLOBAL_PER_DAY;

  const results = await Promise.all([
    bumpCounter(
      cache,
      `https://concierge.rate/${prefix}-ip-min/${ip}/${minute}`,
      perMin,
      60
    ),
    bumpCounter(
      cache,
      `https://concierge.rate/${prefix}-ip-hour/${ip}/${hour}`,
      perHour,
      3600
    ),
    bumpCounter(
      cache,
      `https://concierge.rate/${prefix}-global-day/${day}`,
      perDay,
      86400
    ),
  ]);

  if (!results[0].ok) return { ok: false, reason: "burst" };
  if (!results[1].ok) return { ok: false, reason: "ip_limit" };
  if (!results[2].ok) return { ok: false, reason: "daily_limit" };
  return { ok: true };
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    if (!item || typeof item !== "object") continue;
    const role = item.role === "assistant" ? "assistant" : "user";
    const content = String(item.content || "")
      .trim()
      .slice(0, MAX_MESSAGE_CHARS);
    if (!content) continue;
    cleaned.push({ role, content });
  }
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") {
    return null;
  }
  return cleaned;
}

async function callWorkersAI(ai, messages) {
  const result = await ai.run(CF_CHAT_MODEL, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
    max_tokens: MAX_TOKENS,
    temperature: 0.35,
  });

  const text =
    (typeof result === "string" ? result : null) ||
    result?.response ||
    result?.result?.response ||
    "";

  const trimmed = String(text).trim();
  if (!trimmed) throw new Error("Empty model response");
  return trimmed;
}

function extractTranscript(result) {
  if (!result) return "";
  if (typeof result === "string") return result.trim();
  return String(
    result.text ||
      result.transcription ||
      result.result?.text ||
      result.response ||
      ""
  ).trim();
}

async function transcribeAudio(ai, arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // Workers AI Whisper input: numeric byte array
  const result = await ai.run(CF_STT_MODEL, {
    audio: Array.from(bytes),
  });
  const text = extractTranscript(result).slice(0, MAX_MESSAGE_CHARS);
  if (!text) throw new Error("Empty transcription");
  return text;
}

function rateLimitMessage(reason) {
  if (reason === "daily_limit") {
    return "Daily concierge capacity reached. Please go through the website to understand more — try again tomorrow.";
  }
  if (reason === "burst") {
    return "Too many requests. Please go through the website while you wait a minute.";
  }
  return "Rate limit reached. Please go through the website to understand more, then try again later.";
}

async function guardCommon(request, env, origin) {
  if (env.CONCIERGE_ENABLED === "false") {
    return json(
      {
        error:
          "Concierge is paused for now. Please go through the website to understand more — Home, Projects, Thesis, Experience, or Contact.",
      },
      503,
      origin
    );
  }

  if (await isDailyQuotaKilled(caches.default)) {
    return json(
      {
        error:
          "Daily free AI quota is used up. Please go through the website to understand more — try again after 00:00 UTC.",
        code: "quota_day_kill",
      },
      503,
      origin
    );
  }

  if (!originAllowed(origin)) {
    return json({ error: "Forbidden origin" }, 403, origin);
  }

  if (!tokenOk(request, env)) {
    return json({ error: "Forbidden" }, 403, origin);
  }

  if (!env.AI) {
    return json(
      {
        error:
          "AI binding missing. Redeploy worker with wrangler.toml [ai] binding.",
      },
      500,
      origin
    );
  }

  return null;
}

async function handleChat(request, env, origin) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_CHAT_BODY_BYTES) {
    return json({ error: "Payload too large" }, 413, origin);
  }

  const gate = await allowRequest(request, { stt: false });
  if (!gate.ok) {
    return json({ error: rateLimitMessage(gate.reason) }, 429, origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin);
  }

  const messages = sanitizeMessages(payload?.messages);
  if (!messages) {
    return json({ error: "Send a non-empty user message" }, 400, origin);
  }

  try {
    const reply = await callWorkersAI(env.AI, messages);
    return json({ reply, model: CF_CHAT_MODEL }, 200, origin);
  } catch (err) {
    if (isNeuronQuotaError(err)) {
      await armDailyQuotaKill(caches.default);
      return json(
        {
          error:
            "Daily free AI quota hit. Please go through the website to understand more — Concierge returns after 00:00 UTC.",
          code: "quota_day_kill",
        },
        503,
        origin
      );
    }
    return json(
      {
        error:
          "Concierge is temporarily unavailable. Please go through the website to understand more — Home, Projects, Thesis, Experience, or Contact.",
        detail: String(err?.message || err).slice(0, 160),
      },
      502,
      origin
    );
  }
}

async function handleStt(request, env, origin) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_AUDIO_BYTES) {
    return json(
      { error: "Audio too large — keep questions under ~8 seconds." },
      413,
      origin
    );
  }

  const ctype = (request.headers.get("Content-Type") || "").toLowerCase();
  const formatHint = (
    request.headers.get("X-Audio-Format") ||
    ctype ||
    ""
  ).toLowerCase();

  // Only allow common browser MediaRecorder containers
  const allowed =
    formatHint.includes("webm") ||
    formatHint.includes("mp4") ||
    formatHint.includes("mpeg") ||
    formatHint.includes("wav") ||
    formatHint.includes("ogg") ||
    formatHint.includes("octet-stream") ||
    formatHint.includes("audio/");

  if (ctype && !allowed) {
    return json({ error: "Unsupported audio type" }, 415, origin);
  }

  const gate = await allowRequest(request, { stt: true });
  if (!gate.ok) {
    return json({ error: rateLimitMessage(gate.reason) }, 429, origin);
  }

  let buffer;
  try {
    buffer = await request.arrayBuffer();
  } catch {
    return json({ error: "Could not read audio" }, 400, origin);
  }

  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    return json(
      { error: "Audio too large — keep questions under ~8 seconds." },
      413,
      origin
    );
  }
  if (buffer.byteLength < MIN_AUDIO_BYTES) {
    return json(
      { error: "Audio too short — speak a bit longer, then release." },
      400,
      origin
    );
  }

  try {
    const text = await transcribeAudio(env.AI, buffer);
    return json(
      {
        text,
        model: CF_STT_MODEL,
        bytes: buffer.byteLength,
      },
      200,
      origin
    );
  } catch (err) {
    if (isNeuronQuotaError(err)) {
      await armDailyQuotaKill(caches.default);
      return json(
        {
          error:
            "Daily free AI quota hit. Please go through the website to understand more — Concierge returns after 00:00 UTC.",
          code: "quota_day_kill",
        },
        503,
        origin
      );
    }
    return json(
      {
        error:
          "Could not transcribe audio. Try again or type your question.",
        detail: String(err?.message || err).slice(0, 160),
      },
      502,
      origin
    );
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      if (origin && !originAllowed(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET") {
      if (path === "/leetcode") {
        const force = url.searchParams.get("fresh") === "1";
        try {
          const data = await getFreshLeetCode({ force });
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              // Always revalidate at the Worker so page opens get current stats.
              "Cache-Control": "no-store",
              ...corsHeaders(origin),
            },
          });
        } catch (err) {
          return json(
            {
              ok: false,
              error: "LeetCode stats unavailable",
              detail: String(err?.message || err),
            },
            502,
            origin
          );
        }
      }

      const quotaPaused = await isDailyQuotaKilled(caches.default);
      return json(
        {
          ok: true,
          service: "ritwik-portfolio-concierge",
          chatModel: CF_CHAT_MODEL,
          sttModel: CF_STT_MODEL,
          provider: "cloudflare-workers-ai",
          hasAiBinding: Boolean(env.AI),
          enabled: env.CONCIERGE_ENABLED !== "false",
          freeNeuronsPerDay: FREE_NEURONS_PER_DAY,
          quotaPaused,
          resetsAt: "00:00 UTC",
          endpoints: {
            chat: "POST /",
            stt: "POST /stt",
            leetcode: "GET /leetcode",
          },
        },
        200,
        origin
      );
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const blocked = await guardCommon(request, env, origin);
    if (blocked) return blocked;

    if (path === "/stt") {
      return handleStt(request, env, origin);
    }

    return handleChat(request, env, origin);
  },

  /** Daily cron — pull LeetCode into Cache API (no site visit needed). */
  async scheduled(_event, _env, ctx) {
    ctx.waitUntil(
      refreshLeetCodeCache().catch((err) => {
        console.error("LeetCode cron refresh failed:", err);
      })
    );
  },
};
