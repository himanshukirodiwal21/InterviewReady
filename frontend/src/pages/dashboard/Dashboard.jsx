import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LogOut, ArrowRight, TrendingUp } from "lucide-react";
import api from "../../services/api";
import "./Dashboard.css";

// --- Placeholder data ---------------------------------------------------
// Stands in for real interview history until the backend exposes
// interview/score endpoints. Shape mirrors what the SRS describes:
// FR-15 (per-interview score + feedback) and FR-17 (progress over time).

const SAMPLE_TREND = [62, 68, 71, 74, 79, 76, 84];

const SAMPLE_HISTORY = [
  {
    id: 1,
    type: "Technical Interview",
    difficulty: "Intermediate",
    date: "Jun 21, 2026",
    score: 84,
  },
  {
    id: 2,
    type: "HR Interview",
    difficulty: "Beginner",
    date: "Jun 18, 2026",
    score: 76,
  },
  {
    id: 3,
    type: "Mixed Interview",
    difficulty: "Intermediate",
    date: "Jun 14, 2026",
    score: 79,
  },
  {
    id: 4,
    type: "Technical Interview",
    difficulty: "Beginner",
    date: "Jun 09, 2026",
    score: 71,
  },
];

const SAMPLE_CRITERIA = [
  { label: "Accuracy", value: 82 },
  { label: "Relevance", value: 85 },
  { label: "Communication", value: 80 },
  { label: "Completeness", value: 84 },
];

function readCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(readCurrentUser);
  const [loggingOut, setLoggingOut] = useState(false);

  const bestScore = Math.max(...SAMPLE_TREND);
  const avgScore = Math.round(
    SAMPLE_TREND.reduce((sum, n) => sum + n, 0) / SAMPLE_TREND.length
  );
  const improvement = SAMPLE_TREND[SAMPLE_TREND.length - 1] - SAMPLE_TREND[0];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/v1/users/logout");
    } catch (err) {
      // Even if the backend call fails (e.g. token already expired),
      // we still want to clear the local session below.
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("currentUser");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="ir-dash">
      <div className="ir-dash__inner">
        <header className="ir-dash__header">
          <div>
            <h1 className="ir-dash__greeting">
              Welcome back{currentUser?.fullName ? `, ${currentUser.fullName.split(" ")[0]}` : ""}.
            </h1>
            <p className="ir-dash__subtext">
              Here's how your last {SAMPLE_TREND.length} mock interviews have gone.
            </p>
          </div>
          <div className="ir-dash__header-actions">
            <a href="/interview/new" className="ir-dash__cta">
              Start a mock interview
              <ArrowRight size={15} strokeWidth={2.25} />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ir-dash__logout"
            >
              <LogOut size={15} strokeWidth={2} />
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </header>

        <section className="ir-dash__stats">
          <StatCard label="Average score" value={avgScore} accent />
          <StatCard label="Best performance" value={bestScore} />
          <StatCard label="Interviews completed" value={SAMPLE_TREND.length} />
          <StatCard
            label="Improvement trend"
            value={`${improvement >= 0 ? "+" : ""}${improvement}`}
            trend
          />
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Progress over time</h2>
            <span className="ir-dash__section-note">Last {SAMPLE_TREND.length} sessions</span>
          </div>
          <TrendChart data={SAMPLE_TREND} />
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Most recent feedback</h2>
            <span className="ir-dash__section-note">Weighted by FR-13 criteria</span>
          </div>
          <div className="ir-criteria">
            {SAMPLE_CRITERIA.map((c) => (
              <div key={c.label} className="ir-criteria__item">
                <div className="ir-criteria__head">
                  <span className="ir-criteria__label">{c.label}</span>
                  <span className="ir-criteria__value">{c.value}</span>
                </div>
                <div className="ir-criteria__track">
                  <div
                    className="ir-criteria__fill"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Interview history</h2>
            <span className="ir-dash__section-note">{SAMPLE_HISTORY.length} sessions</span>
          </div>

          {SAMPLE_HISTORY.length === 0 ? (
            <div className="ir-dash__empty">
              <p className="ir-dash__empty-text">
                No interviews yet — your first session will show up here.
              </p>
              <a href="/interview/new" className="ir-dash__cta">
                Start a mock interview
                <ArrowRight size={15} strokeWidth={2.25} />
              </a>
            </div>
          ) : (
            <div className="ir-history__list">
              {SAMPLE_HISTORY.map((item) => (
                <div key={item.id} className="ir-history__row">
                  <div>
                    <p className="ir-history__type">{item.type}</p>
                    <p className="ir-history__meta">{item.date}</p>
                  </div>
                  <span className="ir-history__badge">{item.difficulty}</span>
                  <span className="ir-history__score">
                    {item.score}
                    <span className="ir-history__score-max">/100</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent, trend }) {
  return (
    <div className="ir-dash__stat-card">
      <p className="ir-dash__stat-label">{label}</p>
      <p className={`ir-dash__stat-value ${accent ? "ir-dash__stat-value--accent" : ""}`}>
        {value}
      </p>
      {trend && (
        <span className="ir-dash__stat-trend">
          <TrendingUp size={13} strokeWidth={2} />
          since first session
        </span>
      )}
    </div>
  );
}

// Signature element: a hand-built SVG line chart (no charting library) that
// plots score-over-time — the one visual a candidate should remember,
// echoing the scorecard motif used on the Home page.
function TrendChart({ data }) {
  const width = 600;
  const height = 180;
  const padding = 24;
  const min = 50;
  const max = 100;

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((value - min) / (max - min)) * (height - padding * 2);
    return { x, y, value };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `M ${points[0].x.toFixed(1)} ${height - padding} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${points[points.length - 1].x.toFixed(1)} ${height - padding} Z`;

  return (
    <div className="ir-trend">
      <svg
        className="ir-trend__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Score trend across ${data.length} interviews, from ${data[0]} to ${data[data.length - 1]}`}
      >
        {[60, 75, 90].map((gridValue) => {
          const y =
            height - padding - ((gridValue - min) / (max - min)) * (height - padding * 2);
          return (
            <g key={gridValue}>
              <line
                className="ir-trend__gridline"
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
              />
              <text className="ir-trend__axis-label" x={4} y={y + 3}>
                {gridValue}
              </text>
            </g>
          );
        })}

        <path className="ir-trend__area" d={areaPath} />
        <path className="ir-trend__line" d={linePath} />

        {points.map((p, i) => (
          <circle
            key={i}
            className={`ir-trend__dot ${i === points.length - 1 ? "ir-trend__dot--latest" : ""}`}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3.5}
          />
        ))}
      </svg>
    </div>
  );
}