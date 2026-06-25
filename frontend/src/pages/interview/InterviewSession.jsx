import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Sparkles } from "lucide-react";
import api from "../../services/api";
import "./InterviewSession.css";

const TYPE_LABELS = {
  hr: "HR Interview",
  technical: "Technical Interview",
  mixed: "Mixed Interview",
};

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // The interview document came back from /interviews/start, passed via
  // navigation state from InterviewSetup.
  const interview = location.state?.interview;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [followUp, setFollowUp] = useState(null);
  const [phase, setPhase] = useState("answering"); // answering | thinking | answered
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!interview) {
      navigate("/interview/new", { replace: true });
      return;
    }
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [interview, navigate]);

  if (!interview) return null;

  const questions = interview.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setPhase("thinking");

    try {
      // One Gemini call does evaluation + mistakes/improvements + an
      // optional follow-up suggestion, all in a single round-trip.
      const res = await api.post("/api/v1/interviews/answer", {
        interviewId: interview._id,
        questionIndex: currentIndex,
        answer,
      });

      if (res.data.data.followUp) {
        setFollowUp(res.data.data.followUp);
      }

      if (isLastQuestion) {
        clearInterval(timerRef.current);
        const finalizeRes = await api.post("/api/v1/interviews/finalize", {
          interviewId: interview._id,
          durationSeconds: seconds,
        });
        navigate("/interview/results", {
          state: { interview: finalizeRes.data.data },
        });
        return;
      }

      // Briefly show the follow-up (if any) as a "here's what a real
      // interviewer might have asked next" note before moving on — purely
      // informational now, doesn't gate or require a second answer.
      setPhase("answered");
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnswer("");
        setFollowUp(null);
        setPhase("answering");
      }, res.data.data.followUp ? 2600 : 200);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Something went wrong evaluating your answer.");
      setPhase("answering");
    }
  };

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

  return (
    <main className="ir-session">
      <div className="ir-session__inner">
        <div className="ir-session__topbar">
          <span className="ir-session__meta">
            {TYPE_LABELS[interview.interviewType]} ·{" "}
            {interview.difficulty[0].toUpperCase() + interview.difficulty.slice(1)}
          </span>
          <span className="ir-session__timer">
            <Clock size={14} strokeWidth={2} />
            {formattedTime}
          </span>
        </div>

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
          <p className="ir-session__question">{currentQuestion.question}</p>

          {followUp && phase === "answered" && (
            <div className="ir-session__followup">
              <Sparkles size={16} strokeWidth={2} className="ir-session__followup-icon" />
              <p className="ir-session__followup-text">
                A real interviewer might also have asked: "{followUp}"
              </p>
            </div>
          )}

          <div className="ir-session__answer-area">
            <textarea
              className="ir-session__textarea"
              placeholder="Type your answer here…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={phase !== "answering"}
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
          ) : phase === "answered" ? (
            <div className="ir-session__thinking">Saved. Moving to the next question…</div>
          ) : (
            <div className="ir-session__actions">
              <button
                type="button"
                className="ir-session__submit"
                onClick={handleSubmit}
                disabled={!answer.trim()}
              >
                {isLastQuestion ? "Submit & finish" : "Submit answer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}