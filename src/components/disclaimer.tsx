export function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="mt-4 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      <span aria-hidden>⚠️</span>
      <span>
        {text ??
          "Decision support only — not a diagnosis. Always review with a licensed clinician."}
      </span>
    </p>
  );
}
