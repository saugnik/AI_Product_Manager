"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Logo } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { AuthAside } from "@/components/auth-aside";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setPending(false);
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setPending(false);
    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <AuthAside />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-zinc-900 lg:mt-0 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Get started with MediFlow in seconds.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="mf-field">
              Name
              <input name="name" type="text" required autoComplete="name" className="mf-input" placeholder="Dr. Jane Doe" />
            </label>
            <label className="mf-field">
              Email
              <input name="email" type="email" required autoComplete="email" className="mf-input" placeholder="you@clinic.com" />
            </label>
            <label className="mf-field">
              Password
              <input name="password" type="password" required autoComplete="new-password" className="mf-input" placeholder="••••••••" />
              <span className="text-xs font-normal text-zinc-400">
                At least 8 characters, with a letter and a number.
              </span>
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary mt-1 h-11">
              {pending && <Spinner />}
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
