import { GoogleGenAI, type Schema } from "@google/genai";

// Server-only Gemini client. Reads GEMINI_API_KEY from the environment.
// Never import this into a Client Component — the key must stay on the server.
let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

// Model is configurable via GEMINI_MODEL in .env so you can swap it without
// touching code. Default: "gemini-flash-lite-latest" — it has a generous
// free-tier daily quota. On a billed key, "gemini-flash-latest" gives the best
// quality. (Newest models like gemini-3.5-flash cap the FREE tier at ~20/day.)
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/** Build an inline image part from a base64 data URL or raw base64 string. */
export function imagePart(dataUrlOrBase64: string): Part {
  const match = dataUrlOrBase64.match(/^data:(.+?);base64,(.*)$/);
  if (match) {
    return { inlineData: { mimeType: match[1], data: match[2] } };
  }
  return { inlineData: { mimeType: "image/jpeg", data: dataUrlOrBase64 } };
}

function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Last resort: grab the outermost { ... } block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Model did not return valid JSON.");
  }
}

/**
 * Call Gemini in structured-output mode and return the parsed object of type T.
 * A `responseSchema` constrains generation so the reply is always valid,
 * complete JSON matching the schema.
 */
export async function generateStructured<T>(opts: {
  systemInstruction: string;
  parts: Part[];
  responseSchema: Schema;
  temperature?: number;
}): Promise<T> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: opts.parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: opts.responseSchema,
      systemInstruction: opts.systemInstruction,
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: 4096,
    },
  });
  return parseJsonLoose<T>(response.text ?? "");
}
