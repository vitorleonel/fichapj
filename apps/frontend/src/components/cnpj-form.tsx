"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { formatCnpj, isComplete, onlyAlnum } from "@/lib/cnpj";

/** Two sizes: the field the home is built around, and the one the header keeps. */
const SIZES = {
  lg: {
    box: "h-16 rounded-2xl pr-1.5 pl-5",
    input: "text-base",
    button: "h-12 rounded-xl px-5",
  },
  sm: {
    box: "h-11 rounded-xl pr-1 pl-3.5",
    input: "text-sm",
    button: "h-9 rounded-lg px-4",
  },
} as const;

/**
 * The one thing to do here. The field is outlined rather than filled, so it reads as
 * somewhere to type without the grey that would make it look switched off, and the
 * button rides inside it.
 */
export function CnpjForm({
  initialCnpj = "",
  size = "lg",
}: {
  initialCnpj?: string;
  size?: keyof typeof SIZES;
}) {
  const router = useRouter();
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(formatCnpj(initialCnpj));
  const ready = isComplete(value);
  const style = SIZES[size];

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        // The button stays dark whatever is in the field, so a click before the cnpj is
        // whole has to answer with something: the cursor, where the rest of it goes.
        if (!ready) {
          field.current?.focus();
          return;
        }

        router.push(`/cnpj/${onlyAlnum(value)}`);
      }}
    >
      <div
        className={`flex items-center gap-2 border border-zinc-300 bg-white shadow-sm transition focus-within:border-zinc-400 focus-within:ring-4 focus-within:ring-zinc-900/5 ${style.box}`}
      >
        <input
          ref={field}
          aria-label="CNPJ"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="00.000.000/0000-00"
          value={value}
          onChange={(event) => setValue(formatCnpj(event.target.value))}
          className={`min-w-0 flex-1 bg-transparent font-mono tracking-wide text-zinc-900 outline-hidden placeholder:text-zinc-400 ${style.input}`}
        />

        <button
          type="submit"
          className={`shrink-0 bg-zinc-900 text-sm font-medium text-white transition outline-hidden hover:bg-zinc-800 focus-visible:ring-4 focus-visible:ring-zinc-900/25 ${style.button}`}
        >
          Consultar
        </button>
      </div>
    </form>
  );
}
