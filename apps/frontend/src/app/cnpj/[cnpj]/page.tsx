import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Result } from "@/components/result";
import { ResultSkeleton } from "@/components/result-skeleton";
import { formatCnpj, isComplete, onlyAlnum } from "@/lib/cnpj";
import { formatDate, titleCase } from "@/lib/format";
import { isMissing } from "@/lib/lookup";
import { lookupCompany } from "@/services/company";

/**
 * What the page is called. Without this every one of the millions of cnpj addresses
 * carried the same title, which is the largest thing wrong with this page for a search
 * engine — larger than when the body arrives.
 *
 * It costs a lookup, but the same lookup the page then makes is memoized for the
 * request, so the API is asked once.
 */
export async function generateMetadata({
  params,
}: PageProps<"/cnpj/[cnpj]">): Promise<Metadata> {
  const cnpj = onlyAlnum((await params).cnpj);

  // Before the lookup, so half an address never costs one.
  if (!isComplete(cnpj)) return { title: "CNPJ não encontrado" };

  const result = await lookupCompany(cnpj);

  if (!result.ok) {
    return {
      title: isMissing(result)
        ? "CNPJ não encontrado"
        : "Consulta indisponível",
      // An unreachable API answers 200, and a stub is what gets indexed if a crawler
      // arrives during an outage.
      robots: { index: false },
    };
  }

  const { empresa, estabelecimento } = result.company;

  const cidade = [
    titleCase(estabelecimento.municipio?.descricao ?? ""),
    estabelecimento.uf,
  ]
    .filter(Boolean)
    .join(" - ");
  const desde = formatDate(estabelecimento.data_inicio_atividade);
  const situacao = estabelecimento.situacao_cadastral?.descricao;
  const natureza = titleCase(empresa.natureza_juridica?.descricao ?? "");

  const description = [
    situacao && `Situação cadastral: ${situacao}.`,
    natureza && `${natureza}${cidade ? `, em ${cidade}` : ""}.`,
    desde && `Início de atividade em ${desde}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${titleCase(empresa.razao_social ?? "")} — CNPJ ${formatCnpj(cnpj)}`,
    description,
    alternates: { canonical: `/cnpj/${cnpj}` },
  };
}

export default async function Page({ params }: PageProps<"/cnpj/[cnpj]">) {
  const segment = (await params).cnpj;
  const cnpj = onlyAlnum(segment);

  if (!isComplete(cnpj)) notFound();

  // One address per company: the punctuated spelling was a second URL carrying the same
  // content, with nothing to tell a search engine which of the two to keep.
  if (segment !== cnpj) permanentRedirect(`/cnpj/${cnpj}`);

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <Header search={cnpj} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-10 sm:py-12">
        <Suspense fallback={<ResultSkeleton />}>
          <Result cnpj={cnpj} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
