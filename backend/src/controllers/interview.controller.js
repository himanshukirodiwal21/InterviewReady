import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { askAI, askAIForJSON } from "../utils/ai.js";
import { Interview } from "../models/interview.model.js";
import { Resume } from "../models/resume.model.js";

const WEIGHTS = { accuracy: 0.4, relevance: 0.25, communication: 0.2, completeness: 0.15 };

function weightedScore(evaluation) {
    return Math.round(
        evaluation.accuracy * WEIGHTS.accuracy +
        evaluation.relevance * WEIGHTS.relevance +
        evaluation.communication * WEIGHTS.communication +
        evaluation.completeness * WEIGHTS.completeness
    );
}

// FR-6/FR-7/FR-8/FR-9: Start a session. Generates questions from the user's
// resume (if any) + job role + topic + type + difficulty, creates the
// in-progress Interview document immediately (progressive save starts here).
const startInterview = asyncHandler(async (req, res) => {
    const { interviewType, difficulty, jobRole, topic } = req.body;

    if (!interviewType || !difficulty) {
        throw new ApiError(400, "Interview type and difficulty are required");
    }

    const resume = await Resume.findOne({ user: req.user._id });

    const prompt = `
You are an experienced technical and behavioral interviewer creating mock
interview questions for a candidate.

Interview type: ${interviewType}
Difficulty: ${difficulty}
Job role the candidate is preparing for: ${jobRole || "Not specified"}
Topic focus requested by candidate: ${topic || "Not specified"}
${resume ? `
Candidate's resume summary:
- Skills: ${resume.skills.join(", ") || "none listed"}
- Technologies: ${resume.technologies.join(", ") || "none listed"}
- Projects: ${resume.projects.join("; ") || "none listed"}
- Experience level: ${resume.experienceLevel}
` : "No resume on file — ask general questions appropriate for the role and difficulty."}

Generate exactly 5 interview questions tailored to the above. If type is
"technical" or "mixed", base technical questions on the candidate's actual
skills/projects where possible rather than generic trivia. If type is "hr",
focus on behavioral and situational questions appropriate for the job role.

Return ONLY a JSON object with this exact shape, no other text:
{ "questions": ["question 1", "question 2", "question 3", "question 4", "question 5"] }
`.trim();

    const { questions } = await askAIForJSON(prompt);

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(500, "Failed to generate interview questions");
    }

    const interview = await Interview.create({
        userId: req.user._id,
        interviewType,
        difficulty,
        jobRole: jobRole || "",
        topic: topic || "",
        resumeSnapshot: resume
            ? { skills: resume.skills, experienceLevel: resume.experienceLevel }
            : { skills: [], experienceLevel: "" },
        questions: questions.map((q) => ({ question: q })),
        status: "in_progress",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, interview, "Interview session started"));
});

// FR-11/FR-12/FR-13/FR-14: ONE Gemini call per answer that does everything —
// scores the answer on all four criteria, identifies mistakes/improvements/
// things to keep in mind, AND decides whether a follow-up question would
// have added value (returned as informational context, not a second
// required round-trip). This replaces what used to be two separate calls
// (a /follow-up check, then /answer evaluation) to stay well under the
// Gemini free-tier daily request quota.
const submitAnswer = asyncHandler(async (req, res) => {
    const { interviewId, questionIndex, answer } = req.body;

    if (!interviewId || questionIndex === undefined || !answer?.trim()) {
        throw new ApiError(400, "interviewId, questionIndex, and answer are required");
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) throw new ApiError(404, "Interview session not found");

    const questionEntry = interview.questions[questionIndex];
    if (!questionEntry) throw new ApiError(400, "Invalid question index");

    const prompt = `
You are evaluating a candidate's interview answer in one pass.

Question: "${questionEntry.question}"
Candidate's answer: "${answer}"

1. Score the answer from 0-100 on each of these four criteria:
   - accuracy: technical/factual correctness of what they said
   - relevance: how directly the answer addresses what was actually asked
   - communication: clarity, structure, and how well they explained their thinking
   - completeness: whether the answer covers the situation/approach and a concrete outcome

2. Identify, specifically for THIS answer:
   - mistakes: concrete things that were wrong, missing, or poorly handled (0-3 items)
   - improvements: specific, actionable changes that would raise the score (1-3 items)
   - thingsToKeepInMind: general advice relevant to this kind of question for next time (1-2 items)

3. Decide if a real interviewer would have asked a brief follow-up here
   (e.g. the answer was vague, too short, or skipped something important).
   Most answers do NOT warrant one — only flag this when it would genuinely
   have added value.

Return ONLY a JSON object with this exact shape, no other text:
{
  "accuracy": number,
  "relevance": number,
  "communication": number,
  "completeness": number,
  "mistakes": ["..."],
  "improvements": ["..."],
  "thingsToKeepInMind": ["..."],
  "suggestedFollowUp": "the follow-up text, or empty string if none is warranted"
}
`.trim();

    const evaluation = await askAIForJSON(prompt);
    const score = weightedScore(evaluation);

    questionEntry.answer = answer;
    questionEntry.accuracy = evaluation.accuracy;
    questionEntry.relevance = evaluation.relevance;
    questionEntry.communication = evaluation.communication;
    questionEntry.completeness = evaluation.completeness;
    questionEntry.score = score;
    questionEntry.mistakes = evaluation.mistakes || [];
    questionEntry.improvements = evaluation.improvements || [];
    questionEntry.thingsToKeepInMind = evaluation.thingsToKeepInMind || [];
    questionEntry.followUp = evaluation.suggestedFollowUp || null;

    await interview.save(); // progressive save — happens after every single answer

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    ...evaluation,
                    score,
                    followUp: evaluation.suggestedFollowUp || null,
                },
                "Answer evaluated"
            )
        );
});

// Marks the session complete, computes the overall score, and writes a
// short Gemini-generated summary (FR-15's "feedback" field).
const finalizeInterview = asyncHandler(async (req, res) => {
    const { interviewId, durationSeconds } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) throw new ApiError(404, "Interview session not found");

    const answered = interview.questions.filter((q) => q.score !== null);
    if (answered.length === 0) {
        throw new ApiError(400, "Cannot finalize an interview with no answered questions");
    }

    const overallScore = Math.round(
        answered.reduce((sum, q) => sum + q.score, 0) / answered.length
    );

    const summaryPrompt = `
A candidate just completed a ${interview.interviewType} mock interview at
${interview.difficulty} difficulty. Their overall score was ${overallScore}/100
across ${answered.length} questions.

Per-question scores: ${answered.map((q) => q.score).join(", ")}

Write a short (2-3 sentence), encouraging but honest overall summary of their
performance, written directly to the candidate ("You..."). Return ONLY the
summary text, no JSON, no quotes around it.
`.trim();

    let feedback = "";
    try {
        feedback = (await askAI(summaryPrompt)).trim();
    } catch {
        feedback = `You scored ${overallScore}/100 across ${answered.length} questions.`;
    }

    interview.status = "completed";
    interview.score = overallScore;
    interview.feedback = feedback;
    interview.durationSeconds = durationSeconds || 0;
    await interview.save();

    return res
        .status(200)
        .json(new ApiResponse(200, interview, "Interview completed"));
});

// FR-16/FR-17: history + progress tracking for the dashboard.
const getMyInterviews = asyncHandler(async (req, res) => {
    const interviews = await Interview.find({
        userId: req.user._id,
        status: "completed",
    }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, interviews, "Interview history fetched"));
});

const getInterviewById = asyncHandler(async (req, res) => {
    const interview = await Interview.findOne({
        _id: req.params.id,
        userId: req.user._id,
    });

    if (!interview) throw new ApiError(404, "Interview not found");

    return res.status(200).json(new ApiResponse(200, interview, "Interview fetched"));
});

export {
    startInterview,
    submitAnswer,
    finalizeInterview,
    getMyInterviews,
    getInterviewById,
};