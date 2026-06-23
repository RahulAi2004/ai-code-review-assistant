// Analytics for the user's review history: stat tiles, a severity donut,
// and a score-trend bar chart. Charts are hand-built SVG (no dependencies).

const SEVERITIES = [
  { key: 'critical', label: 'Critical', color: 'var(--critical)' },
  { key: 'high', label: 'High', color: 'var(--high)' },
  { key: 'medium', label: 'Medium', color: 'var(--medium)' },
  { key: 'low', label: 'Low', color: 'var(--low)' },
  { key: 'info', label: 'Info', color: 'var(--info)' },
];

function scoreHue(score) {
  return Math.round((score / 100) * 120);
}

function Donut({ totals, totalIssues }) {
  const r = 42;
  const C = 2 * Math.PI * r;
  let offset = 0;

  const segments =
    totalIssues > 0
      ? SEVERITIES.filter((s) => totals[s.key] > 0).map((s) => {
          const frac = totals[s.key] / totalIssues;
          const dash = frac * C;
          const seg = (
            <circle
              key={s.key}
              r={r}
              cx="50"
              cy="50"
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += dash;
          return seg;
        })
      : [
          <circle
            key="clean"
            r={r}
            cx="50"
            cy="50"
            fill="none"
            stroke="var(--clean)"
            strokeWidth="14"
          />,
        ];

  return (
    <svg viewBox="0 0 100 100" className="donut">
      <circle r={r} cx="50" cy="50" fill="none" stroke="var(--border)" strokeWidth="14" />
      {segments}
      <text x="50" y="46" textAnchor="middle" className="donut-num">
        {totalIssues}
      </text>
      <text x="50" y="60" textAnchor="middle" className="donut-cap">
        issues
      </text>
    </svg>
  );
}

function Trend({ scores }) {
  if (scores.length === 0) return null;
  return (
    <div className="trend">
      <div className="trend-bars">
        {scores.map((s, i) => (
          <div
            key={i}
            className="trend-bar"
            style={{
              height: `${Math.max(4, s)}%`,
              background: `hsl(${scoreHue(s)}, 72%, 55%)`,
            }}
            title={`Score ${s}`}
          />
        ))}
      </div>
      <div className="trend-axis">
        <span>oldest</span>
        <span>newest</span>
      </div>
    </div>
  );
}

export default function StatsPanel({ items }) {
  if (!items || items.length === 0) return null;

  const scored = items.filter((i) => typeof i.score === 'number');
  const avg = scored.length
    ? Math.round(scored.reduce((a, i) => a + i.score, 0) / scored.length)
    : null;
  const totalIssues = items.reduce((a, i) => a + (i.issueCount || 0), 0);

  const totals = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  items.forEach((i) => {
    const c = i.severityCounts || {};
    SEVERITIES.forEach((s) => {
      totals[s.key] += c[s.key] || 0;
    });
  });

  // Oldest -> newest, last 14, for the trend chart.
  const scores = [...items]
    .reverse()
    .filter((i) => typeof i.score === 'number')
    .slice(-14)
    .map((i) => i.score);

  return (
    <div className="stats">
      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-num">{items.length}</span>
          <span className="stat-label">Reviews</span>
        </div>
        <div className="stat-tile">
          <span className="stat-num" style={{ color: avg != null ? `hsl(${scoreHue(avg)},72%,58%)` : 'var(--muted)' }}>
            {avg ?? '—'}
          </span>
          <span className="stat-label">Avg score</span>
        </div>
        <div className="stat-tile">
          <span className="stat-num">{totalIssues}</span>
          <span className="stat-label">Issues found</span>
        </div>
      </div>

      <div className="charts">
        <div className="chart-card">
          <h4>Severity mix</h4>
          <div className="donut-wrap">
            <Donut totals={totals} totalIssues={totalIssues} />
            <ul className="donut-legend">
              {SEVERITIES.map((s) => (
                <li key={s.key}>
                  <span className="dot" style={{ background: s.color }} />
                  {s.label}
                  <span className="legend-n">{totals[s.key]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chart-card">
          <h4>Score trend</h4>
          <Trend scores={scores} />
        </div>
      </div>
    </div>
  );
}
