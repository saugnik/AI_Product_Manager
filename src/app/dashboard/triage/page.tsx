"use client";

import { useState } from "react";

import type { TriageResult } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";
import { Disclaimer } from "@/components/disclaimer";
import { Spinner } from "@/components/spinner";
import { ToolHeader, ResultPlaceholder, Section } from "@/components/tool-ui";

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
        <ToolHeader
          emoji="🩺"
          title="Symptom Triage"
          subtitle="Describe the presentation — optionally attach a photo (rash, wound, med label). You'll get an urgency level, likely causes, and red flags."
        />

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="mf-field">
              Patient (optional)
              <input name="patientName" placeholder="Name" className="mf-input" />
            </label>
            <label className="mf-field">
              Age / sex
              <input name="ageSex" placeholder="58M" className="mf-input" />
            </label>
          </div>
          <label className="mf-field">
            Duration
            <input name="duration" placeholder="e.g. 2 days" className="mf-input" />
          </label>
          <label className="mf-field">
            Symptoms
            <textarea name="symptoms" rows={4} placeholder="Describe symptoms in the patient's words…" className="mf-input resize-y" />
          </label>
          <label className="mf-field">
            Photo (optional)
            <input type="file" accept="image/*" onChange={onFile} className="text-sm text-zinc-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 dark:file:bg-brand-950 dark:file:text-brand-300" />
          </label>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="attachment preview" className="max-h-40 w-fit rounded-xl border border-zinc-200 dark:border-zinc-800" />
          )}

          <button type="submit" disabled={pending} className="btn btn-primary h-11">
            {pending && <Spinner />}
            {pending ? "Assessing…" : "Run triage"}
          </button>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
        </form>
      </div>

      <div>
        {!result && <ResultPlaceholder pending={pending} label="triage result" />}
        {result && (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Urgency</span>
              <LevelBadge level={result.urgency} />
            </div>
            <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">{result.urgencyReason}</p>

            <Section title="Possible causes">
              <ul className="flex flex-col gap-1.5">
                {result.possibleCauses.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-800 dark:text-zinc-200">{c.name}</span>
                    <span className="text-xs capitalize text-zinc-400">{c.likelihood}</span>
                  </li>
                ))}
              </ul>
            </Section>

            {result.redFlags.length > 0 && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/60 dark:bg-red-950/30">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  Red flags — escalate if present
                </h3>
                <ul className="mt-1.5 list-inside list-disc text-sm text-red-800 dark:text-red-300">
                  {result.redFlags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            <Section title="Recommended action">
              <p className="text-sm text-zinc-800 dark:text-zinc-200">{result.recommendedAction}</p>
            </Section>

            <Disclaimer text={result.disclaimer} />
          </div>
        )}
      </div>
    </div>
  );
}
