/**
 * The type scale the app pages are built on. Three steps, and nothing in between — a
 * fourth size is what makes a page look assembled rather than designed.
 *
 *   text-xs    a label over a value, or a chip
 *   text-sm    every value: fields, codes, addresses, contact, captions
 *   text-base  a section title
 *
 * Display sizes are the exception, and only on a page's own heading.
 */
import type { ReactNode } from "react";

import type { Described } from "@/services/company";

/** The chip tones. Full class strings, so Tailwind's scanner keeps them. */
const TONES = {
  outline: "bg-white text-zinc-900 ring-1 ring-zinc-300",
  neutral: "bg-zinc-100 text-zinc-600",
  good: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15",
  bad: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
} as const;

export type Tone = keyof typeof TONES;

/** The pip inside a chip, for a standing worth catching at a glance. */
const DOTS = {
  outline: "bg-zinc-900",
  neutral: "bg-zinc-400",
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
} as const;

export function Chip({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      {dot && (
        <span
          className={`mr-1.5 size-1.5 shrink-0 rounded-full ${DOTS[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * What the API resolved for a coded field. The code itself stays out of the page — the
 * description is the answer, and `49` next to `Sócio-Administrador` is a reader decoding
 * a table they did not ask for. A code the reference data does not know falls back to
 * itself, since that is then the only thing there is to say.
 */
export function Resolved({ value }: { value?: Described | null }) {
  if (!value) return <span className="text-zinc-400">—</span>;

  return <span>{value.descricao ?? value.codigo}</span>;
}

/** One label and its value. Always a direct child of a `dl`, which owns the columns. */
export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-sm leading-relaxed break-words text-zinc-900">
        {children}
      </dd>
    </div>
  );
}

export function Panel({
  icon,
  title,
  meta,
  children,
}: {
  icon?: ReactNode;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-xs sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-zinc-900">
          {icon && (
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          {title}
        </h2>
        {meta}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
