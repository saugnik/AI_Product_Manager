import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { generateStructured, imagePart, type Part } from "@/lib/gemini";
import { triageSchema } from "@/lib/gemini-schemas";
import { TRIAGE_PROMPT, type TriageResult } from "@/lib/assessments";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    symptoms?: string;
    ageSex?: string;
    duration?: string;
    image?: string;
    patientName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const symptoms = body.symptoms?.trim();
  if (!symptoms && !body.image) {
    return NextResponse.json(
      { error: "Describe the symptoms or attach an image." },
      { status: 400 },
    );
  }

  const details = [
    body.ageSex && `Patient: ${body.ageSex}`,
    body.duration && `Duration: ${body.duration}`,
    symptoms && `Symptoms: ${symptoms}`,
    body.image && "An image is attached — factor it into the assessment.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const parts: Part[] = [{ text: details }];
    if (body.image) parts.push(imagePart(body.image));

    const result = await generateStructured<TriageResult>({
      systemInstruction: TRIAGE_PROMPT,
      parts,
      responseSchema: triageSchema,
    });

    const record = await prisma.assessment.create({
      data: {
        kind: "TRIAGE",
        userId: session.user.id,
        patientName: body.patientName?.trim() || null,
        label: result.urgency,
        input: {
          symptoms: symptoms ?? "",
          ageSex: body.ageSex ?? "",
          duration: body.duration ?? "",
          hasImage: Boolean(body.image),
        },
        result: result as unknown as Prisma.InputJsonObject,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: record.id, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Triage failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
