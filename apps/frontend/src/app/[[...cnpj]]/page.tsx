import { notFound } from "next/navigation";

import { Hero } from "@/components/hero";
import { Result } from "@/components/result";
import { ScrollTo } from "@/components/scroll-to";
import { isComplete, onlyDigits } from "@/lib/cnpj";

export default async function Page({ params }: PageProps<"/[[...cnpj]]">) {
  const segments = (await params).cnpj ?? [];
  const segment = segments.length === 1 ? segments[0] : "";
  const cnpj = onlyDigits(segment);
  const found = isComplete(segment);

  // `/` is this page with no result, `/{cnpj}` the same page with one. A
  // second segment, or one that is not a whole cnpj, is not a page we have.
  if (segments.length > 1 || (segments.length === 1 && !found)) notFound();

  return (
    <>
      <Hero cnpj={cnpj} />
      {found && <Result cnpj={cnpj} />}
      {found && <ScrollTo id="result" />}
    </>
  );
}
