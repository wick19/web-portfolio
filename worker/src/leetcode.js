/** LeetCode snapshot refresh + cache (no Workers AI Neurons). */

const LEETCODE_USER = "wick19";
const LEETCODE_API = `https://leetcode-stats.tashif.codes/${LEETCODE_USER}`;
const LEETCODE_PROFILE = `https://leetcode.com/u/${LEETCODE_USER}/`;
const LEETCODE_CACHE_URL = "https://concierge.cache/leetcode/latest";

export function secondsUntilNextUtcMidnight() {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(60, Math.floor((next - now.getTime()) / 1000));
}

function normalize(payload) {
  if (!payload || payload.status === "error") return null;
  const totalSolved = Number(payload.totalSolved);
  const ranking = Number(payload.ranking);
  if (!Number.isFinite(totalSolved) || !Number.isFinite(ranking)) return null;

  return {
    username: LEETCODE_USER,
    profileUrl: LEETCODE_PROFILE,
    totalSolved,
    easySolved: Number(payload.easySolved) || 0,
    mediumSolved: Number(payload.mediumSolved) || 0,
    hardSolved: Number(payload.hardSolved) || 0,
    ranking,
    acceptanceRate: Number(payload.acceptanceRate) || null,
  };
}

async function fetchUpstream() {
  const res = await fetch(LEETCODE_API, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`LeetCode upstream ${res.status}`);
  const json = await res.json();
  const data = normalize(json);
  if (!data) throw new Error("Unexpected LeetCode payload");
  return data;
}

export async function refreshLeetCodeCache() {
  const data = await fetchUpstream();
  const body = {
    ok: true,
    fetchedAt: new Date().toISOString(),
    source: "live",
    ...data,
  };
  const ttl = Math.max(secondsUntilNextUtcMidnight(), 3600);
  await caches.default.put(
    new Request(LEETCODE_CACHE_URL),
    new Response(JSON.stringify(body), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": `max-age=${ttl}`,
      },
    })
  );
  return body;
}

export async function readLeetCodeCache() {
  const hit = await caches.default.match(new Request(LEETCODE_CACHE_URL));
  if (!hit) return null;
  try {
    return await hit.json();
  } catch {
    return null;
  }
}

/** Serve cached snapshot; refresh on miss (also used by cron). */
export async function getOrRefreshLeetCode() {
  const cached = await readLeetCodeCache();
  if (cached?.totalSolved != null && cached?.ranking != null) {
    return { ...cached, source: cached.source || "cache" };
  }
  return refreshLeetCodeCache();
}
