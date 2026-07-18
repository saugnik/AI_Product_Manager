"use client";

import { useState } from "react";

import type { MedicationResult } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";
import { Disclaimer } from "@/components/disclaimer";

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-100";

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  moderate: "bg-orange-500",
  low: "bg-green-500",
};

export default function MedicationsPage() {
  const [result, setResult] = useState<MedicationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const medications = String(fd.get("medications") ?? "")
      .split(/[\n,]/)
      .map((m) => m.trim())
      .filter(Boolean);
    const res = await fetch("/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: fd.get("patientName"),
        conditions: fd.get("conditions"),
        medications,
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
          💊 Medication Safety
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          List the patient&apos;s medications (one per line). Get an interaction
          and safety review with an overall risk level.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Patient (optional)
            <input name="patientName" placeholder="Name" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Medications (one per line)
            <textarea
              name="medications"
              rows={6}
              placeholder={"warfarin\naspirin\nibuprofen"}
              className={`resize-y ${inputCls}`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Conditions (optional)
            <input
              name="conditions"
              placeholder="e.g. atrial fibrillation, CKD"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Checking…" : "Check interactions"}
          </button>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && !pending && (
          <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            The safety review will appear here.
          </div>
        )}
        {result && (
          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Overall risk
              </span>
              <LevelBadge level={result.overallRisk} />
            </div>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Interactions
            </h3>
            {result.interactions.length === 0 ? (
              <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                No significant interactions found.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3">
                {result.interactions.map((it, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-black/[.06] p-3 dark:border-white/[.08]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${SEVERITY_DOT[it.severity] ?? "bg-zinc-400"}`}
                        aria-hidden
                      />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {it.drugs.join(" + ")}
                      </span>
                      <span className="text-xs capitalize text-zinc-400">
                        {it.severity}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                      {it.explanation}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      → {it.recommendation}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {result.warnings.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Other warnings
                </h3>
                <ul className="mt-1.5 list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </>
            )}

            <Disclaimer text={result.disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
