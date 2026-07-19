import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { runCopilotAgent } from "@/lib/copilot";

export const maxDuration = 60; // agent may chain several model calls

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let message: string | undefined;
  try {
    ({ message } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length < 4) {
    return NextResponse.json(
      { error: "Describe the clinical situation." },
      { status: 400 },
    );
  }

  try {
    const result = await runCopilotAgent(session.user.id, message.trim());
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Copilot failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
