"use client";

import { useState } from "react";

import type { TriageResult } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";
import { Disclaimer } from "@/components/disclaimer";

const inputCls =
  "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-100";

export default function TriagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return setImage(null);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName: fd.get("patientName"),
        ageSex: fd.get("ageSex"),
        duration: fd.get("duration"),
        symptoms: fd.get("symptoms"),
        image,
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
          🩺 Symptom Triage
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Describe the presentation — optionally attach a photo (rash, wound, med
          label). You&apos;ll get an urgency level, likely causes, and red flags.
        </p>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Patient (optional)
              <input name="patientName" placeholder="Name" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Age / sex
              <input name="ageSex" placeholder="58M" className={inputCls} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Duration
            <input name="duration" placeholder="e.g. 2 days" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Symptoms
            <textarea
              name="symptoms"
              rows={4}
              placeholder="Describe symptoms in the patient's words…"
              className={`resize-y ${inputCls}`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Photo (optional)
            <input type="file" accept="image/*" onChange={onFile} className="text-sm text-zinc-500" />
          </label>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="attachment preview" className="max-h-40 w-fit rounded-lg border border-zinc-200 dark:border-zinc-800" />
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Assessing…" : "Run triage"}
          </button>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && !pending && (
          <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
            The triage result will appear here.
          </div>
        )}
        {result && (
          <div className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Urgency
              </span>
              <LevelBadge level={result.urgency} />
            </div>
            <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
              {result.urgencyReason}
            </p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Possible causes
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {result.possibleCauses.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">{c.name}</span>
                  <span className="text-xs capitalize text-zinc-400">{c.likelihood}</span>
                </li>
              ))}
            </ul>

            {result.redFlags.length > 0 && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Red flags — escalate if present
                </h3>
                <ul className="mt-1.5 list-inside list-disc text-sm text-red-800 dark:text-red-300">
                  {result.redFlags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Recommended action
            </h3>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {result.recommendedAction}
            </p>

            <Disclaimer text={result.disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
