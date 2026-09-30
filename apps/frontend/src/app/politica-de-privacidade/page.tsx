import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Política de Privacidade — Ficha PJ",
};

export default function Page() {
  return (
    <>
      <Header />

      {/* Same container as the header, so the text starts under the mark. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14 sm:px-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-zinc-600">
            O texto desta página ainda está sendo escrito.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
