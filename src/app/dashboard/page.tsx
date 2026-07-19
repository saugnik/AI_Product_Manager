import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KIND_META, type AssessmentKind } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";

export default async function DashboardHome() {
  const session = await auth();
  const userId = session!.user.id;

  const [recent, total, emergencies] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, kind: true, label: true, patientName: true, createdAt: true },
    }),
    prisma.assessment.count({ where: { userId } }),
    prisma.assessment.count({
      where: { userId, label: { in: ["EMERGENCY", "HIGH"] } },
    }),
  ]);

  const stats = [
    { label: "Assessments run", value: total },
    { label: "High-priority flags", value: emergencies },
    { label: "Tools available", value: 3 },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome{session!.user.name ? `, ${session!.user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Three AI assistants for the front line of care. Pick a tool to begin.
        </p>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {s.value}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section>
        <h2 className="eyebrow">Tools</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(Object.keys(KIND_META) as AssessmentKind[]).map((kind) => {
            const meta = KIND_META[kind];
            return (
              <Link
                key={kind}
                href={meta.href}
                className="card group p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:hover:border-brand-800"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-950/50">
                  {meta.emoji}
                </div>
                <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
                  {meta.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {meta.blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  Open
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* History */}
      <section>
        <h2 className="eyebrow">Recent activity</h2>
        {recent.length === 0 ? (
          <div className="card mt-3 p-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No assessments yet. Run a tool above and it will show up here.
            </p>
          </div>
        ) : (
          <ul className="card mt-3 divide-y divide-zinc-200/70 overflow-hidden p-0 dark:divide-zinc-800/70">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg dark:bg-brand-950/50" aria-hidden>
                  {KIND_META[a.kind as AssessmentKind].emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {KIND_META[a.kind as AssessmentKind].title}
                    {a.patientName ? (
                      <span className="font-normal text-zinc-400"> · {a.patientName}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-400">{a.createdAt.toLocaleString()}</p>
                </div>
                <LevelBadge level={a.label} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
