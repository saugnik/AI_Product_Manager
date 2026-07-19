import { Spinner } from "@/components/spinner";

export function ToolHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl dark:bg-brand-950/50">
          {emoji}
        </span>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        {subtitle}
      </p>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ResultPlaceholder({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
      {pending ? (
        <>
          <Spinner className="h-6 w-6 text-brand-500" />
          <span>Analyzing…</span>
        </>
      ) : (
        <>
          <span className="text-2xl opacity-60">✦</span>
          <span>The {label} will appear here.</span>
        </>
      )}
    </div>
  );
}
