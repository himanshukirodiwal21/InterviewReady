import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash was shut down June 1, 2026, and the 1.5 generation is
// fully retired. gemini-2.5-flash is the current fast/cheap text model.
// const MODEL_NAME = "gemini-2.5-flash";
const MODEL_NAME = "gemini-2.5-flash-lite";

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Every other Gemini-dependent function in this app goes through this
 * one function, so retry/error-handling logic only needs to live in one place.
 */
export async function askGemini(prompt) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Same as askGemini, but expects (and enforces) a JSON response.
 * Gemini sometimes wraps JSON in ```json fences even when told not to —
 * this strips those before parsing so callers always get a clean object.
 */
export async function askGeminiForJSON(prompt) {
    const raw = await askGemini(prompt);
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        throw new Error(
            `Gemini did not return valid JSON. Raw response: ${raw.slice(0, 300)}`
        );
    }
}