"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** The button alone. Copying needs the browser, so this is the only piece that
 *  crosses to the client and the value stays a plain node the server renders. */
export function CopyButton({ value }: { value: string }) {
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
      aria-label={copied ? "Copiado" : `Copiar ${value}`}
      className="text-zinc-300 transition hover:text-zinc-900"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
