"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatCnpj, isComplete, onlyDigits } from "@/lib/cnpj";

export function CnpjForm({ initialCnpj }: { initialCnpj: string }) {
  const router = useRouter();
  const [value, setValue] = useState(formatCnpj(initialCnpj));
  const ready = isComplete(value);

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;

        // The hero stays put, so let ScrollTo do the only scrolling.
        router.push(`/${onlyDigits(value)}`, { scroll: false });
      }}
    >
      <input
        aria-label="CNPJ"
        autoComplete="off"
        inputMode="numeric"
        placeholder="00.000.000/0000-00"
        value={value}
        onChange={(event) => setValue(formatCnpj(event.target.value))}
        className="h-14 w-full rounded-xl border border-zinc-200 bg-white pr-16 pl-5 font-mono text-base tracking-wide text-zinc-900 shadow-xs transition outline-hidden placeholder:text-zinc-300 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-900/5"
      />
      <button
        type="submit"
        disabled={!ready}
        aria-label="Consultar"
        className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:bg-transparent disabled:text-zinc-300"
      >
        <ArrowRight className="size-5" />
      </button>
    </form>
  );
}
