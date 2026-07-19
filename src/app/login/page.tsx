"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Logo } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { AuthAside } from "@/components/auth-aside";

export default function LoginPage() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <AuthAside />
      <div className="flex items-center justify-center px-6 py-12">
        <Suspense fallback={<div className="h-96 w-full max-w-sm" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
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
    <div className="w-full max-w-sm">
      <div className="lg:hidden">
        <Logo />
      </div>
      <h1 className="mt-8 text-2xl font-bold tracking-tight text-zinc-900 lg:mt-0 dark:text-zinc-50">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to your MediFlow workspace.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="mf-field">
          Email
          <input name="email" type="email" required autoComplete="email" className="mf-input" placeholder="you@clinic.com" />
        </label>
        <label className="mf-field">
          Password
          <input name="password" type="password" required autoComplete="current-password" className="mf-input" placeholder="••••••••" />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary mt-1 h-11">
          {pending && <Spinner />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        No account?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
          Create one
        </Link>
      </p>
    </div>
  );
}
