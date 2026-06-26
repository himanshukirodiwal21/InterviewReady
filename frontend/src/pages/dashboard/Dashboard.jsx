import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogOut, ArrowRight, TrendingUp, ClipboardList } from "lucide-react";
import api from "../../services/api";
import "./Dashboard.css";

const TYPE_LABELS = {
  hr: "HR Interview",
  technical: "Technical Interview",
  mixed: "Mixed Interview",
};

function readCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function average(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(readCurrentUser);
  const [loggingOut, setLoggingOut] = useState(false);

  const [interviews, setInterviews] = useState(null); // null = loading
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/interviews/history")
      .then((res) => setInterviews(res.data.data))
      .catch((err) => {
        console.error(err);
        setLoadError(err.response?.data?.message || "Could not load your interview history");
        setInterviews([]);
      });
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/api/v1/users/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.removeItem("currentUser");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/", { replace: true });
    }
  };

  const firstName = currentUser?.fullName ? `, ${currentUser.fullName.split(" ")[0]}` : "";

  // ---- Loading state ----
  if (interviews === null) {
    return (
      <main className="ir-dash">
        <div className="ir-dash__inner">
          <p className="ir-dash__loading">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  // ---- Empty state: zero completed interviews ----
  if (interviews.length === 0) {
    return (
      <main className="ir-dash">
        <div className="ir-dash__inner">
          <header className="ir-dash__header">
            <div>
              <h1 className="ir-dash__greeting">Welcome{firstName}.</h1>
              <p className="ir-dash__subtext">
                {loadError || "You haven't completed any mock interviews yet."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="ir-dash__logout"
            >
              <LogOut size={15} strokeWidth={2} />
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </header>

          <div className="ir-dash__full-empty">
            <ClipboardList size={40} strokeWidth={1.5} className="ir-dash__full-empty-icon" />
            <h2 className="ir-dash__full-empty-title">No interviews yet</h2>
            <p className="ir-dash__full-empty-text">
              Take your first mock interview to start tracking your scores, progress, and feedback here.
            </p>
            <a href="/interview/new" className="ir-dash__cta">
              Start a mock interview
              <ArrowRight size={15} strokeWidth={2.25} />
            </a>
          </div>
        </div>
      </main>
    );
  }

  // ---- Real data, computed from actual completed interviews ----
  const trend = interviews
    .slice()
    .reverse() // history comes back newest-first; chart reads oldest-to-newest
    .map((i) => i.score);

  const bestScore = Math.max(...trend);
  const avgScore = average(trend);
  const improvement = trend[trend.length - 1] - trend[0];

  const latest = interviews[0]; // newest first
  const latestQuestions = latest.questions.filter((q) => q.score !== null);
  const latestCriteria = ["accuracy", "relevance", "communication", "completeness"].map((key) => ({
    label: key[0].toUpperCase() + key.slice(1),
    value: average(latestQuestions.map((q) => q[key])),
  }));

  const allAnsweredQuestions = interviews.flatMap((i) => i.questions.filter((q) => q.score !== null));
  const overallCriteria = ["accuracy", "relevance", "communication", "completeness"].map((key) => ({
    label: key[0].toUpperCase() + key.slice(1),
    value: average(allAnsweredQuestions.map((q) => q[key])),
  }));

  return (
    <main className="ir-dash">
      <div className="ir-dash__inner">
        <header className="ir-dash__header">
          <div>
            <h1 className="ir-dash__greeting">Welcome back{firstName}.</h1>
            <p className="ir-dash__subtext">
              Here's how your last {interviews.length} mock interview{interviews.length === 1 ? "" : "s"} ha
              {interviews.length === 1 ? "s" : "ve"} gone.
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
          <StatCard label="Interviews completed" value={interviews.length} />
          <StatCard
            label="Improvement trend"
            value={`${improvement >= 0 ? "+" : ""}${improvement}`}
            trend={interviews.length > 1}
          />
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Progress over time</h2>
            <span className="ir-dash__section-note">
              Last {trend.length} session{trend.length === 1 ? "" : "s"}
            </span>
          </div>
          {trend.length > 1 ? (
            <TrendChart data={trend} />
          ) : (
            <p className="ir-dash__empty-text" style={{ textAlign: "left", margin: 0 }}>
              Complete another interview to start seeing your progress trend.
            </p>
          )}
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Feedback breakdown</h2>
            <span className="ir-dash__section-note">Weighted by FR-13 criteria</span>
          </div>
          <div className="ir-criteria-compare">
            <div>
              <p className="ir-criteria-compare__group-label">
                Most recent — {TYPE_LABELS[latest.interviewType]}
              </p>
              <div className="ir-criteria">
                {latestCriteria.map((c) => (
                  <CriteriaBar key={c.label} {...c} />
                ))}
              </div>
            </div>
            <div>
              <p className="ir-criteria-compare__group-label">All-time average</p>
              <div className="ir-criteria">
                {overallCriteria.map((c) => (
                  <CriteriaBar key={c.label} {...c} muted />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ir-dash__section">
          <div className="ir-dash__section-head">
            <h2 className="ir-dash__section-title">Interview history</h2>
            <span className="ir-dash__section-note">{interviews.length} sessions</span>
          </div>

          <div className="ir-history__list">
            {interviews.map((item) => (
              <div key={item._id} className="ir-history__row">
                <div>
                  <p className="ir-history__type">{TYPE_LABELS[item.interviewType]}</p>
                  <p className="ir-history__meta">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="ir-history__badge">
                  {item.difficulty[0].toUpperCase() + item.difficulty.slice(1)}
                </span>
                <span className="ir-history__score">
                  {item.score}
                  <span className="ir-history__score-max">/100</span>
                </span>
              </div>
            ))}
          </div>
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

function CriteriaBar({ label, value, muted }) {
  return (
    <div className="ir-criteria__item">
      <div className="ir-criteria__head">
        <span className="ir-criteria__label">{label}</span>
        <span className={`ir-criteria__value ${muted ? "ir-criteria__value--muted" : ""}`}>
          {value}
        </span>
      </div>
      <div className="ir-criteria__track">
        <div
          className={`ir-criteria__fill ${muted ? "ir-criteria__fill--muted" : ""}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Signature element: a hand-built SVG line chart (no charting library) that
// plots real score-over-time from the user's actual completed interviews.
function TrendChart({ data }) {
  const width = 600;
  const height = 180;
  const padding = 24;
  const min = 0;
  const max = 100;

  const points = data.map((value, i) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (i / (data.length - 1)) * (width - padding * 2);
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
        {[25, 50, 75, 100].map((gridValue) => {
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