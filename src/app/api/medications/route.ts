import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateStructured } from "@/lib/gemini";
import { medicationSchema } from "@/lib/gemini-schemas";
import { MEDICATION_PROMPT, type MedicationResult } from "@/lib/assessments";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { medications?: string[]; conditions?: string; patientName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const medications = (body.medications ?? [])
    .map((m) => String(m).trim())
    .filter(Boolean);
  if (medications.length < 2) {
    return NextResponse.json(
      { error: "Add at least two medications to check for interactions." },
      { status: 400 },
    );
  }

  const details = [
    `Medications: ${medications.join(", ")}`,
    body.conditions?.trim() && `Conditions: ${body.conditions.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await generateStructured<MedicationResult>({
      systemInstruction: MEDICATION_PROMPT,
      parts: [{ text: details }],
      responseSchema: medicationSchema,
    });

    const record = await prisma.assessment.create({
      data: {
        kind: "MEDICATION",
        userId: session.user.id,
        patientName: body.patientName?.trim() || null,
        label: result.overallRisk,
        input: { medications, conditions: body.conditions ?? "" },
        result: result as unknown as Prisma.InputJsonObject,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: record.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Medication check failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
