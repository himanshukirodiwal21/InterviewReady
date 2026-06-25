import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash was shut down June 1, 2026, and the 1.5 generation is
// fully retired. gemini-2.5-flash is the current fast/cheap text model.
const MODEL_NAME = "gemini-2.5-flash";

// Google's free tier occasionally returns 503 "high demand" errors that
// have nothing to do with your account or code — they clear up on their
// own within seconds. Rather than make every caller retry manually (as we
// were doing by hand in Postman), every Gemini call automatically retries
// with exponential backoff before giving up.
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
    const message = err?.message || "";
    // 503 = temporarily overloaded. 429 = rate limited (briefly backing off
    // and retrying is also reasonable here, not just for quota-exceeded cases).
    return message.includes("503") || message.includes("429") || message.includes("overloaded");
}

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Every other Gemini-dependent function in this app goes through this
 * one function, so retry/error-handling logic only needs to live in one place.
 */
export async function askGemini(prompt) {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            lastError = err;

            if (!isRetryableError(err) || attempt === MAX_RETRIES) {
                throw err;
            }

            // Exponential backoff: 1s, 2s, 4s, 8s — plus a little randomness
            // so multiple concurrent requests don't all retry at once.
            const waitMs = BASE_DELAY_MS * 2 ** attempt + Math.random() * 300;
            console.warn(
                `Gemini request failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(waitMs)}ms…`
            );
            await delay(waitMs);
        }
    }

    throw lastError;
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