"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  // useSearchParams() (used in LoginForm) must sit inside a Suspense boundary
  // so the page can be prerendered.
  return (
    <Suspense fallback={<div className="flex flex-1 bg-zinc-50 dark:bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setPending(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sign in to MediFlow
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back. Enter your details to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-100"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-full bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
