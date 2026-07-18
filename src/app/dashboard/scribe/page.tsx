"use client";

import { useState } from "react";

import type { ScribeResult } from "@/lib/assessments";
import { Disclaimer } from "@/components/disclaimer";

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-100";

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
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          📝 Clinical Scribe
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Paste rough consult notes or a dictation transcript. Get a structured
          SOAP note, a patient-friendly summary, and follow-ups.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Patient (optional)
            <input name="patientName" placeholder="Name" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Consultation notes / transcript
            <textarea
              name="transcript"
              rows={9}
              placeholder="35yo F, 3 days sore throat, fever 38.5, no cough. Exam: tonsillar exudate…"
              className={`resize-y ${inputCls}`}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Writing note…" : "Generate note"}
          </button>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && !pending && (
          <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            The structured note will appear here.
          </div>
        )}
        {result && (
          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              SOAP note
            </h3>
            <dl className="mt-2 flex flex-col gap-3">
              {(["subjective", "objective", "assessment", "plan"] as const).map((k) => (
                <div key={k}>
                  <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {SOAP_LABELS[k]}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
                    {result.soap[k]}
                  </dd>
                </div>
              ))}
            </dl>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              After-visit summary
            </h3>
            <p className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {result.patientSummary}
            </p>

            {result.followUps.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Follow-ups
                </h3>
                <ul className="mt-1.5 list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {result.followUps.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </>
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
