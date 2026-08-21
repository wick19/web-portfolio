const USERNAME = "wick19";
const PROFILE_URL = `https://leetcode.com/u/${USERNAME}/`;
const API_URL = `https://leetcode-stats.tashif.codes/${USERNAME}`;
const CACHE_KEY = `portfolio:leetcode:${USERNAME}`;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

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

function normalize(payload) {
  if (!payload || payload.status === "error") return null;
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
  };
}

/**
 * Returns cached stats immediately when fresh (< 24h).
 * Refreshes from the live API when the cache is missing or stale.
 */
export async function getLeetCodeStats({ force = false } = {}) {
  const cached = readCache();
  const fresh =
    cached && !force && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (fresh) {
    return { ...cached.data, source: "cache" };
  }

  try {
    const res = await fetch(API_URL, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`LeetCode API ${res.status}`);
    const json = await res.json();
    const data = normalize(json);
    if (!data) throw new Error("Unexpected LeetCode payload");
    writeCache(data);
    return { ...data, source: "live" };
  } catch {
    if (cached?.data) return { ...cached.data, source: "stale-cache" };
    return { ...LEETCODE_FALLBACK, source: "fallback" };
  }
}

export { USERNAME as LEETCODE_USERNAME, PROFILE_URL as LEETCODE_PROFILE_URL };
