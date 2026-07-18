import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateStructured } from "@/lib/gemini";
import { scribeSchema } from "@/lib/gemini-schemas";
import { SCRIBE_PROMPT, type ScribeResult } from "@/lib/assessments";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { transcript?: string; patientName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const transcript = body.transcript?.trim();
  if (!transcript || transcript.length < 15) {
    return NextResponse.json(
      { error: "Paste the consultation notes to generate a structured note." },
      { status: 400 },
    );
  }

  try {
    const result = await generateStructured<ScribeResult>({
      systemInstruction: SCRIBE_PROMPT,
      parts: [{ text: `Consultation notes / transcript:\n${transcript}` }],
      responseSchema: scribeSchema,
    });

    const record = await prisma.assessment.create({
      data: {
        kind: "SCRIBE",
        userId: session.user.id,
        patientName: body.patientName?.trim() || null,
        label: "Note",
        input: { transcript },
        result: result as unknown as Prisma.InputJsonObject,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: record.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Note generation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
