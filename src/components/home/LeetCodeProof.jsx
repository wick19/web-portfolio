import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    getLeetCodeStats().then((data) => {
      if (cancelled) return;
      setStats(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const cells = [
    { label: "Solved", value: formatCount(stats.totalSolved) },
    { label: "Hard", value: formatCount(stats.hardSolved) },
    { label: "Medium", value: formatCount(stats.mediumSolved) },
    { label: "Easy", value: formatCount(stats.easySolved) },
    { label: "Rank", value: formatRank(stats.ranking) },
  ];

  return (
    <section className="leetcode-proof" aria-labelledby="leetcode-heading">
      <div className="section-heading-row">
        <p className="section-label">// Algorithms</p>
        <h2 id="leetcode-heading">LeetCode</h2>
        <p className="section-lede">
          Live problem-solving stats — refreshed daily by the portfolio Worker.
        </p>
      </div>

      <div className="leetcode-strip" aria-live="polite">
        <ul className="leetcode-cells">
          {cells.map((cell) => (
            <li key={cell.label} className="leetcode-cell">
              <span className="leetcode-cell-value">{cell.value}</span>
              <span className="leetcode-cell-label">{cell.label}</span>
            </li>
          ))}
        </ul>

        <a
          className="leetcode-profile-link"
          href={stats.profileUrl || LEETCODE_PROFILE_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open profile
        </a>
      </div>
    </section>
  );
}
