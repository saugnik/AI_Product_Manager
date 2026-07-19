// Pure tool functions the Copilot agent can call. Each wraps one capability
// (AI or database) with no HTTP/auth concerns, so they compose cleanly.
import { prisma } from "@/lib/prisma";
import { generateStructured } from "@/lib/gemini";
import { triageSchema, scribeSchema, medicationSchema } from "@/lib/gemini-schemas";
import {
  TRIAGE_PROMPT,
  SCRIBE_PROMPT,
  MEDICATION_PROMPT,
  type TriageResult,
  type ScribeResult,
  type MedicationResult,
} from "@/lib/assessments";

export function runTriage(input: {
  symptoms: string;
  ageSex?: string;
  duration?: string;
}) {
  const details = [
    input.ageSex && `Patient: ${input.ageSex}`,
    input.duration && `Duration: ${input.duration}`,
    `Symptoms: ${input.symptoms}`,
  ]
    .filter(Boolean)
    .join("\n");
  return generateStructured<TriageResult>({
    systemInstruction: TRIAGE_PROMPT,
    parts: [{ text: details }],
    responseSchema: triageSchema,
  });
}

export function checkMedications(input: {
  medications: string[];
  conditions?: string;
}) {
  const details = [
    `Medications: ${input.medications.join(", ")}`,
    input.conditions && `Conditions: ${input.conditions}`,
  ]
    .filter(Boolean)
    .join("\n");
  return generateStructured<MedicationResult>({
    systemInstruction: MEDICATION_PROMPT,
    parts: [{ text: details }],
    responseSchema: medicationSchema,
  });
}

export function writeNote(input: { transcript: string }) {
  return generateStructured<ScribeResult>({
    systemInstruction: SCRIBE_PROMPT,
    parts: [{ text: `Consultation notes / transcript:\n${input.transcript}` }],
    responseSchema: scribeSchema,
  });
}

// Reads the signed-in clinician's saved assessments for a named patient —
// this is the agent's "memory".
export async function getPatientHistory(userId: string, patientName: string) {
  const rows = await prisma.assessment.findMany({
    where: {
      userId,
      patientName: { contains: patientName, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { kind: true, label: true, patientName: true, createdAt: true },
  });
  if (rows.length === 0) {
    return { found: false, message: `No prior records found for "${patientName}".` };
  }
  return {
    found: true,
    records: rows.map((r) => ({
      type: r.kind,
      headline: r.label,
      patient: r.patientName,
      date: r.createdAt.toISOString().slice(0, 10),
    })),
  };
}
