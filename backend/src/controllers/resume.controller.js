import fs from "fs";
import { PDFParse } from "pdf-parse";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { askGeminiForJSON } from "../utils/gemini.js";
import { Resume } from "../models/resume.model.js";

// FR-5: AI extracts skills, projects, technologies, experience level from
// the raw resume text. Returns a plain object — callers handle saving it.
async function extractResumeDetails(rawText) {
    const prompt = `
You are analyzing a resume. Read the resume text below and extract structured
information about the candidate.

Return ONLY a JSON object with this exact shape, no other text:
{
  "skills": ["skill1", "skill2", ...],
  "projects": ["short project description", ...],
  "technologies": ["tech1", "tech2", ...],
  "experienceLevel": one of "Fresher" | "Junior" | "Mid" | "Senior" | "Lead"
}

Base "experienceLevel" on total years of professional experience mentioned
or implied (Fresher = no professional experience / student, Junior = 0-2 years,
Mid = 2-5 years, Senior = 5-9 years, Lead = 9+ years or explicit leadership titles).

Resume text:
"""
${rawText.slice(0, 12000)}
"""
`.trim();

    return askGeminiForJSON(prompt);
}

// FR-4: Upload Resume (PDF) — stores in Cloudinary, extracts text, parses
// it with Gemini, and saves/updates the user's single Resume document.
const uploadResume = asyncHandler(async (req, res) => {
    const localPath = req.file?.path;

    if (!localPath) {
        throw new ApiError(400, "Resume PDF file is required");
    }

    if (req.file.mimetype !== "application/pdf") {
        fs.unlinkSync(localPath); // clean up the temp file before erroring
        throw new ApiError(400, "Resume must be a PDF file");
    }

    // 1. Extract text directly from the local temp file (no need to wait
    //    for the Cloudinary round-trip just to read the text).
    const fileBuffer = fs.readFileSync(localPath);
    const parser = new PDFParse({ data: fileBuffer });
    const parsedPdf = await parser.getText();
    await parser.destroy();
    const rawText = parsedPdf.text?.trim();

    if (!rawText || rawText.length < 50) {
        fs.unlinkSync(localPath);
        throw new ApiError(
            400,
            "Could not read readable text from this PDF. Make sure it isn't a scanned image."
        );
    }

    // 2. Upload to Cloudinary for permanent storage / a shareable URL.
    //    uploadOnCloudinary (per your existing utils/cloudinary.js) already
    //    deletes the local temp file once the upload completes.
    const cloudinaryResult = await uploadOnCloudinary(localPath);

    if (!cloudinaryResult) {
        throw new ApiError(500, "Something went wrong while uploading the resume");
    }

    // 3. Ask Gemini to pull out structured details (FR-5).
    const details = await extractResumeDetails(rawText);

    // 4. Save or replace this user's single Resume document.
    const resume = await Resume.findOneAndUpdate(
        { user: req.user._id },
        {
            user: req.user._id,
            resumeUrl: cloudinaryResult.url,
            rawText,
            skills: details.skills || [],
            projects: details.projects || [],
            technologies: details.technologies || [],
            experienceLevel: details.experienceLevel || "Fresher",
        },
        { new: true, upsert: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, resume, "Resume uploaded and parsed successfully"));
});

// Lets the frontend check whether the logged-in user already has a resume
// on file (e.g. to skip the upload step on InterviewSetup if so).
const getMyResume = asyncHandler(async (req, res) => {
    const resume = await Resume.findOne({ user: req.user._id });

    if (!resume) {
        return res
            .status(200)
            .json(new ApiResponse(200, null, "No resume uploaded yet"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, resume, "Resume fetched successfully"));
});

export { uploadResume, getMyResume };