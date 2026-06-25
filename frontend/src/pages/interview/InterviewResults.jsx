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
  const interview = location.state?.interview;

  if (!interview) {
    navigate("/interview/new", { replace: true });
    return null;
  }

  const { interviewType, difficulty, score, feedback, questions, durationSeconds } = interview;
  const minutes = Math.floor((durationSeconds || 0) / 60);
  const secs = (durationSeconds || 0) % 60;

  return (
    <main className="ir-results">
      <div className="ir-results__inner">
        <p className="ir-results__eyebrow">Interview complete</p>
        <h1 className="ir-results__title">
          {TYPE_LABELS[interviewType]} — {difficulty[0].toUpperCase() + difficulty.slice(1)}
        </h1>

        <div className="ir-results__hero">
          <p className="ir-results__score">
            {score}
            <span className="ir-results__score-max">/100</span>
          </p>
          <p className="ir-results__meta-row">
            {questions.length} questions · {minutes}m {secs}s
          </p>
          {feedback && <p className="ir-results__summary">{feedback}</p>}
        </div>

        <h2 className="ir-results__section-title">Question-by-question feedback</h2>

        {questions.map((q, i) => (
          <div key={i} className="ir-results__question-card">
            <div className="ir-results__question-head">
              <p className="ir-results__question-text">
                {i + 1}. {q.question}
              </p>
              <span className="ir-results__question-score">{q.score}/100</span>
            </div>

            {q.followUp && (
              <p className="ir-results__answer-preview">
                <strong>Follow-up asked:</strong> {q.followUp}
              </p>
            )}

            <p className="ir-results__answer-preview">
              {q.answer.length > 180 ? q.answer.slice(0, 180) + "…" : q.answer}
            </p>

            <div className="ir-results__criteria-mini">
              <span className="ir-results__criteria-mini-item">
                Accuracy <span className="ir-results__criteria-mini-value">{q.accuracy}</span>
              </span>
              <span className="ir-results__criteria-mini-item">
                Relevance <span className="ir-results__criteria-mini-value">{q.relevance}</span>
              </span>
              <span className="ir-results__criteria-mini-item">
                Communication <span className="ir-results__criteria-mini-value">{q.communication}</span>
              </span>
              <span className="ir-results__criteria-mini-item">
                Completeness <span className="ir-results__criteria-mini-value">{q.completeness}</span>
              </span>
            </div>

            <div className="ir-results__feedback-block">
              {q.mistakes?.length > 0 && (
                <div>
                  <p className="ir-results__feedback-group-title ir-results__feedback-group-title--mistakes">
                    Mistakes
                  </p>
                  <ul className="ir-results__feedback-list">
                    {q.mistakes.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {q.improvements?.length > 0 && (
                <div>
                  <p className="ir-results__feedback-group-title ir-results__feedback-group-title--improvements">
                    Improvements
                  </p>
                  <ul className="ir-results__feedback-list">
                    {q.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {q.thingsToKeepInMind?.length > 0 && (
                <div>
                  <p className="ir-results__feedback-group-title ir-results__feedback-group-title--mind">
                    Things to keep in mind
                  </p>
                  <ul className="ir-results__feedback-list">
                    {q.thingsToKeepInMind.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
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