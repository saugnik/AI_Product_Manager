import { LEVEL_STYLES } from "@/lib/assessments";

export function LevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null;
  const cls =
    LEVEL_STYLES[level] ??
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${cls}`}
    >
      {level.replace(/_/g, " ")}
    </span>
  );
}
