import Link from "next/link";

import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            MediFlow
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            AI clinical assistant — symptom triage, a consultation scribe, and
            medication-safety checks, all in one secure workspace.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-full border border-black/[.08] px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.06]"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
