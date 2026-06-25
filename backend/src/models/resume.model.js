import mongoose, { Schema } from "mongoose";

// One document per user. Re-uploading replaces this document's fields
// rather than creating a new one — see resume.controller.js's use of
// findOneAndUpdate with upsert: true.
const resumeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        resumeUrl: {
            type: String, // Cloudinary URL — where the original PDF is stored
            required: true,
        },
        rawText: {
            type: String, // full extracted text, used as Gemini context later
            required: true,
        },
        skills: {
            type: [String],
            default: [],
        },
        projects: {
            type: [String],
            default: [],
        },
        technologies: {
            type: [String],
            default: [],
        },
        experienceLevel: {
            type: String,
            enum: ["Fresher", "Junior", "Mid", "Senior", "Lead"],
            default: "Fresher",
        },
    },
    {
        timestamps: true,
    }
);

export const Resume = mongoose.model("Resume", resumeSchema);