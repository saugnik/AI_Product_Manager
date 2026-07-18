import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single server-side auth gate for every /dashboard/* route.
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-black/[.08] bg-white/90 backdrop-blur dark:border-white/[.145] dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              MediFlow
            </Link>
            <DashboardNav />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
              {session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
