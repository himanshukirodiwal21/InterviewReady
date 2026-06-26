import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// ai.js — multi-provider AI client with automatic fallback.
//
// Order: Gemini → Groq → OpenRouter (configured via PROVIDER_CHAIN below).
// If a provider fails (quota exhausted, rate limited, transient outage),
// the next provider in the chain is tried automatically. Every controller
// in the app calls askAI / askAIForJSON and never needs to know which
// provider actually answered.
// ============================================================================

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-4-scout:free";

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
    const message = err?.message || "";
    return message.includes("503") || message.includes("429") || message.includes("overloaded");
}

// ---------------------------------------------------------------------------
// Provider 1: Gemini
// ---------------------------------------------------------------------------
async function callGemini(prompt) {
    if (!genAI) throw new Error("GEMINI_API_KEY not configured");
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

// ---------------------------------------------------------------------------
// Provider 2: Groq (OpenAI-compatible chat completions endpoint)
// ---------------------------------------------------------------------------
async function callGroq(prompt) {
    if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Groq error [${res.status}]: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Provider 3: OpenRouter (OpenAI-compatible chat completions endpoint)
// ---------------------------------------------------------------------------
async function callOpenRouter(prompt) {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter error [${res.status}]: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// The chain itself — tried in this exact order.
// ---------------------------------------------------------------------------
const PROVIDER_CHAIN = [
    { name: "Gemini", call: callGemini },
    { name: "Groq", call: callGroq },
    { name: "OpenRouter", call: callOpenRouter },
];

const MAX_RETRIES_PER_PROVIDER = 2;
const BASE_DELAY_MS = 800;

async function callWithRetries(provider, prompt) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_PROVIDER; attempt++) {
        try {
            return await provider.call(prompt);
        } catch (err) {
            lastError = err;
            if (!isRetryableError(err) || attempt === MAX_RETRIES_PER_PROVIDER) {
                throw err;
            }
            const waitMs = BASE_DELAY_MS * 2 ** attempt + Math.random() * 200;
            console.warn(
                `[AI:${provider.name}] retryable error, retrying in ${Math.round(waitMs)}ms…`
            );
            await delay(waitMs);
        }
    }
    throw lastError;
}

/**
 * Sends a prompt to the first available/working provider in the chain,
 * falling through to the next provider on failure. Returns the raw text
 * response from whichever provider actually succeeded.
 */
export async function askAI(prompt) {
    const errors = [];

    for (const provider of PROVIDER_CHAIN) {
        try {
            const text = await callWithRetries(provider, prompt);
            return text;
        } catch (err) {
            console.warn(`[AI:${provider.name}] failed: ${err.message}`);
            errors.push(`${provider.name}: ${err.message}`);
        }
    }

    throw new Error(
        `All AI providers failed.\n${errors.join("\n")}`
    );
}

/**
 * Same as askAI, but expects (and enforces) a JSON response.
 * Models sometimes wrap JSON in ```json fences even when told not to —
 * this strips those before parsing so callers always get a clean object.
 */
export async function askAIForJSON(prompt) {
    const raw = await askAI(prompt);
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch (err) {
        throw new Error(
            `AI did not return valid JSON. Raw response: ${raw.slice(0, 300)}`
        );
    }
}