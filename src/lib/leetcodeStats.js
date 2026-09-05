const USERNAME = "wick19";
const PROFILE_URL = `https://leetcode.com/u/${USERNAME}/`;
const UPSTREAM_API = `https://leetcode-stats.tashif.codes/${USERNAME}`;
const WORKER_BASE = (import.meta.env.VITE_CONCIERGE_URL || "").replace(
  /\/+$/,
  ""
);
const WORKER_API = WORKER_BASE ? `${WORKER_BASE}/leetcode` : "";
const CACHE_KEY = `portfolio:leetcode:${USERNAME}`;
/**
 * Browser cache is only for instant first paint / offline fallback.
 * Page open and "Open profile" always revalidate (force: true).
 */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Last known good snapshot — used until live fetch succeeds. */
export const LEETCODE_FALLBACK = {
  username: USERNAME,
  profileUrl: PROFILE_URL,
  totalSolved: 503,
  easySolved: 128,
  mediumSolved: 274,
  hardSolved: 101,
  ranking: 209238,
  acceptanceRate: 94.28,
};

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), data })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Sync read of last successful fetch (any age). */
export function getCachedLeetCodeStats() {
  return readCache()?.data || null;
}

function pickStats(payload) {
  if (!payload) return null;
  const totalSolved = Number(payload.totalSolved);
  const ranking = Number(payload.ranking);
  if (!Number.isFinite(totalSolved) || !Number.isFinite(ranking)) return null;

  return {
    username: USERNAME,
    profileUrl: PROFILE_URL,
    totalSolved,
    easySolved: Number(payload.easySolved) || 0,
    mediumSolved: Number(payload.mediumSolved) || 0,
    hardSolved: Number(payload.hardSolved) || 0,
    ranking,
    acceptanceRate: Number(payload.acceptanceRate) || null,
    fetchedAt: payload.fetchedAt || null,
  };
}

function fresherOf(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (Number(b.totalSolved) !== Number(a.totalSolved)) {
    return Number(b.totalSolved) > Number(a.totalSolved) ? b : a;
  }
  const aTime = Date.parse(a.fetchedAt || "") || 0;
  const bTime = Date.parse(b.fetchedAt || "") || 0;
  return bTime >= aTime ? b : a;
}

async function fetchFromWorker({ fresh = false } = {}) {
  if (!WORKER_API) return null;
  const url = fresh ? `${WORKER_API}?fresh=1` : WORKER_API;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Worker LeetCode ${res.status}`);
  const json = await res.json();
  if (json?.ok === false) throw new Error(json.error || "Worker LeetCode error");
  return pickStats(json);
}

async function fetchFromUpstream() {
  const res = await fetch(UPSTREAM_API, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LeetCode API ${res.status}`);
  const json = await res.json();
  if (json?.status === "error") throw new Error("LeetCode upstream error");
  return pickStats(json);
}

/**
 * force: true (page open / Open profile) hits live upstream + Worker in
 * parallel and keeps the higher solved count, so a stale Worker snapshot
 * cannot hide newer public stats.
 */
export async function getLeetCodeStats({ force = false } = {}) {
  const cached = readCache();
  const fresh =
    cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (fresh) {
    return { ...cached.data, source: "cache" };
  }

  const settled = await Promise.allSettled([
    fetchFromUpstream(),
    fetchFromWorker({ fresh: force }),
  ]);

  const payloads = settled
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  if (payloads.length) {
    const data = payloads.reduce((best, cur) => fresherOf(best, cur));
    writeCache(data);
    return { ...data, source: "live" };
  }

  if (cached?.data) return { ...cached.data, source: "stale-cache" };
  return { ...LEETCODE_FALLBACK, source: "fallback" };
}

export { USERNAME as LEETCODE_USERNAME, PROFILE_URL as LEETCODE_PROFILE_URL };
