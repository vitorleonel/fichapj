import { SearchX } from "lucide-react";

import { CnpjForm } from "@/components/cnpj-form";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

/**
 * Every dead end lands here, and Next answers it with a real 404 and its own noindex —
 * which against 10^14 possible cnpjs is the difference between a directory and a spam farm.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center px-6 py-16 sm:px-10 sm:py-24">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white px-7 py-12 text-center shadow-xs">
          <span
            className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500"
            aria-hidden="true"
          >
            <SearchX className="size-5" />
          </span>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
            Não encontramos essa página
          </h1>

          <p className="mt-2 text-sm text-pretty text-zinc-600">
            Confira o endereço. Se você buscou um CNPJ, ele tem 14 posições — e
            o da empresa precisa existir na base da Receita.
          </p>

          <div className="mt-8 text-left">
            <CnpjForm size="sm" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
