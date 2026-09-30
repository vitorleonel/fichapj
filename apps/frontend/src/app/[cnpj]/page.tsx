import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Result } from "@/components/result";
import { ResultSkeleton } from "@/components/skeleton";
import { isComplete, onlyAlnum } from "@/lib/cnpj";

export default async function Page({ params }: PageProps<"/[cnpj]">) {
  const segment = (await params).cnpj;
  const cnpj = onlyAlnum(segment);

  // Punctuation in the address is the reader's business, but half a cnpj is not a page
  // we have. A second segment never reaches here — no route matches it.
  if (!isComplete(segment)) notFound();

  return (
    // The tint is what turns the panels into cards; on white they were only outlined.
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <Header search={cnpj} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-10 sm:py-12">
        {/* The lookup waits on the API and the header does not, so the shell paints first. */}
        <Suspense fallback={<ResultSkeleton />}>
          <Result cnpj={cnpj} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
