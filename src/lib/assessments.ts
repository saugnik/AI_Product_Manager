// Shared types + Gemini prompts for the three MediFlow AI tools.
// Every prompt enforces a strict JSON shape and a safety posture: decision
// support only, never a definitive diagnosis, always surface emergencies.

export const SAFETY_RULES = `
You are a clinical decision-support assistant, NOT a doctor. You never provide a
definitive diagnosis or a prescription. If the information suggests a
life-threatening emergency, say so clearly and tell the user to seek emergency
care immediately. Always populate the "disclaimer" field reminding the user this
is decision support that must be reviewed by a licensed clinician.
Return ONLY valid JSON matching the requested shape. No markdown, no commentary.`;

/* ----------------------------- Triage ----------------------------- */

export type Urgency = "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE";

export interface TriageResult {
  urgency: Urgency;
  urgencyReason: string;
  possibleCauses: { name: string; likelihood: "high" | "moderate" | "low" }[];
  redFlags: string[];
  recommendedAction: string;
  disclaimer: string;
}

export const TRIAGE_PROMPT = `${SAFETY_RULES}

Task: Triage a patient based on their described symptoms (and an image if one is
provided, e.g. a rash, wound, or medication label).

Return JSON with EXACTLY this shape:
{
  "urgency": "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE",
  "urgencyReason": "one plain-English sentence explaining the urgency level",
  "possibleCauses": [ { "name": "string", "likelihood": "high" | "moderate" | "low" } ],
  "redFlags": [ "warning signs that mean the patient should escalate immediately" ],
  "recommendedAction": "clear next step for the patient",
  "disclaimer": "string"
}
Provide 2-4 possibleCauses ordered most-likely first. redFlags may be empty.`;

/* ----------------------------- Scribe ----------------------------- */

export interface ScribeResult {
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  patientSummary: string;
  followUps: string[];
  icdHints: { code: string; description: string }[];
  disclaimer: string;
}

export const SCRIBE_PROMPT = `${SAFETY_RULES}

Task: Convert a clinician's raw consultation notes or dictation transcript into a
structured clinical note.

Return JSON with EXACTLY this shape:
{
  "soap": {
    "subjective": "patient-reported history and symptoms",
    "objective": "exam findings, vitals, observations",
    "assessment": "clinical impression (not a definitive diagnosis)",
    "plan": "treatment plan, tests, referrals"
  },
  "patientSummary": "a warm, plain-language after-visit summary the patient can read",
  "followUps": [ "concrete follow-up actions" ],
  "icdHints": [ { "code": "ICD-10 code", "description": "string" } ],
  "disclaimer": "string"
}
icdHints are suggestions for the clinician to verify, not billing advice. Base
every field ONLY on the provided notes; do not invent findings.`;

/* --------------------------- Medication --------------------------- */

export type RiskLevel = "HIGH" | "MODERATE" | "LOW";

export interface MedicationResult {
  overallRisk: RiskLevel;
  interactions: {
    drugs: string[];
    severity: "high" | "moderate" | "low";
    explanation: string;
    recommendation: string;
  }[];
  warnings: string[];
  disclaimer: string;
}

export const MEDICATION_PROMPT = `${SAFETY_RULES}

Task: Review a patient's list of medications (and optional conditions) for
drug-drug interactions and safety concerns.

Return JSON with EXACTLY this shape:
{
  "overallRisk": "HIGH" | "MODERATE" | "LOW",
  "interactions": [
    {
      "drugs": [ "the two or more interacting medications" ],
      "severity": "high" | "moderate" | "low",
      "explanation": "what the interaction is and why it matters",
      "recommendation": "what to do about it"
    }
  ],
  "warnings": [ "other safety notes: duplicate therapy, dosing, condition conflicts" ],
  "disclaimer": "string"
}
If no interactions are found, return an empty interactions array and set
overallRisk to "LOW". Never tell the patient to start or stop a medication on
their own — always defer to their prescriber.`;

/* ----------------------- Display metadata ------------------------ */

export type AssessmentKind = "TRIAGE" | "SCRIBE" | "MEDICATION";

export const KIND_META: Record<
  AssessmentKind,
  { title: string; blurb: string; href: string; emoji: string }
> = {
  TRIAGE: {
    title: "Symptom Triage",
    blurb: "Symptoms (and a photo) in → urgency, causes, and red flags out.",
    href: "/dashboard/triage",
    emoji: "🩺",
  },
  SCRIBE: {
    title: "Clinical Scribe",
    blurb: "Consult notes in → structured SOAP note + patient summary.",
    href: "/dashboard/scribe",
    emoji: "📝",
  },
  MEDICATION: {
    title: "Medication Safety",
    blurb: "Medication list in → interaction and safety review.",
    href: "/dashboard/medications",
    emoji: "💊",
  },
};

// Tailwind classes for urgency / risk badges shared across the UI.
export const LEVEL_STYLES: Record<string, string> = {
  EMERGENCY: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  ROUTINE: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  SELF_CARE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  MODERATE: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
};
