import type { ReactNode } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

/** The shell both documents share: same bar, same column, same measure. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14 sm:px-10">
        <article className="max-w-prose">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Última atualização: {updated}
          </p>

          <div className="mt-10 flex flex-col gap-8">{children}</div>
        </article>
      </main>

      <Footer />
    </>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-zinc-700">
        {children}
      </div>
    </section>
  );
}
