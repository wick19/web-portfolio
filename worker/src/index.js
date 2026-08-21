import { SYSTEM_PROMPT } from "./knowledge.js";

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
const MAX_BODY_BYTES = 8_000;

/** Per-IP limits (Cache API — survives isolate churn better than memory). */
const IP_PER_MINUTE = 3;
const IP_PER_HOUR = 10;
const GLOBAL_PER_DAY = 120;

/** Cloudflare Workers AI free allocation: 10,000 Neurons/day (resets 00:00 UTC). */
const FREE_NEURONS_PER_DAY = 10_000;
const QUOTA_KILL_CACHE = "https://concierge.rate/quota-kill/";

/** Cloudflare Workers AI — free tier, no external paid API key. */
const CF_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Portfolio-Token",
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
  if (!expected) return true; // optional until you set the secret
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

async function allowRequest(request) {
  const cache = caches.default;
  const ip = encodeURIComponent(clientIp(request));
  const now = new Date();
  const minute = `${now.toISOString().slice(0, 16)}`; // YYYY-MM-DDTHH:MM
  const hour = `${now.toISOString().slice(0, 13)}`; // YYYY-MM-DDTHH
  const day = now.toISOString().slice(0, 10);

  const checks = [
    bumpCounter(
      cache,
      `https://concierge.rate/ip-min/${ip}/${minute}`,
      IP_PER_MINUTE,
      60
    ),
    bumpCounter(
      cache,
      `https://concierge.rate/ip-hour/${ip}/${hour}`,
      IP_PER_HOUR,
      3600
    ),
    bumpCounter(
      cache,
      `https://concierge.rate/global-day/${day}`,
      GLOBAL_PER_DAY,
      86400
    ),
  ];

  const results = await Promise.all(checks);
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
  const result = await ai.run(CF_MODEL, {
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
  if (!trimmed) {
    throw new Error("Empty model response");
  }
  return trimmed;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin && !originAllowed(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === "GET") {
      const quotaPaused = await isDailyQuotaKilled(caches.default);
      return json(
        {
          ok: true,
          service: "ritwik-portfolio-concierge",
          model: CF_MODEL,
          provider: "cloudflare-workers-ai",
          hasAiBinding: Boolean(env.AI),
          enabled: env.CONCIERGE_ENABLED !== "false",
          freeNeuronsPerDay: FREE_NEURONS_PER_DAY,
          quotaPaused,
          resetsAt: "00:00 UTC",
        },
        200,
        origin
      );
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    // Hard kill switch — set CONCIERGE_ENABLED=false in wrangler / dashboard
    if (env.CONCIERGE_ENABLED === "false") {
      return json(
        { error: "Concierge is paused for now. Please go through the website to understand more — Home, Projects, Thesis, Experience, or Contact." },
        503,
        origin
      );
    }

    // Auto daily kill — armed when Workers AI returns free-neuron exhaustion (4006)
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

    // Browser calls must come from the portfolio (blocks casual curl/bots)
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

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: "Payload too large" }, 413, origin);
    }

    const gate = await allowRequest(request);
    if (!gate.ok) {
      const msg =
        gate.reason === "daily_limit"
          ? "Daily concierge capacity reached. Please go through the website to understand more — try again tomorrow."
          : gate.reason === "burst"
            ? "Too many requests. Please go through the website while you wait a minute."
            : "Rate limit reached. Please go through the website to understand more, then try again later.";
      return json({ error: msg }, 429, origin);
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
      return json({ reply, model: CF_MODEL }, 200, origin);
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
  },
};
