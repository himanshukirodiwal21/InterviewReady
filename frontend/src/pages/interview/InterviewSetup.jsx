import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle2, Upload } from "lucide-react";
import api from "../../services/api";
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
  const [jobRole, setJobRole] = useState("");
  const [topic, setTopic] = useState("");

  const [resume, setResume] = useState(undefined); // undefined = still checking, null = none
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api
      .get("/api/v1/resume/me")
      .then((res) => setResume(res.data.data))
      .catch(() => setResume(null));
  }, []);

  const canStart = Boolean(type && difficulty && resume && !starting);

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await api.post("/api/v1/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(res.data.data);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Resume upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async () => {
    if (!canStart) return;
    setStarting(true);
    try {
      const res = await api.post("/api/v1/interviews/start", {
        interviewType: type,
        difficulty: difficulty.toLowerCase(),
        jobRole,
        topic,
      });
      navigate("/interview/session", {
        state: { interview: res.data.data },
      });
    } catch (err) {
      setUploadError(err.response?.data?.message || "Could not start the interview");
      setStarting(false);
    }
  };

  return (
    <main className="ir-setup">
      <div className="ir-setup__inner">
        <p className="ir-setup__eyebrow">New mock interview</p>
        <h1 className="ir-setup__title">What are you preparing for?</h1>
        <p className="ir-setup__subtext">
          Questions are generated from your resume, job role, and topic — pick what fits below.
        </p>

        <div className="ir-setup__section">
          <p className="ir-setup__label">Resume</p>

          {resume === undefined && (
            <div className="ir-setup__resume-card">
              <p className="ir-setup__resume-text">Checking for an existing resume…</p>
            </div>
          )}

          {resume === null && (
            <div className="ir-setup__resume-card">
              <FileText size={26} strokeWidth={1.6} className="ir-setup__resume-icon" />
              <p className="ir-setup__resume-text">
                Upload your resume (PDF) so questions can be tailored to your real skills and projects.
              </p>
              <label className="ir-setup__resume-button">
                <Upload size={15} strokeWidth={2.25} />
                {uploading ? "Uploading…" : "Upload resume"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="ir-setup__resume-input"
                  onChange={handleResumeChange}
                  disabled={uploading}
                />
              </label>
              {uploadError && <p className="ir-setup__resume-error">{uploadError}</p>}
            </div>
          )}

          {resume && (
            <div className="ir-setup__resume-card ir-setup__resume-card--has-resume">
              <div className="ir-setup__resume-info">
                <CheckCircle2 size={20} strokeWidth={1.8} className="ir-setup__resume-info-icon" />
                <div>
                  <p className="ir-setup__resume-name">Resume on file</p>
                  <p className="ir-setup__resume-meta">
                    {resume.experienceLevel} · {resume.skills?.slice(0, 3).join(", ") || "skills detected"}
                  </p>
                </div>
              </div>
              <label className="ir-setup__resume-button ir-setup__resume-button--ghost">
                <Upload size={14} strokeWidth={2.25} />
                {uploading ? "Uploading…" : "Replace"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="ir-setup__resume-input"
                  onChange={handleResumeChange}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>

        <div className="ir-setup__section">
          <p className="ir-setup__label">Job role & topic (optional, but helps)</p>
          <div className="ir-setup__input-row">
            <input
              type="text"
              className="ir-setup__input"
              placeholder="e.g. Backend Developer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
            <input
              type="text"
              className="ir-setup__input"
              placeholder="e.g. System Design, React, SQL"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>

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
            {starting ? "Starting…" : "Start interview"}
          </button>
          <a href="/dashboard" className="ir-setup__back">
            ← Back to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}