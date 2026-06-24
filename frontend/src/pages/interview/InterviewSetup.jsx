import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewSetup.css";

const TYPES = [
  { id: "hr", name: "HR Interview", detail: "Behavioral questions on teamwork, conflict, and fit." },
  { id: "technical", name: "Technical Interview", detail: "Questions on your skills, projects, and experience." },
  { id: "mixed", name: "Mixed Interview", detail: "A realistic blend of both, like most first-round loops." },
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [type, setType] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  const canStart = Boolean(type && difficulty);

  const handleStart = () => {
    if (!canStart) return;
    navigate("/interview/session", {
      state: { type, difficulty: difficulty.toLowerCase() },
    });
  };

  return (
    <main className="ir-setup">
      <div className="ir-setup__inner">
        <p className="ir-setup__eyebrow">New mock interview</p>
        <h1 className="ir-setup__title">What are you preparing for?</h1>
        <p className="ir-setup__subtext">
          Pick the interview type and difficulty. Questions are generated to match what you choose.
        </p>

        <div className="ir-setup__section">
          <p className="ir-setup__label">Interview type</p>
          <div className="ir-setup__grid">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`ir-setup__option ${type === t.id ? "ir-setup__option--selected" : ""}`}
              >
                <p className="ir-setup__option-name">{t.name}</p>
                <p className="ir-setup__option-detail">{t.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="ir-setup__section">
          <p className="ir-setup__label">Difficulty</p>
          <div className="ir-setup__pill-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`ir-setup__pill ${difficulty === d ? "ir-setup__pill--selected" : ""}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="ir-setup__actions">
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className="ir-setup__start"
          >
            Start interview
          </button>
          <a href="/dashboard" className="ir-setup__back">
            ← Back to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}