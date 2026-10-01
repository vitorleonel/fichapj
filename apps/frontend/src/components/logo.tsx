import { Building2 } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-900/25"
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-white"
        aria-hidden="true"
      >
        <Building2 className="size-4" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-zinc-900">
        Ficha PJ
      </span>
    </Link>
  );
}
