import type { ReactNode } from "react";

import { formatCnpj } from "@/lib/cnpj";
import {
  formatCnae,
  formatCurrency,
  formatDate,
  formatPostalCode,
} from "@/lib/format";
import { type Described, lookupCompany } from "@/services/company";

function Shell({ children }: { children: ReactNode }) {
  return (
    <section
      id="result"
      className="scroll-mt-10 border-t border-zinc-100 bg-zinc-50/60"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-t border-zinc-200/70 py-4 sm:flex-row sm:gap-6">
      <dt className="text-sm text-zinc-500 sm:w-56 sm:shrink-0">{label}</dt>
      <dd className="text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

/** The CNAE code in the mono face, so the numbers line up down the column. */
function CnaeList({ items }: { items: Described[] }) {
  if (items.length === 0) return "—";

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.codigo} className="flex gap-3">
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {formatCnae(item.codigo)}
          </span>
          <span>{item.descricao}</span>
        </li>
      ))}
    </ul>
  );
}

export async function Result({ cnpj }: { cnpj: string }) {
  const result = await lookupCompany(cnpj);

  if (!result.ok) {
    return (
      <Shell>
        {result.status === 404 ? (
          <p className="text-zinc-600">
            Nenhuma empresa com o CNPJ <strong>{formatCnpj(cnpj)}</strong>.
          </p>
        ) : (
          <p className="text-zinc-600">
            Não foi possível consultar agora. Tente de novo em instantes.
          </p>
        )}
      </Shell>
    );
  }

  const { empresa, estabelecimento: estab } = result.company;
  const principal = estab.cnae_fiscal_principal;

  const address = [
    `${estab.tipo_logradouro} ${estab.logradouro}, ${estab.numero}`.trim(),
    estab.bairro,
    [estab.municipio?.descricao, estab.uf].filter(Boolean).join(" - "),
    formatPostalCode(estab.cep),
  ].filter(Boolean);

  const phone = estab.telefone_1
    ? `(${estab.ddd_1}) ${estab.telefone_1}`
    : null;

  return (
    <Shell>
      <p className="text-sm text-zinc-500">CNPJ {formatCnpj(estab.cnpj)}</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
        {estab.nome_fantasia || empresa.razao_social}
      </h2>
      {estab.nome_fantasia && (
        <p className="mt-1 text-zinc-600">{empresa.razao_social}</p>
      )}

      <dl className="mt-10">
        <Row label="Situação cadastral">
          {estab.situacao_cadastral?.descricao}
        </Row>
        <Row label="Início de atividade">
          {formatDate(estab.data_inicio_atividade)}
        </Row>
        <Row label="Natureza jurídica">
          {empresa.natureza_juridica?.descricao}
        </Row>
        <Row label="Porte">{empresa.porte?.descricao}</Row>
        <Row label="Capital social">
          {formatCurrency(empresa.capital_social)}
        </Row>
        <Row label="Atividade principal">
          <CnaeList items={principal ? [principal] : []} />
        </Row>
        <Row label="Atividades secundárias">
          <CnaeList items={estab.cnae_fiscal_secundaria ?? []} />
        </Row>
        <Row label="Endereço">{address.join(" · ")}</Row>
        <Row label="Contato">
          {[estab.correio_eletronico, phone].filter(Boolean).join(" · ") || "—"}
        </Row>
      </dl>
    </Shell>
  );
}
