import { Suspense } from "react";

import { ActiveCount } from "@/components/active-count";
import { CnpjForm } from "@/components/cnpj-form";
import { Logo } from "@/components/logo";
import { Spotlight } from "@/components/spotlight";

export function Hero({ cnpj }: { cnpj: string }) {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        className="hero-aurora pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
      </div>
      <div
        className="hero-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <Spotlight />

      <header className="relative">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 sm:px-10">
          <Logo />

          <Suspense fallback={null}>
            <ActiveCount />
          </Suspense>
        </div>
      </header>

      <div className="relative flex flex-1 items-center justify-center px-6 pb-24">
        <div className="hero-stagger w-full max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-6xl">
            Tudo sobre um CNPJ, em uma consulta
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-zinc-600">
            Razão social, sócios, situação cadastral, CNAE e endereço — direto
            da base aberta da Receita Federal.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <CnpjForm initialCnpj={cnpj} />
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Dados públicos. Sem cadastro.
          </p>
        </div>
      </div>
    </section>
  );
}
