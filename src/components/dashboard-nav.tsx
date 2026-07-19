"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { KIND_META } from "@/lib/assessments";

const links = [
  { href: "/dashboard", label: "Overview", emoji: "🏠" },
  { href: KIND_META.TRIAGE.href, label: KIND_META.TRIAGE.title, emoji: KIND_META.TRIAGE.emoji },
  { href: KIND_META.SCRIBE.href, label: KIND_META.SCRIBE.title, emoji: KIND_META.SCRIBE.emoji },
  { href: KIND_META.MEDICATION.href, label: KIND_META.MEDICATION.title, emoji: KIND_META.MEDICATION.emoji },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((link) => {
        const active =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-600 text-white shadow-sm shadow-brand-600/25"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70"
            }`}
          >
            <span aria-hidden>{link.emoji}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
