import type { Metadata } from "next";

import { CnpjForm } from "@/components/cnpj-form";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Spotlight } from "@/components/spotlight";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** The way in. Nothing to look up yet, so there is nothing here but the field. */
export default function Home() {
  // `body` is the column, so the hero takes what the footer leaves and the page is one
  // screen tall.
  return (
    <>
      <section className="relative flex flex-1 flex-col overflow-hidden">
        <div
          className="hero-grid pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div
          className="hero-glow pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <Spotlight />

        <Header className="relative" />

        <div className="relative flex flex-1 items-center justify-center px-6 py-10">
          <div className="hero-stagger w-full max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              Consulta de CNPJ
            </p>

            <h1 className="mt-6 text-[2.6rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance text-zinc-900 sm:text-6xl md:text-7xl">
              Saiba com quem você está negociando
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base text-balance text-zinc-600 sm:mt-7 sm:text-lg">
              Digite o CNPJ e veja se a empresa está ativa, quem são os sócios,
              onde fica e o que faz. Dados públicos e oficiais.
            </p>

            <div className="mx-auto mt-9 max-w-xl sm:mt-11">
              <CnpjForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
