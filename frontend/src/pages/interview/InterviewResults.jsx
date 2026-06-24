import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./InterviewResults.css";

const TYPE_LABELS = {
  hr: "HR Interview",
  technical: "Technical Interview",
  mixed: "Mixed Interview",
};

export default function InterviewResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, difficulty, durationSeconds, results } = location.state || {};

  if (!results) {
    navigate("/interview/new", { replace: true });
    return null;
  }

  const overall = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );

  const avgCriteria = ["accuracy", "relevance", "communication", "completeness"].map(
    (key) => ({
      key,
      label: key[0].toUpperCase() + key.slice(1),
      value: Math.round(results.reduce((sum, r) => sum + r[key], 0) / results.length),
    })
  );

  const minutes = Math.floor((durationSeconds || 0) / 60);
  const secs = (durationSeconds || 0) % 60;

  return (
    <main className="ir-results">
      <div className="ir-results__inner">
        <p className="ir-results__eyebrow">Interview complete</p>
        <h1 className="ir-results__title">
          {TYPE_LABELS[type]} — {difficulty[0].toUpperCase() + difficulty.slice(1)}
        </h1>

        <div className="ir-results__hero">
          <p className="ir-results__score">
            {overall}
            <span className="ir-results__score-max">/100</span>
          </p>
          <p className="ir-results__meta-row">
            {results.length} questions · {minutes}m {secs}s
          </p>

          <div className="ir-results__criteria">
            {avgCriteria.map((c) => (
              <div key={c.key} className="ir-results__criteria-item">
                <div className="ir-results__criteria-head">
                  <span className="ir-results__criteria-label">{c.label}</span>
                  <span className="ir-results__criteria-value">{c.value}</span>
                </div>
                <div className="ir-results__track">
                  <div className="ir-results__fill" style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="ir-results__section-title">Question-by-question feedback</h2>

        {results.map((r, i) => (
          <div key={i} className="ir-results__question-card">
            <div className="ir-results__question-head">
              <p className="ir-results__question-text">
                {i + 1}. {r.question}
              </p>
              <span className="ir-results__question-score">{r.score}/100</span>
            </div>
            <p className="ir-results__answer-preview">
              {r.answer.length > 160 ? r.answer.slice(0, 160) + "…" : r.answer}
            </p>
            <div className="ir-results__feedback-row">
              <p className="ir-results__feedback-line">
                <span className="ir-results__feedback-label">Strength: </span>
                {r.strength}
              </p>
              <p className="ir-results__feedback-line">
                <span className="ir-results__feedback-label">Suggestion: </span>
                {r.suggestion}
              </p>
            </div>
          </div>
        ))}

        <div className="ir-results__actions">
          <a href="/interview/new" className="ir-results__cta">
            Start another interview
            <ArrowRight size={15} strokeWidth={2.25} />
          </a>
          <a href="/dashboard" className="ir-results__cta ir-results__cta--ghost">
            Back to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}