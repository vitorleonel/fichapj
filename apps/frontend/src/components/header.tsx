import { CnpjForm } from "@/components/cnpj-form";
import { Logo } from "@/components/logo";
import { countActive } from "@/services/company";

/**
 * The bar every page opens with, so the mark sits at the same height and the same
 * distance from the edge wherever you land. No rule under it — the page below says
 * where it starts.
 *
 * Pass `search` on a page that is already showing one cnpj: the field comes back, so
 * the next lookup starts from here instead of from the home.
 */
export async function Header({
  className = "",
  search,
}: {
  className?: string;
  search?: string;
}) {
  const active = await countActive();

  return (
    <header className={className}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5 sm:px-10 sm:py-4.5">
        <Logo />

        <p className="ml-auto text-sm text-zinc-500 md:order-3">
          <span className="font-medium text-zinc-900 tabular-nums">
            {active.toLocaleString("pt-BR")}
          </span>{" "}
          {active === 1 ? "empresa ativa" : "empresas ativas"}
        </p>

        {search !== undefined && (
          <div className="order-last w-full md:order-2 md:max-w-sm md:flex-1">
            {/* Keyed on the cnpj, or the field would keep the last one typed into it. */}
            <CnpjForm key={search} initialCnpj={search} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}
