import Link from "next/link";

import { auth } from "@/auth";
import { Logo, LogoMark } from "@/components/logo";
import { KIND_META, type AssessmentKind } from "@/lib/assessments";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link href="/dashboard" className="btn btn-primary px-5 py-2">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost px-4 py-2">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-primary px-5 py-2">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          AI clinical decision support
        </span>

        <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-zinc-50">
          The front desk of care,{" "}
          <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
            supercharged by AI
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Triage symptoms, turn messy notes into clean clinical documentation,
          and catch dangerous drug interactions — in one secure workspace.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={session?.user ? "/dashboard" : "/register"} className="btn btn-primary px-7 py-3 text-base">
            {session?.user ? "Open dashboard" : "Start free"}
          </Link>
          <Link href="/login" className="btn btn-ghost px-7 py-3 text-base">
            Sign in
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-400">
          Decision support — not a diagnosis. Always reviewed by a clinician.
        </p>
      </section>

      {/* Feature cards */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {(Object.keys(KIND_META) as AssessmentKind[]).map((kind) => {
            const meta = KIND_META[kind];
            return (
              <div key={kind} className="card p-6">
                <div className="text-3xl">{meta.emoji}</div>
                <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
                  {meta.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {meta.blurb}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-zinc-200/70 px-6 py-6 text-sm text-zinc-500 dark:border-zinc-800/70">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-6 w-6" /> MediFlow
        </span>
        <span className="text-xs text-zinc-400">
          Built with Next.js · Gemini · Postgres
        </span>
      </footer>
    </div>
  );
}
