"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * The button alone. Copying needs the browser, so this is the only piece that crosses
 * to the client and the value stays a plain node the server renders.
 *
 * It takes its colour from whatever it sits in, so the header and the panels can each
 * set their own without this knowing about either.
 */
export function CopyButton({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // The clipboard needs a secure origin, and a click here is not worth an error.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copiado" : `Copiar ${label ?? value}`}
      className={`grid size-6 shrink-0 place-items-center rounded-md transition outline-hidden hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-hidden ${copied ? "opacity-100 text-emerald-500" : "opacity-40"}`}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
