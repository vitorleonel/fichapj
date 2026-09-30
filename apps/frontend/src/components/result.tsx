import {
  Briefcase,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Printer,
  SearchX,
  Store,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { Socios } from "@/components/socios";
import { Chip, Field, Panel, Resolved, type Tone } from "@/components/ui";
import { formatCnpj } from "@/lib/cnpj";
import {
  companyMark,
  foreignCountry,
  formatCnae,
  formatCurrency,
  formatDate,
  formatPhone,
  formatPostalCode,
  titleCase,
  yearsSince,
} from "@/lib/format";
import {
  type Company,
  type Described,
  lookupCompany,
} from "@/services/company";

type Estabelecimento = Company["estabelecimento"];

/** Green while it is open for business, red once the Receita has closed it. */
function situacaoTone(descricao?: string | null): Tone {
  switch (descricao?.toLowerCase()) {
    case "ativa":
      return "good";
    case "suspensa":
      return "warn";
    case "inapta":
    case "nula":
      return "bad";
    default:
      return "neutral";
  }
}

/** The wash behind the header, in the colour of the standing it reports. */
const WASHES: Record<Tone, string> = {
  good: "bg-emerald-400/18",
  warn: "bg-amber-400/18",
  bad: "bg-rose-400/18",
  neutral: "bg-zinc-300/25",
  outline: "bg-zinc-300/25",
};

/** The dump pads the complement with runs of spaces to line its columns up. */
const tidy = (value?: string | null) =>
  value?.replace(/\s+/g, " ").trim() ?? "";

/** A value from the dump, with the way to copy it when there is one. */
function CopyValue({ value, label }: { value: string; label: string }) {
  if (!value) return <>—</>;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="break-all">{value}</span>
      <CopyButton value={value} label={label} />
    </span>
  );
}

/** One CNAE, the code in the mono face so the numbers line up down the column. */
function Cnae({ item }: { item: Described }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="font-mono text-sm text-zinc-500 tabular-nums sm:w-20 sm:shrink-0 sm:pt-0.5">
        {formatCnae(item.codigo)}
      </span>
      <span className="text-sm text-pretty text-zinc-900">
        {item.descricao ?? "Descrição não catalogada"}
      </span>
    </div>
  );
}

function ContactLine({
  icon,
  href,
  copy,
  children,
}: {
  icon: ReactNode;
  href: string;
  copy?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500"
        aria-hidden="true"
      >
        {icon}
      </span>
      <a
        href={href}
        className="min-w-0 flex-1 truncate rounded-md text-sm text-zinc-900 transition outline-hidden hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-900/25"
      >
        {children}
      </a>
      {copy && <CopyButton value={copy} />}
    </div>
  );
}

/** Who the company is, at a glance: name, standing, and where this unit sits. */
function Identity({
  empresa,
  estab,
}: {
  empresa: Company["empresa"];
  estab: Estabelecimento;
}) {
  const razao = empresa.razao_social ?? "";
  const fantasia = tidy(estab.nome_fantasia);
  const city = [titleCase(estab.municipio?.descricao ?? ""), estab.uf]
    .filter(Boolean)
    .join(" - ");
  const situacao = estab.situacao_cadastral?.descricao;

  // A date only earns its place when it says something: a live company was already
  // dated by its opening, on the panel below.
  const closed = !!situacao && situacao.toLowerCase() !== "ativa";
  const closedOn = closed ? formatDate(estab.data_situacao_cadastral) : "";

  const tone = situacaoTone(situacao);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-lift">
      {/* A wash in the colour of the standing, so the answer to "is this company alive"
          is the first thing the page says. */}
      <div
        className={`pointer-events-none absolute -top-28 -right-16 size-72 rounded-full blur-3xl sm:-top-40 sm:-right-24 sm:size-[26rem] ${WASHES[tone]}`}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-start sm:gap-7 sm:p-9">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-zinc-900 text-xl font-semibold text-white shadow-sm"
          aria-hidden="true"
        >
          {companyMark(razao)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone={tone} dot>
              {situacao ?? "Situação não informada"}
              {closedOn && (
                <span className="ml-1.5 font-normal opacity-70">
                  em {closedOn}
                </span>
              )}
            </Chip>
            <Chip>{estab.identificador_matriz_filial?.descricao}</Chip>
            {city && <Chip>{city}</Chip>}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-balance text-zinc-900 sm:text-5xl">
            {titleCase(razao)}
          </h1>

          {fantasia && fantasia.toUpperCase() !== razao.toUpperCase() && (
            <p className="mt-2 text-lg text-zinc-500">{titleCase(fantasia)}</p>
          )}

          <p className="mt-5 inline-flex items-center gap-1.5 text-zinc-900">
            <span className="font-mono text-sm tracking-wide">
              {formatCnpj(estab.cnpj)}
            </span>
            <CopyButton value={formatCnpj(estab.cnpj)} label="o CNPJ" />
          </p>
        </div>
      </div>
    </section>
  );
}

/** Nothing to show, for one of the two reasons the API has. */
function Unavailable({ status, cnpj }: { status: number; cnpj: string }) {
  const missing = status === 404;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white px-7 py-12 text-center shadow-xs">
      <span
        className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-100 text-zinc-500"
        aria-hidden="true"
      >
        {missing ? (
          <SearchX className="size-5" />
        ) : (
          <WifiOff className="size-5" />
        )}
      </span>

      <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
        {missing
          ? "Nenhuma empresa com esse CNPJ"
          : "Não foi possível consultar agora"}
      </h1>

      <p className="mt-2 text-sm text-pretty text-zinc-600">
        {missing ? (
          <>
            A consulta não encontrou o{" "}
            <span className="font-mono">{formatCnpj(cnpj)}</span>. Confira os
            dígitos — um CNPJ tem 14 posições.
          </>
        ) : (
          "A consulta não respondeu. Tente de novo em instantes."
        )}
      </p>
    </div>
  );
}

export async function Result({ cnpj }: { cnpj: string }) {
  const result = await lookupCompany(cnpj);

  if (!result.ok) return <Unavailable status={result.status} cnpj={cnpj} />;

  const { empresa, estabelecimento: estab, socios = [] } = result.company;

  const principal = estab.cnae_fiscal_principal;
  const secundarias = estab.cnae_fiscal_secundaria ?? [];

  // Number on the same line as the street, the way an address is written down.
  const street = titleCase(
    [`${estab.tipo_logradouro} ${estab.logradouro}`.trim(), estab.numero]
      .filter(Boolean)
      .join(", "),
  );
  const complemento = titleCase(tidy(estab.complemento));
  const bairro = titleCase(tidy(estab.bairro));
  const municipio = titleCase(tidy(estab.municipio?.descricao));
  const postal = formatPostalCode(estab.cep);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [street, complemento, bairro, municipio, estab.uf, postal]
      .filter(Boolean)
      .join(", "),
  )}`;

  const email = estab.correio_eletronico?.trim().toLowerCase() ?? "";
  const phones = [
    formatPhone(estab.ddd_1, estab.telefone_1),
    formatPhone(estab.ddd_2, estab.telefone_2),
  ].filter(Boolean);
  const fax = formatPhone(estab.ddd_fax, estab.fax);

  const motivo = estab.motivo_situacao_cadastral?.descricao ?? "";
  const motivoRelevante =
    motivo !== "" && motivo.toUpperCase() !== "SEM MOTIVO";
  const especial = tidy(estab.situacao_especial);
  const pais = titleCase(foreignCountry(estab.pais?.descricao));
  const exterior = titleCase(tidy(estab.nome_cidade_exterior));
  const federativo = titleCase(tidy(empresa.ente_federativo));

  return (
    <div className="rise flex flex-col gap-6">
      <Identity empresa={empresa} estab={estab} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={<Building2 className="size-4" />} title="Empresa">
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Razão social" className="sm:col-span-2">
              <CopyValue
                value={titleCase(empresa.razao_social ?? "")}
                label="a razão social"
              />
            </Field>
            <Field label="Natureza jurídica">
              <Resolved value={empresa.natureza_juridica} />
            </Field>
            <Field label="Qualificação do responsável">
              <Resolved value={empresa.qualificacao_responsavel} />
            </Field>
            <Field label="Porte">
              <Resolved value={empresa.porte} />
            </Field>
            <Field label="Capital social">
              {formatCurrency(empresa.capital_social)}
            </Field>
            {federativo && <Field label="Ente federativo">{federativo}</Field>}
          </dl>
        </Panel>

        <Panel icon={<Store className="size-4" />} title="Estabelecimento">
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="CNPJ">
              <CopyValue value={formatCnpj(estab.cnpj)} label="o CNPJ" />
            </Field>
            <Field label="Tipo">
              <Resolved value={estab.identificador_matriz_filial} />
            </Field>
            <Field label="Situação cadastral">
              <Resolved value={estab.situacao_cadastral} />
            </Field>
            <Field label="Situação desde">
              {formatDate(estab.data_situacao_cadastral)}
            </Field>
            {motivoRelevante && (
              <Field label="Motivo da situação">
                <Resolved value={estab.motivo_situacao_cadastral} />
              </Field>
            )}
            {especial && (
              <Field label="Situação especial">
                {especial}
                {estab.data_situacao_especial && (
                  <span className="ml-2 text-zinc-500">
                    {formatDate(estab.data_situacao_especial)}
                  </span>
                )}
              </Field>
            )}
            <Field label="Início de atividade">
              {formatDate(estab.data_inicio_atividade)}
              {yearsSince(estab.data_inicio_atividade) && (
                <span className="ml-2 text-zinc-500">
                  {yearsSince(estab.data_inicio_atividade)}
                </span>
              )}
            </Field>
          </dl>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          icon={<MapPin className="size-4" />}
          title="Endereço"
          meta={
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 transition outline-hidden hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/25"
            >
              Ver no mapa
              <ExternalLink className="size-3.5" />
            </a>
          }
        >
          {/* Labelled like every other panel, so "Cxpst 109 Sala 367" says what it is
              instead of sitting in a block of lines to be guessed at. */}
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Logradouro" className="sm:col-span-2">
              {street}
            </Field>
            {complemento && (
              <Field label="Complemento" className="sm:col-span-2">
                {complemento}
              </Field>
            )}
            {bairro && <Field label="Bairro">{bairro}</Field>}
            <Field label="Município">{municipio}</Field>
            <Field label="UF">{estab.uf}</Field>
            <Field label="CEP">{postal}</Field>
            {exterior && <Field label="Cidade no exterior">{exterior}</Field>}
            {pais && <Field label="País">{pais}</Field>}
          </dl>
        </Panel>

        <Panel icon={<Phone className="size-4" />} title="Contato">
          {email || phones.length > 0 || fax ? (
            <div className="flex flex-col gap-3">
              {email && (
                <ContactLine
                  icon={<Mail className="size-4" />}
                  href={`mailto:${email}`}
                  copy={email}
                >
                  {email}
                </ContactLine>
              )}

              {phones.map((phone) => (
                <ContactLine
                  key={phone}
                  icon={<Phone className="size-4" />}
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  copy={phone}
                >
                  {phone}
                </ContactLine>
              ))}

              {fax && (
                <ContactLine
                  icon={<Printer className="size-4" />}
                  href={`tel:${fax.replace(/\D/g, "")}`}
                  copy={fax}
                >
                  {fax}
                </ContactLine>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              A Receita não publica telefone nem e-mail para este
              estabelecimento.
            </p>
          )}
        </Panel>
      </div>

      <Panel
        icon={<Briefcase className="size-4" />}
        title="Atividades"
        meta={
          <span className="text-sm text-zinc-500 tabular-nums">
            {secundarias.length + (principal ? 1 : 0)} CNAEs
          </span>
        }
      >
        {/* A rule down the side is the whole emphasis: same type as the rest, so the eye
            reads one list with the one that answers "what does this company do" marked.
            It sits out in the panel's own padding, so the code below still lines up with
            the codes of the secondary list. */}
        <div className="-ml-4 border-l-2 border-zinc-900 pl-3.5">
          <p className="text-xs text-zinc-500">Principal</p>
          <div className="mt-2">
            {principal ? (
              <Cnae item={principal} />
            ) : (
              <span className="text-sm text-zinc-400">—</span>
            )}
          </div>
        </div>

        {secundarias.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-6">
            <p className="text-xs text-zinc-500">
              Secundárias{" "}
              <span className="tabular-nums">({secundarias.length})</span>
            </p>
            <div className="mt-3 grid gap-x-8 gap-y-3 lg:grid-cols-2">
              {secundarias.map((item) => (
                <Cnae key={item.codigo} item={item} />
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Socios socios={socios} />
    </div>
  );
}
