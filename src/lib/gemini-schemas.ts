import { Type, type Schema } from "@google/genai";

// Gemini responseSchema definitions. Constraining generation to these makes the
// model return valid, complete JSON every time (no markdown, no truncation).
// Server-only: this imports the Gemini SDK, so never pull it into a client file.

export const triageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    urgency: {
      type: Type.STRING,
      enum: ["EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"],
    },
    urgencyReason: { type: Type.STRING },
    possibleCauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ["high", "moderate", "low"] },
        },
        required: ["name", "likelihood"],
      },
    },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedAction: { type: Type.STRING },
    disclaimer: { type: Type.STRING },
  },
  required: [
    "urgency",
    "urgencyReason",
    "possibleCauses",
    "redFlags",
    "recommendedAction",
    "disclaimer",
  ],
};

export const scribeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    soap: {
      type: Type.OBJECT,
      properties: {
        subjective: { type: Type.STRING },
        objective: { type: Type.STRING },
        assessment: { type: Type.STRING },
        plan: { type: Type.STRING },
      },
      required: ["subjective", "objective", "assessment", "plan"],
    },
    patientSummary: { type: Type.STRING },
    followUps: { type: Type.ARRAY, items: { type: Type.STRING } },
    icdHints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["code", "description"],
      },
    },
    disclaimer: { type: Type.STRING },
  },
  required: ["soap", "patientSummary", "followUps", "icdHints", "disclaimer"],
};

export const medicationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallRisk: { type: Type.STRING, enum: ["HIGH", "MODERATE", "LOW"] },
    interactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          drugs: { type: Type.ARRAY, items: { type: Type.STRING } },
          severity: { type: Type.STRING, enum: ["high", "moderate", "low"] },
          explanation: { type: Type.STRING },
          recommendation: { type: Type.STRING },
        },
        required: ["drugs", "severity", "explanation", "recommendation"],
      },
    },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    disclaimer: { type: Type.STRING },
  },
  required: ["overallRisk", "interactions", "warnings", "disclaimer"],
};
