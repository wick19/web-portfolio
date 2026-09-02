const USERNAME = "wick19";
const PROFILE_URL = `https://leetcode.com/u/${USERNAME}/`;
const UPSTREAM_API = `https://leetcode-stats.tashif.codes/${USERNAME}`;
const WORKER_BASE = (import.meta.env.VITE_CONCIERGE_URL || "").replace(
  /\/+$/,
  ""
);
const WORKER_API = WORKER_BASE ? `${WORKER_BASE}/leetcode` : "";
const CACHE_KEY = `portfolio:leetcode:${USERNAME}`;
/** Short browser cache — Worker holds the daily snapshot. */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Last known good snapshot — used until live fetch succeeds. */
export const LEETCODE_FALLBACK = {
  username: USERNAME,
  profileUrl: PROFILE_URL,
  totalSolved: 488,
  easySolved: 124,
  mediumSolved: 265,
  hardSolved: 99,
  ranking: 217571,
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

async function fetchFromWorker() {
  if (!WORKER_API) return null;
  const res = await fetch(WORKER_API, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Worker LeetCode ${res.status}`);
  const json = await res.json();
  if (json?.ok === false) throw new Error(json.error || "Worker LeetCode error");
  return pickStats(json);
}

async function fetchFromUpstream() {
  const res = await fetch(UPSTREAM_API, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`LeetCode API ${res.status}`);
  const json = await res.json();
  if (json?.status === "error") throw new Error("LeetCode upstream error");
  return pickStats(json);
}

/**
 * Prefer Worker daily snapshot (cron-warmed). Fall back to public API.
 * Browser cache is short so Contact picks up the cron refresh quickly.
 */
export async function getLeetCodeStats({ force = false } = {}) {
  const cached = readCache();
  const fresh =
    cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (fresh) {
    return { ...cached.data, source: "cache" };
  }

  try {
    const data = (await fetchFromWorker()) || (await fetchFromUpstream());
    if (!data) throw new Error("No LeetCode payload");
    writeCache(data);
    return {
      ...data,
      source: WORKER_API ? "worker" : "live",
    };
  } catch {
    try {
      const data = await fetchFromUpstream();
      if (data) {
        writeCache(data);
        return { ...data, source: "live" };
      }
    } catch {
      /* fall through */
    }
    if (cached?.data) return { ...cached.data, source: "stale-cache" };
    return { ...LEETCODE_FALLBACK, source: "fallback" };
  }
}

export { USERNAME as LEETCODE_USERNAME, PROFILE_URL as LEETCODE_PROFILE_URL };
