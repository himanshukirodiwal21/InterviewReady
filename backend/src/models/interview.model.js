import mongoose, { Schema } from "mongoose";

// One sub-document per question asked in the session.
const questionResultSchema = new Schema(
    {
        question: { type: String, required: true },
        followUp: { type: String, default: null },
        answer: { type: String, default: "" },
        // Per-criterion scores, FR-12/FR-13. Null until the answer is evaluated.
        accuracy: { type: Number, default: null },
        relevance: { type: Number, default: null },
        communication: { type: Number, default: null },
        completeness: { type: Number, default: null },
        score: { type: Number, default: null }, // weighted total for this question
        // FR-14
        mistakes: { type: [String], default: [] },
        improvements: { type: [String], default: [] },
        thingsToKeepInMind: { type: [String], default: [] },
    },
    { _id: false }
);

const interviewSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        interviewType: {
            type: String,
            enum: ["hr", "technical", "mixed"],
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            required: true,
        },
        jobRole: {
            type: String,
            trim: true,
            default: "",
        },
        topic: {
            type: String,
            trim: true,
            default: "",
        },
        // Snapshot of resume context used to generate this session's questions,
        // kept here so a later resume re-upload doesn't change past results.
        resumeSnapshot: {
            skills: { type: [String], default: [] },
            experienceLevel: { type: String, default: "" },
        },
        questions: {
            type: [questionResultSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["in_progress", "completed"],
            default: "in_progress",
        },
        score: {
            type: Number, // overall weighted average, filled in once completed
            default: null,
        },
        feedback: {
            type: String, // short overall summary, filled in once completed
            default: "",
        },
        durationSeconds: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export const Interview = mongoose.model("Interview", interviewSchema);