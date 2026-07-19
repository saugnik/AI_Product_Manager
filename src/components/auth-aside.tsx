import Link from "next/link";

import { LogoMark } from "@/components/logo";
import { KIND_META, type AssessmentKind } from "@/lib/assessments";

export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl" />

      <Link href="/" className="relative inline-flex items-center gap-2.5">
        <LogoMark className="h-8 w-8 bg-white/15 shadow-none" />
        <span className="text-lg font-semibold tracking-tight text-white">MediFlow</span>
      </Link>

      <div className="relative">
        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          Clinical decisions,
          <br />
          faster and safer.
        </h2>
        <ul className="mt-8 flex flex-col gap-4">
          {(Object.keys(KIND_META) as AssessmentKind[]).map((kind) => {
            const meta = KIND_META[kind];
            return (
              <li key={kind} className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">{meta.emoji}</span>
                <div>
                  <p className="font-semibold">{meta.title}</p>
                  <p className="text-sm text-brand-100/80">{meta.blurb}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="relative text-xs text-brand-100/70">
        Decision support — not a diagnosis. Always reviewed by a clinician.
      </p>
    </aside>
  );
}
