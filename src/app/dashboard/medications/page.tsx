"use client";

import { useState } from "react";

import type { MedicationResult } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";
import { Disclaimer } from "@/components/disclaimer";
import { Spinner } from "@/components/spinner";
import { ToolHeader, ResultPlaceholder, Section } from "@/components/tool-ui";

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
        <ToolHeader
          emoji="💊"
          title="Medication Safety"
          subtitle="List the patient's medications (one per line). Get an interaction and safety review with an overall risk level."
        />

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="mf-field">
            Patient (optional)
            <input name="patientName" placeholder="Name" className="mf-input" />
          </label>
          <label className="mf-field">
            Medications (one per line)
            <textarea
              name="medications"
              rows={6}
              placeholder={"warfarin\naspirin\nibuprofen"}
              className="mf-input resize-y"
            />
          </label>
          <label className="mf-field">
            Conditions (optional)
            <input name="conditions" placeholder="e.g. atrial fibrillation, CKD" className="mf-input" />
          </label>
          <button type="submit" disabled={pending} className="btn btn-primary h-11">
            {pending && <Spinner />}
            {pending ? "Checking…" : "Check interactions"}
          </button>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && <ResultPlaceholder pending={pending} label="safety review" />}
        {result && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Overall risk</span>
              <LevelBadge level={result.overallRisk} />
            </div>

            <Section title="Interactions">
              {result.interactions.length === 0 ? (
                <p className="text-sm text-green-700 dark:text-green-400">
                  No significant interactions found.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {result.interactions.map((it, i) => (
                    <li key={i} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[it.severity] ?? "bg-zinc-400"}`} aria-hidden />
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {it.drugs.join(" + ")}
                        </span>
                        <span className="text-xs capitalize text-zinc-400">{it.severity}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300">{it.explanation}</p>
                      <p className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">→ {it.recommendation}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {result.warnings.length > 0 && (
              <Section title="Other warnings">
                <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </Section>
            )}

            <Disclaimer text={result.disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
