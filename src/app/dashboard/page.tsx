import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KIND_META, type AssessmentKind } from "@/lib/assessments";
import { LevelBadge } from "@/components/level-badge";

export default async function DashboardHome() {
  const session = await auth();
  const userId = session!.user.id;

  const recent = await prisma.assessment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      kind: true,
      label: true,
      patientName: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome{session!.user.name ? `, ${session!.user.name.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Three AI assistants for the front line of care. Pick a tool to begin.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(Object.keys(KIND_META) as AssessmentKind[]).map((kind) => {
            const meta = KIND_META[kind];
            return (
              <Link
                key={kind}
                href={meta.href}
                className="group rounded-2xl border border-black/[.08] bg-white p-5 transition-colors hover:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-zinc-600"
              >
                <div className="text-3xl">{meta.emoji}</div>
                <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
                  {meta.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {meta.blurb}
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No assessments yet. Run a tool above and it will show up here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/[.06] overflow-hidden rounded-xl border border-black/[.08] bg-white dark:divide-white/[.08] dark:border-white/[.145] dark:bg-zinc-950">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl" aria-hidden>
                  {KIND_META[a.kind as AssessmentKind].emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {KIND_META[a.kind as AssessmentKind].title}
                    {a.patientName ? (
                      <span className="text-zinc-400"> · {a.patientName}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {a.createdAt.toLocaleString()}
                  </p>
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
