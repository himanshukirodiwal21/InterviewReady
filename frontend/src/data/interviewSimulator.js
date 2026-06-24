// src/data/interviewSimulator.js
//
// Stands in for the real Gemini-powered backend (FR-8, FR-11, FR-12, FR-13,
// FR-14) until those endpoints exist. Every function here is written to
// have the same shape a real API call would have (async, returns a
// plain object) so swapping in `api.post(...)` later is a drop-in change —
// the three interview pages don't need to know the difference.

const QUESTION_BANK = {
  hr: {
    beginner: [
      "Tell me about yourself and why you're interested in this role.",
      "Describe a time you worked as part of a team.",
      "What are your biggest strengths?",
    ],
    intermediate: [
      "Tell me about a time you disagreed with a teammate. How did you handle it?",
      "Describe a situation where you had to meet a tight deadline.",
      "What's a piece of feedback you received that changed how you work?",
    ],
    advanced: [
      "Tell me about a time you had to make an unpopular decision. How did you handle the pushback?",
      "Describe how you've mentored or led someone less experienced than you.",
      "What's the hardest interpersonal conflict you've navigated at work?",
    ],
  },
  technical: {
    beginner: [
      "What's the difference between let, const, and var in JavaScript?",
      "Explain what a REST API is in your own words.",
      "What is the difference between SQL and NoSQL databases?",
    ],
    intermediate: [
      "Tell me about a time you had to migrate a critical system with minimal downtime.",
      "How would you debug a memory leak in a Node.js application?",
      "Explain the difference between synchronous and asynchronous code, with an example.",
    ],
    advanced: [
      "How would you design a rate limiter for a public API?",
      "Walk me through how you'd architect a system to handle 10,000 concurrent users.",
      "Explain how you'd approach optimizing a slow database query in production.",
    ],
  },
  mixed: {
    beginner: [
      "Tell me about yourself and your technical background.",
      "What's the difference between let, const, and var in JavaScript?",
      "Describe a time you worked as part of a team.",
    ],
    intermediate: [
      "Tell me about a time you had to migrate a critical system with minimal downtime.",
      "Tell me about a time you disagreed with a teammate. How did you handle it?",
      "How would you debug a memory leak in a Node.js application?",
    ],
    advanced: [
      "How would you design a rate limiter for a public API?",
      "Tell me about a time you had to make an unpopular decision. How did you handle the pushback?",
      "Explain how you'd approach optimizing a slow database query in production.",
    ],
  },
};

const FOLLOW_UPS = [
  "Can you go a little deeper on what made that approach work?",
  "What would you have done differently in hindsight?",
  "How did you measure whether that was successful?",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// FR-8: Generate interview questions based on type + difficulty.
// Real version: POST /api/v1/interviews/generate { type, difficulty, resumeId }
export async function generateQuestions(type, difficulty) {
  await delay(900); // simulates AI generation latency
  const pool = QUESTION_BANK[type]?.[difficulty] ?? QUESTION_BANK.mixed.beginner;
  return pool.map((text, i) => ({ id: `${type}-${difficulty}-${i}`, text }));
}

// FR-11: AI may generate a follow-up question based on the answer given.
// Real version: POST /api/v1/interviews/:id/follow-up { answer }
export async function maybeGenerateFollowUp(answerText) {
  await delay(600);
  // Simple stand-in heuristic: short answers are more likely to get a
  // follow-up prompting more depth, the way a real interviewer would.
  const shouldFollowUp = answerText.trim().length < 220 && Math.random() < 0.5;
  if (!shouldFollowUp) return null;
  return FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)];
}

// FR-12/FR-13: Evaluate one answer across the four weighted criteria.
// Real version: POST /api/v1/interviews/:id/evaluate { question, answer }
export async function evaluateAnswer(answerText) {
  await delay(1100); // simulates AI evaluation latency
  const length = answerText.trim().length;

  // Longer, more developed answers score a bit higher in this simulation —
  // a rough stand-in for what a real LLM evaluation would actually judge.
  const base = Math.min(95, 55 + Math.floor(length / 6));
  const jitter = () => Math.floor(Math.random() * 10) - 5;

  const accuracy = clamp(base + jitter());
  const relevance = clamp(base + jitter());
  const communication = clamp(base + jitter());
  const completeness = clamp(base + jitter());

  const weighted = Math.round(
    accuracy * 0.4 + relevance * 0.25 + communication * 0.2 + completeness * 0.15
  );

  return {
    accuracy,
    relevance,
    communication,
    completeness,
    score: weighted,
  };
}

function clamp(n, min = 35, max = 98) {
  return Math.max(min, Math.min(max, n));
}

// FR-14: Strengths / weaknesses / suggestions for a single answer.
export function feedbackFor(evaluation) {
  const lowest = Object.entries({
    Accuracy: evaluation.accuracy,
    Relevance: evaluation.relevance,
    Communication: evaluation.communication,
    Completeness: evaluation.completeness,
  }).sort((a, b) => a[1] - b[1])[0][0];

  const strengthMap = {
    Accuracy: "Your answer was technically sound and well-grounded.",
    Relevance: "You stayed focused on what the question actually asked.",
    Communication: "You explained your reasoning clearly and in a logical order.",
    Completeness: "You covered the situation, action, and outcome thoroughly.",
  };

  const improveMap = {
    Accuracy: "Double-check technical specifics before stating them with confidence.",
    Relevance: "Tie your answer back to the question more directly before adding extra detail.",
    Communication: "Try structuring your answer with a clear beginning, middle, and end.",
    Completeness: "Add a concrete outcome or result to round out the answer.",
  };

  return {
    strength: strengthMap[lowest === "Accuracy" ? "Communication" : "Accuracy"],
    suggestion: improveMap[lowest],
  };
}