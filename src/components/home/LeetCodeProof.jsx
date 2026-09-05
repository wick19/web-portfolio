import { useCallback, useEffect, useState } from "react";
import {
  getCachedLeetCodeStats,
  getLeetCodeStats,
  LEETCODE_FALLBACK,
  LEETCODE_PROFILE_URL,
} from "../../lib/leetcodeStats";

function formatRank(n) {
  return `#${Number(n).toLocaleString("en-US")}`;
}

function formatCount(n) {
  return Number(n).toLocaleString("en-US");
}

export default function LeetCodeProof() {
  const [stats, setStats] = useState(
    () => getCachedLeetCodeStats() || LEETCODE_FALLBACK
  );
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getLeetCodeStats({ force: true });
      setStats(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getLeetCodeStats({ force: true }).then((data) => {
      if (!cancelled) setStats(data);
    });

    function onReturn() {
      if (document.visibilityState !== "visible") return;
      refresh();
    }

    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    window.addEventListener("portfolio:leetcode-refresh", refresh);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("portfolio:leetcode-refresh", refresh);
    };
  }, [refresh]);

  const total = Math.max(1, Number(stats.totalSolved) || 1);
  const easy = Number(stats.easySolved) || 0;
  const medium = Number(stats.mediumSolved) || 0;
  const hard = Number(stats.hardSolved) || 0;

  const cells = [
    {
      id: "solved",
      label: "Solved",
      value: formatCount(stats.totalSolved),
      tone: "solved",
      mix: { easy, medium, hard, total },
    },
    {
      id: "hard",
      label: "Hard",
      value: formatCount(hard),
      tone: "hard",
      share: hard / total,
    },
    {
      id: "medium",
      label: "Medium",
      value: formatCount(medium),
      tone: "medium",
      share: medium / total,
    },
    {
      id: "easy",
      label: "Easy",
      value: formatCount(easy),
      tone: "easy",
      share: easy / total,
    },
    {
      id: "rank",
      label: "Global rank",
      value: formatRank(stats.ranking),
      tone: "rank",
    },
  ];

  const profileUrl = stats.profileUrl || LEETCODE_PROFILE_URL;

  return (
    <section className="leetcode-proof" aria-labelledby="leetcode-heading">
      <div className="leetcode-head">
        <div className="section-heading-row">
          <p className="section-label">// Algorithms</p>
          <h2 id="leetcode-heading">LeetCode</h2>
          <p className="section-lede">
            Live problem-solving stats — pulled fresh when you open this page
            or the profile.
          </p>
        </div>

        <a
          className="leetcode-profile-link"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            refresh();
          }}
        >
          {refreshing ? "Refreshing…" : "Open profile"}
        </a>
      </div>

      <ul
        className={
          refreshing ? "leetcode-cells is-refreshing" : "leetcode-cells"
        }
        aria-live="polite"
      >
        {cells.map((cell) => (
          <li
            key={cell.id}
            className={`leetcode-cell leetcode-cell-${cell.tone}`}
          >
            <span className="leetcode-cell-label">{cell.label}</span>
            <span className="leetcode-cell-value">{cell.value}</span>
            {cell.tone === "rank" ? null : (
              <span className="leetcode-bar" aria-hidden="true">
                {cell.mix ? (
                  <>
                    <span
                      className="leetcode-bar-seg is-easy"
                      style={{
                        width: `${(cell.mix.easy / cell.mix.total) * 100}%`,
                      }}
                    />
                    <span
                      className="leetcode-bar-seg is-medium"
                      style={{
                        width: `${(cell.mix.medium / cell.mix.total) * 100}%`,
                      }}
                    />
                    <span
                      className="leetcode-bar-seg is-hard"
                      style={{
                        width: `${(cell.mix.hard / cell.mix.total) * 100}%`,
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="leetcode-bar-seg"
                    style={{
                      width: `${Math.max(14, Math.round((cell.share || 0) * 100))}%`,
                    }}
                  />
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
