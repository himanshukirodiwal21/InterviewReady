import { useState, useEffect } from "react";
import {
  ArrowRight,
  FileText,
  Sparkles,
  MessageSquareText,
  LineChart,
  CheckCircle2,
} from "lucide-react";
import "./Home.css";

const STEPS = [
  {
    icon: FileText,
    title: "Upload your resume",
    body: "We read your skills, projects, and experience level straight from the PDF — no manual form-filling.",
  },
  {
    icon: Sparkles,
    title: "Pick an interview type",
    body: "HR, technical, or mixed — at beginner, intermediate, or advanced difficulty.",
  },
  {
    icon: MessageSquareText,
    title: "Answer in real time",
    body: "Questions are generated from your resume, with AI follow-ups when an answer needs more depth.",
  },
  {
    icon: LineChart,
    title: "Get scored like a real panel",
    body: "Every answer is weighted across accuracy, relevance, communication, and completeness.",
  },
];

const INTERVIEW_TYPES = [
  {
    name: "HR Interview",
    detail: "Behavioral questions on teamwork, conflict, motivation, and fit.",
  },
  {
    name: "Technical Interview",
    detail: "Questions pulled from the skills and projects on your resume.",
  },
  {
    name: "Mixed Interview",
    detail: "A realistic blend of both, the way most first-round loops run.",
  },
];

const SCORE_WEIGHTS = [
  { label: "Accuracy", weight: 40 },
  { label: "Relevance", weight: 25 },
  { label: "Communication", weight: 20 },
  { label: "Completeness", weight: 15 },
];

export default function Home() {
  return (
    <main className="ir-home">
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <InterviewTypes />
      <ScoringSection />
      <FinalCta />
    </main>
  );
}

/* ---------------------------- Hero ---------------------------- */

function Hero() {
  return (
    <section className="ir-hero">
      <div className="ir-hero__grid">
        <div>
          <div className="ir-hero__eyebrow">
            <span className="ir-hero__eyebrow-dot" aria-hidden="true" />
            <span className="ir-hero__eyebrow-text">
              Built from your actual resume
            </span>
          </div>

          <h1 className="ir-hero__title">
            Walk into the real
            <br />
            interview <span className="ir-hero__title-accent">already prepared.</span>
          </h1>

          <p className="ir-hero__body">
            InterviewReady turns your resume into a realistic mock interview —
            AI questions, AI follow-ups, and a scorecard that tells you exactly
            what to fix before the interview that counts.
          </p>

          <div className="ir-hero__actions">
            <a href="/interview/new" className="ir-hero__cta">
              Start a mock interview
              <ArrowRight size={16} strokeWidth={2.25} className="ir-hero__cta-icon" />
            </a>
            <a href="#how-it-works" className="ir-hero__secondary-link">
              See how it works
            </a>
          </div>
        </div>

        <TranscriptPanel />
      </div>
    </section>
  );
}

/* Signature element: an animated "live" interview transcript that plays
   question -> typed answer -> AI score on a loop. */
function TranscriptPanel() {
  const phases = ["question", "answering", "scored"];
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = phases[phaseIndex];

  useEffect(() => {
    const durations = { question: 1400, answering: 2200, scored: 2600 };
    const t = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % phases.length);
    }, durations[phase]);
    return () => clearTimeout(t);
  }, [phase]);

  const answer =
    "I led the migration by splitting it into three phases, starting with the lowest-risk services so we could validate the rollback plan early.";

  return (
    <div className="ir-transcript">
      <div className="ir-transcript__head">
        <div className="ir-transcript__head-left">
          <span className="ir-transcript__rec-dot" aria-hidden="true" />
          <span className="ir-transcript__label">
            Technical Interview · Intermediate
          </span>
        </div>
        <span className="ir-transcript__timer">04:12</span>
      </div>

      <div className="ir-transcript__question-block">
        <p className="ir-transcript__question-tag">Question 3 of 8</p>
        <p className="ir-transcript__question-text">
          Tell me about a time you had to migrate a critical system with
          minimal downtime.
        </p>
      </div>

      <div className="ir-transcript__answer-box">
        {phase === "question" && (
          <p className="ir-transcript__answer-placeholder">
            Waiting for your answer…
          </p>
        )}
        {phase === "answering" && (
          <p className="ir-transcript__answer-text">
            {answer}
            <span className="ir-transcript__caret" aria-hidden="true" />
          </p>
        )}
        {phase === "scored" && (
          <p className="ir-transcript__answer-text">{answer}</p>
        )}
      </div>

      <div
        className={`ir-transcript__scores ${
          phase === "scored" ? "ir-transcript__scores--visible" : ""
        }`}
      >
        {SCORE_WEIGHTS.map((s) => (
          <div key={s.label} className="ir-transcript__score-card">
            <p className="ir-transcript__score-label">{s.label}</p>
            <p className="ir-transcript__score-value">
              {phase === "scored" ? `${78 + (s.weight % 9)}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Trust strip ------------------------- */

function TrustStrip() {
  const stats = [
    ["12,400+", "mock interviews scored"],
    ["4.7 / 5", "avg. candidate rating"],
    ["3 types", "HR, technical, mixed"],
    ["< 3s", "AI response time"],
  ];
  return (
    <section className="ir-trust">
      <div className="ir-trust__grid">
        {stats.map(([value, label]) => (
          <div key={label}>
            <p className="ir-trust__value">{value}</p>
            <p className="ir-trust__label">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------- How it works ------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="ir-section">
      <div className="ir-section__inner">
        <p className="ir-section__eyebrow">The process</p>
        <h2 className="ir-section__heading">
          From resume to scorecard in four steps.
        </h2>

        <div className="ir-steps">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title}>
                <div className="ir-step__head">
                  <span className="ir-step__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.8} color="#2D5A4A" />
                  </span>
                  <span className="ir-step__number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="ir-step__title">{step.title}</h3>
                <p className="ir-step__body">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Interview types ------------------------- */

function InterviewTypes() {
  return (
    <section id="interview-types" className="ir-section ir-section--white">
      <div className="ir-section__inner">
        <p className="ir-section__eyebrow">Interview types</p>
        <h2 className="ir-section__heading">
          Practice the interview you'll actually get.
        </h2>

        <div className="ir-types">
          {INTERVIEW_TYPES.map((type) => (
            <div key={type.name} className="ir-type-card">
              <h3 className="ir-type-card__name">{type.name}</h3>
              <p className="ir-type-card__detail">{type.detail}</p>
              <div className="ir-type-card__levels">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <span key={level} className="ir-type-card__level">
                    {level}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Scoring section ------------------------- */

function ScoringSection() {
  return (
    <section id="evaluation" className="ir-section">
      <div className="ir-scoring__grid">
        <div>
          <p className="ir-section__eyebrow">AI evaluation</p>
          <h2 className="ir-section__heading">
            Scored the way a real panel would weigh it.
          </h2>
          <p className="ir-scoring__text-body">
            Every answer is broken down into four weighted criteria, so your
            feedback points at exactly what to improve before the real thing —
            not just a single vague number.
          </p>

          <ul className="ir-scoring__list">
            {[
              "Strengths and weaknesses per answer",
              "Specific, actionable suggestions",
              "A full history of every session you run",
            ].map((item) => (
              <li key={item} className="ir-scoring__list-item">
                <CheckCircle2
                  size={18}
                  strokeWidth={1.8}
                  className="ir-scoring__check-icon"
                />
                <span className="ir-scoring__list-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ir-scorecard">
          <p className="ir-scorecard__label">Overall score</p>
          <p className="ir-scorecard__total">
            84<span className="ir-scorecard__total-max">/100</span>
          </p>

          <div className="ir-scorecard__bars">
            {SCORE_WEIGHTS.map((s) => (
              <div key={s.label}>
                <div className="ir-scorecard__bar-head">
                  <span className="ir-scorecard__bar-label">{s.label}</span>
                  <span className="ir-scorecard__bar-weight">
                    weight {s.weight}%
                  </span>
                </div>
                <div className="ir-scorecard__track">
                  <div
                    className="ir-scorecard__fill"
                    style={{ width: `${60 + s.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Final CTA ------------------------- */

function FinalCta() {
  return (
    <section className="ir-final-cta">
      <div className="ir-final-cta__inner">
        <h2 className="ir-final-cta__heading">
          Your next interview is coming.
          <br />
          Make sure you're ready for it.
        </h2>
        <a href="/interview/new" className="ir-final-cta__button">
          Start your first mock interview, free
          <ArrowRight
            size={16}
            strokeWidth={2.25}
            className="ir-final-cta__button-icon"
          />
        </a>
      </div>
    </section>
  );
}