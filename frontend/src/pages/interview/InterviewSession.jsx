import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Sparkles } from "lucide-react";
import {
  generateQuestions,
  maybeGenerateFollowUp,
  evaluateAnswer,
  feedbackFor,
} from "../../data/interviewSimulator";
import "./InterviewSession.css";

const TYPE_LABELS = {
  hr: "HR Interview",
  technical: "Technical Interview",
  mixed: "Mixed Interview",
};

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // If someone lands here directly without picking type/difficulty
  // (e.g. refreshed the page), send them back to set it up properly.
  const { type, difficulty } = location.state || {};

  const [questions, setQuestions] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [followUp, setFollowUp] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | answering | thinking | done
  const [results, setResults] = useState([]); // collected per-question evaluations
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!type || !difficulty) {
      navigate("/interview/new", { replace: true });
      return;
    }
    generateQuestions(type, difficulty).then((qs) => {
      setQuestions(qs);
      setPhase("answering");
    });
  }, [type, difficulty, navigate]);

  // Session timer — starts once questions are ready, runs for the whole session.
  useEffect(() => {
    if (phase === "loading") return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  if (!type || !difficulty) return null;

  const currentQuestion = questions?.[currentIndex];
  const isLastQuestion = questions && currentIndex === questions.length - 1;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setPhase("thinking");

    // FR-11: AI may ask a follow-up before moving on, but only once per question.
    if (!followUp) {
      const fu = await maybeGenerateFollowUp(answer);
      if (fu) {
        setFollowUp(fu);
        setPhase("answering");
        return;
      }
    }

    // FR-12/FR-13: evaluate the (possibly follow-up-extended) answer.
    const evaluation = await evaluateAnswer(answer);
    const feedback = feedbackFor(evaluation);

    setResults((prev) => [
      ...prev,
      {
        question: currentQuestion.text,
        answer,
        followUp,
        ...evaluation,
        ...feedback,
      },
    ]);

    if (isLastQuestion) {
      clearInterval(timerRef.current);
      navigate("/interview/results", {
        state: {
          type,
          difficulty,
          durationSeconds: seconds,
          results: [
            ...results,
            { question: currentQuestion.text, answer, followUp, ...evaluation, ...feedback },
          ],
        },
      });
      return;
    }

    setCurrentIndex((i) => i + 1);
    setAnswer("");
    setFollowUp(null);
    setPhase("answering");
  };

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <main className="ir-session">
      <div className="ir-session__inner">
        <div className="ir-session__topbar">
          <span className="ir-session__meta">
            {TYPE_LABELS[type]} · {difficulty[0].toUpperCase() + difficulty.slice(1)}
          </span>
          <span className="ir-session__timer">
            <Clock size={14} strokeWidth={2} />
            {formattedTime}
          </span>
        </div>

        {phase === "loading" || !questions ? (
          <LoadingCard />
        ) : (
          <>
            <div className="ir-session__progress">
              <div
                className="ir-session__progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="ir-session__card">
              <p className="ir-session__tag">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <p className="ir-session__question">{currentQuestion.text}</p>

              {followUp && (
                <div className="ir-session__followup">
                  <Sparkles size={16} strokeWidth={2} className="ir-session__followup-icon" />
                  <p className="ir-session__followup-text">{followUp}</p>
                </div>
              )}

              <div className="ir-session__answer-area">
                <textarea
                  className="ir-session__textarea"
                  placeholder="Type your answer here…"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={phase === "thinking"}
                />
                <p className="ir-session__char-count">{answer.length} characters</p>
              </div>

              {phase === "thinking" ? (
                <div className="ir-session__thinking">
                  <span className="ir-session__thinking-dot" />
                  <span className="ir-session__thinking-dot" />
                  <span className="ir-session__thinking-dot" />
                  Evaluating your answer…
                </div>
              ) : (
                <div className="ir-session__actions">
                  <button
                    type="button"
                    className="ir-session__submit"
                    onClick={handleSubmit}
                    disabled={!answer.trim()}
                  >
                    {isLastQuestion && followUp === null ? "Submit & finish" : "Submit answer"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function LoadingCard() {
  return (
    <div className="ir-session__card">
      <div className="ir-session__thinking">
        <span className="ir-session__thinking-dot" />
        <span className="ir-session__thinking-dot" />
        <span className="ir-session__thinking-dot" />
        Generating your interview questions…
      </div>
    </div>
  );
}