import { Type, type FunctionDeclaration, type Content } from "@google/genai";

import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini";
import { runTriage, checkMedications, writeNote, getPatientHistory } from "@/lib/tools";

export type AgentStep = {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  result: unknown;
};

export type CopilotResult = {
  steps: AgentStep[];
  answer: string;
  label: string;
};

const SYSTEM = `You are MediFlow Copilot, an autonomous clinical decision-support agent for clinicians.

Given a free-text clinical situation, PLAN which tools to use, call them, read the
results, and then write ONE concise action plan. Guidelines:
- If symptoms are described, call run_triage.
- If two or more medications are mentioned (or a new drug is being considered), call check_medications.
- If a patient is named, call get_patient_history to check for prior records ("memory").
- If asked to document a consult, call write_note.
- You may call multiple tools. Call tools before answering; do not guess what a tool would return.

When you have gathered enough, STOP calling tools and write the final answer as short
markdown with these sections:
**Urgency** (one line), **What I found** (bullets referencing tool results),
**Recommended actions** (bullets). Before finishing, double-check you have not missed
any life-threatening red flag; if you might have, escalate.
End with: "_Decision support only — not a diagnosis. Review with a licensed clinician._"`;

const declarations: FunctionDeclaration[] = [
  {
    name: "run_triage",
    description:
      "Assess the urgency of a patient's symptoms. Returns urgency level, likely causes, and red flags.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        symptoms: { type: Type.STRING, description: "The presenting symptoms." },
        ageSex: { type: Type.STRING, description: "e.g. '58F'. Optional." },
        duration: { type: Type.STRING, description: "How long symptoms have lasted. Optional." },
      },
      required: ["symptoms"],
    },
  },
  {
    name: "check_medications",
    description:
      "Check a list of medications for drug-drug interactions and safety. Returns overall risk and interactions.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        medications: { type: Type.ARRAY, items: { type: Type.STRING } },
        conditions: { type: Type.STRING, description: "Relevant conditions. Optional." },
      },
      required: ["medications"],
    },
  },
  {
    name: "write_note",
    description: "Turn a consultation transcript into a structured SOAP note and patient summary.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        transcript: { type: Type.STRING, description: "The raw consult notes / dictation." },
      },
      required: ["transcript"],
    },
  },
  {
    name: "get_patient_history",
    description:
      "Look up this clinician's previously saved assessments for a named patient (the agent's memory).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        patientName: { type: Type.STRING },
      },
      required: ["patientName"],
    },
  },
];

async function execute(
  name: string,
  args: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (name) {
    case "run_triage":
      return runTriage(args as { symptoms: string; ageSex?: string; duration?: string });
    case "check_medications":
      return checkMedications(args as { medications: string[]; conditions?: string });
    case "write_note":
      return writeNote(args as { transcript: string });
    case "get_patient_history":
      return getPatientHistory(userId, String(args.patientName ?? ""));
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Derive a headline badge (worst urgency / risk seen) from the tools that ran.
function deriveLabel(steps: AgentStep[]): string {
  const order = ["EMERGENCY", "HIGH", "URGENT", "MODERATE", "ROUTINE", "LOW", "SELF_CARE"];
  let best: string | null = null;
  for (const s of steps) {
    const r = s.result as { urgency?: string; overallRisk?: string } | null;
    const level = r?.urgency ?? r?.overallRisk;
    if (level && (best === null || order.indexOf(level) < order.indexOf(best))) {
      best = level;
    }
  }
  return best ?? "Plan";
}

export async function runCopilotAgent(
  userId: string,
  message: string,
  maxIterations = 6,
): Promise<CopilotResult> {
  const ai = getGeminiClient();
  const contents: Content[] = [{ role: "user", parts: [{ text: message }] }];
  const steps: AgentStep[] = [];

  for (let i = 0; i < maxIterations; i++) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        tools: [{ functionDeclarations: declarations }],
        systemInstruction: SYSTEM,
        temperature: 0.2,
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      return { steps, answer: response.text ?? "", label: deriveLabel(steps) };
    }

    // Record the model's tool-call turn, then execute each call.
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const responseParts = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const args = (call.args ?? {}) as Record<string, unknown>;
      let result: unknown;
      let ok = true;
      try {
        result = await execute(name, args, userId);
      } catch (err) {
        ok = false;
        result = { error: err instanceof Error ? err.message : "Tool failed." };
      }
      steps.push({ tool: name, args, ok, result });
      responseParts.push({
        functionResponse: { id: call.id, name, response: { result } },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }

  // Ran out of iterations — force a final answer without tools.
  const final = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      ...contents,
      { role: "user", parts: [{ text: "Now write the final action plan for the clinician." }] },
    ],
    config: { systemInstruction: SYSTEM, temperature: 0.2 },
  });
  return { steps, answer: final.text ?? "", label: deriveLabel(steps) };
}
