"use client";

import { useState } from "react";

import type { ScribeResult } from "@/lib/assessments";
import { Disclaimer } from "@/components/disclaimer";
import { Spinner } from "@/components/spinner";
import { ToolHeader, ResultPlaceholder, Section } from "@/components/tool-ui";

const SOAP_LABELS: Record<string, string> = {
  subjective: "Subjective",
  objective: "Objective",
  assessment: "Assessment",
  plan: "Plan",
};

export default function ScribePage() {
  const [result, setResult] = useState<ScribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/scribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: fd.get("patientName"),
        transcript: fd.get("transcript"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setResult(data.result);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <ToolHeader
          emoji="📝"
          title="Clinical Scribe"
          subtitle="Paste rough consult notes or a dictation transcript. Get a structured SOAP note, a patient-friendly summary, and follow-ups."
        />

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="mf-field">
            Patient (optional)
            <input name="patientName" placeholder="Name" className="mf-input" />
          </label>
          <label className="mf-field">
            Consultation notes / transcript
            <textarea
              name="transcript"
              rows={9}
              placeholder="35yo F, 3 days sore throat, fever 38.5, no cough. Exam: tonsillar exudate…"
              className="mf-input resize-y"
            />
          </label>
          <button type="submit" disabled={pending} className="btn btn-primary h-11">
            {pending && <Spinner />}
            {pending ? "Writing note…" : "Generate note"}
          </button>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && <ResultPlaceholder pending={pending} label="structured note" />}
        {result && (
          <div className="card p-6">
            <Section title="SOAP note">
              <dl className="flex flex-col gap-3">
                {(["subjective", "objective", "assessment", "plan"] as const).map((k) => (
                  <div key={k} className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800/60">
                    <dt className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {SOAP_LABELS[k]}
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                      {result.soap[k]}
                    </dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section title="After-visit summary">
              <p className="whitespace-pre-wrap rounded-lg bg-brand-50/60 p-3 text-sm text-zinc-800 dark:bg-brand-950/20 dark:text-zinc-200">
                {result.patientSummary}
              </p>
            </Section>

            {result.followUps.length > 0 && (
              <Section title="Follow-ups">
                <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {result.followUps.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </Section>
            )}

            {result.icdHints.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {result.icdHints.map((h, i) => (
                  <span
                    key={i}
                    title={h.description}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {h.code} · {h.description}
                  </span>
                ))}
              </div>
            )}

            <Disclaimer text={result.disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
