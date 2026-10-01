import { Users } from "lucide-react";

import { Chip, Field, Panel } from "@/components/ui";
import { foreignCountry, formatDate, initials, titleCase } from "@/lib/format";
import type { Socio } from "@/services/company";

/** What the dump writes for a partner no age band applies to — a company, not a person. */
const NAO_SE_APLICA = "Não se aplica";

function SocioCard({ socio }: { socio: Socio }) {
  const pais = foreignCountry(socio.pais?.descricao);
  const nome = titleCase(socio.nome_representante?.trim() ?? "");
  const faixa = socio.faixa_etaria?.descricao;

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300">
      <div className="flex items-start gap-3.5">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {initials(socio.nome_socio)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="leading-snug font-medium text-pretty text-zinc-900">
            {titleCase(socio.nome_socio)}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="outline">{socio.qualificacao_socio?.descricao}</Chip>
            <Chip>{socio.identificador_socio?.descricao}</Chip>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-zinc-100 pt-4">
        <Field label="Sócio desde">
          {formatDate(socio.data_entrada_sociedade)}
        </Field>

        {/* Only people carry a band, and "não se aplica" is a line that says nothing. */}
        {faixa && faixa !== NAO_SE_APLICA && (
          <Field label="Faixa etária">{faixa}</Field>
        )}

        {pais && <Field label="País">{pais}</Field>}
      </dl>

      {/* Only a foreign partner has one; the field is a placeholder on a Brazilian. */}
      {nome && (
        <div className="mt-4 rounded-xl bg-zinc-50 p-3.5">
          <p className="text-xs text-zinc-500">Representante legal</p>
          <p className="mt-1 text-sm text-zinc-900">{nome}</p>
          {socio.qualificacao_representante_legal?.descricao && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {socio.qualificacao_representante_legal.descricao}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function Socios({ socios }: { socios: Socio[] }) {
  const total = socios.length;

  return (
    <Panel
      icon={<Users className="size-4" />}
      title="Quadro societário"
      meta={
        total > 0 && (
          <span className="text-sm text-zinc-500 tabular-nums">
            {total} {total === 1 ? "sócio" : "sócios"}
          </span>
        )
      }
    >
      {total === 0 ? (
        <p className="text-sm text-zinc-500">
          A Receita não publica sócios para esta empresa — é o caso do MEI e do
          empresário individual, que não têm quadro societário.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {socios.map((socio) => (
            <SocioCard
              key={`${socio.nome_socio}-${socio.data_entrada_sociedade}`}
              socio={socio}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
