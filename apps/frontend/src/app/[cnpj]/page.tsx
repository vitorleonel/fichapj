import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Result } from "@/components/result";
import { formatCnpj, isComplete, onlyAlnum } from "@/lib/cnpj";
import { formatDate, titleCase } from "@/lib/format";
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
}: PageProps<"/[cnpj]">): Promise<Metadata> {
  const cnpj = onlyAlnum((await params).cnpj);
  const result = await lookupCompany(cnpj);

  if (!result.ok) return { title: "CNPJ não encontrado — Ficha PJ" };

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
  };
}

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

      {/* No suspense boundary: the metadata above already waits on the same lookup before
          the head can be written, so nothing would be gained by holding the body back —
          only a page whose contents arrive as a script instead of as markup. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-10 sm:py-12">
        <Result cnpj={cnpj} />
      </main>

      <Footer />
    </div>
  );
}
