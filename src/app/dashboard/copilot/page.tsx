"use client";

import { useState } from "react";

import { Spinner } from "@/components/spinner";
import { LevelBadge } from "@/components/level-badge";
import { ToolHeader } from "@/components/tool-ui";

type Step = { tool: string; args: Record<string, unknown>; ok: boolean; result: unknown };
type CopilotResult = { steps: Step[]; answer: string; label: string };

const TOOL_META: Record<string, { emoji: string; label: string }> = {
  run_triage: { emoji: "🩺", label: "Ran symptom triage" },
  check_medications: { emoji: "💊", label: "Checked medication safety" },
  write_note: { emoji: "📝", label: "Drafted clinical note" },
  get_patient_history: { emoji: "🗂️", label: "Looked up patient history" },
};

const EXAMPLES = [
  "58F on warfarin and amlodipine, sudden crushing chest pain radiating to the left arm, sweating.",
  "7yo with barking cough, fever 39, mild trouble breathing for 2 days.",
  "Patient wants to add ibuprofen while already taking warfarin and aspirin — is that safe?",
];

function stepBadge(result: unknown): string | null {
  const r = result as { urgency?: string; overallRisk?: string } | null;
  return r?.urgency ?? r?.overallRisk ?? null;
}

/** Minimal markdown: **bold**, _italic_, headings, and - bullets. */
function Markdown({ text }: { text: string }) {
  const inline = (s: string, key: number) => {
    const nodes: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|_(.+?)_/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) nodes.push(s.slice(last, m.index));
      if (m[1]) nodes.push(<strong key={m.index}>{m[1]}</strong>);
      else nodes.push(<em key={m.index}>{m[2]}</em>);
      last = m.index + m[0].length;
    }
    if (last < s.length) nodes.push(s.slice(last));
    return <span key={key}>{nodes}</span>;
  };

  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="flex flex-col gap-1.5 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
      {lines.map((line, i) => {
        const t = line.trim();
        // horizontal rule
        if (/^(\*\*\*|---|___)$/.test(t)) {
          return <hr key={i} className="my-2 border-zinc-200 dark:border-zinc-800" />;
        }
        // headings: markdown ### or a whole-line **Heading**
        const h = t.match(/^#{1,4}\s+(.*)$/);
        if (h || /^\*\*[^*]+\*\*:?$/.test(t)) {
          return (
            <h4 key={i} className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {(h ? h[1] : t).replace(/\*\*/g, "").replace(/:$/, "")}
            </h4>
          );
        }
        // numbered list item
        const num = t.match(/^(\d+)\.\s+(.*)$/);
        if (num) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="font-semibold text-brand-500">{num[1]}.</span>
              <span>{inline(num[2], i)}</span>
            </div>
          );
        }
        // bullet
        if (/^[-*]\s+/.test(t)) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-brand-500">•</span>
              <span>{inline(t.replace(/^[-*]\s+/, ""), i)}</span>
            </div>
          );
        }
        return <p key={i}>{inline(t, i)}</p>;
      })}
    </div>
  );
}

export default function CopilotPage() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(text: string) {
    if (!text.trim()) return;
    setPending(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setResult(data);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ToolHeader
        emoji="🤖"
        title="MediFlow Copilot"
        subtitle="Describe a clinical situation in plain language. The agent decides which tools to use — triage, medication safety, notes, patient history — runs them, and returns one action plan."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(message);
        }}
        className="mt-6 flex flex-col gap-3"
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="e.g. 62F on warfarin, now with chest pain and shortness of breath…"
          className="mf-input resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setMessage(ex);
                  run(ex);
                }}
                disabled={pending}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400"
              >
                Example {i + 1}
              </button>
            ))}
          </div>
          <button type="submit" disabled={pending} className="btn btn-primary h-10 px-5">
            {pending && <Spinner />}
            {pending ? "Working…" : "Run copilot"}
          </button>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
      </form>

      {pending && (
        <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner className="h-5 w-5 text-brand-500" />
          The agent is planning and calling tools…
        </div>
      )}

      {result && (
        <div className="mt-8 flex flex-col gap-6">
          {/* Agent trace */}
          <section>
            <h3 className="eyebrow">Agent steps</h3>
            <ol className="mt-3 flex flex-col gap-2">
              {result.steps.length === 0 && (
                <li className="text-sm text-zinc-400">Answered directly — no tools needed.</li>
              )}
              {result.steps.map((s, i) => {
                const meta = TOOL_META[s.tool] ?? { emoji: "⚙️", label: s.tool };
                const badge = stepBadge(s.result);
                return (
                  <li key={i} className="card flex items-center gap-3 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-lg dark:bg-brand-950/50">
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {meta.label}
                      </p>
                      <p className="truncate text-xs text-zinc-400">
                        {Object.values(s.args).map(String).join(" · ") || "—"}
                      </p>
                    </div>
                    {badge ? <LevelBadge level={badge} /> : (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">✓</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Final plan */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h3 className="eyebrow">Action plan</h3>
              <LevelBadge level={result.label} />
            </div>
            <div className="mt-3">
              <Markdown text={result.answer} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
