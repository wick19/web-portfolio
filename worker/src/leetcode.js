/** LeetCode snapshot refresh + cache (no Workers AI Neurons). */

const LEETCODE_USER = "wick19";
const LEETCODE_API = `https://leetcode-stats.tashif.codes/${LEETCODE_USER}`;
const LEETCODE_PROFILE = `https://leetcode.com/u/${LEETCODE_USER}/`;
const LEETCODE_CACHE_URL = "https://concierge.cache/leetcode/latest";

/** Serve cache without an upstream hit if it is younger than this (seconds). */
export const FRESH_WINDOW_SECONDS = 120;

function snapshotAgeSeconds(body) {
  const t = body?.fetchedAt ? Date.parse(body.fetchedAt) : NaN;
  if (!Number.isFinite(t)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

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

async function fetchFromGraphql() {
  const res = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://leetcode.com",
      Referer: LEETCODE_PROFILE,
    },
    body: JSON.stringify({
      query: `query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum { difficulty count }
          }
          profile { ranking }
        }
      }`,
      variables: { username: LEETCODE_USER },
    }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}`);
  const json = await res.json();
  const user = json?.data?.matchedUser;
  const rows = user?.submitStatsGlobal?.acSubmissionNum || [];
  const count = (difficulty) =>
    Number(rows.find((row) => row.difficulty === difficulty)?.count);
  return normalize({
    totalSolved: count("All"),
    easySolved: count("Easy"),
    mediumSolved: count("Medium"),
    hardSolved: count("Hard"),
    ranking: Number(user?.profile?.ranking),
  });
}

async function fetchFromTashif() {
  const res = await fetch(LEETCODE_API, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LeetCode upstream ${res.status}`);
  const json = await res.json();
  const data = normalize(json);
  if (!data) throw new Error("Unexpected LeetCode payload");
  return data;
}

async function fetchUpstream() {
  try {
    const live = await fetchFromGraphql();
    if (live) return live;
  } catch {
    /* LeetCode GraphQL can block some edges — public stats API is the fallback */
  }
  return fetchFromTashif();
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

/**
 * Near real-time read for page opens.
 * - Returns the cached snapshot instantly if it is younger than `maxAgeSeconds`.
 * - Otherwise pulls a fresh snapshot from upstream (so the visitor opening the
 *   page sees current numbers), then caches it.
 * - Falls back to the last good snapshot if the upstream call fails.
 * `force: true` always refreshes (bypasses the freshness window).
 */
export async function getFreshLeetCode({
  maxAgeSeconds = FRESH_WINDOW_SECONDS,
  force = false,
} = {}) {
  const cached = await readLeetCodeCache();
  const hasCache = cached?.totalSolved != null && cached?.ranking != null;

  if (!force && hasCache && snapshotAgeSeconds(cached) <= maxAgeSeconds) {
    return { ...cached, source: cached.source || "cache" };
  }

  try {
    return await refreshLeetCodeCache();
  } catch (err) {
    if (hasCache) return { ...cached, source: "stale-cache" };
    throw err;
  }
}
