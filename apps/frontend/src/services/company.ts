import { connection } from "next/server";

/** A code from the dump together with the description the API resolved for it. */
export type Described = { codigo: string; descricao: string | null };

/**
 * One partner. The API leaves out the partner's and the representative's documents — the dump
 * masks the middle of both — so `identificador_socio` is what says whether this is a person or
 * a company.
 */
export type Socio = {
  identificador_socio: Described;
  nome_socio: string;
  qualificacao_socio: Described;
  data_entrada_sociedade: string;
  pais: Described;
  nome_representante: string;
  qualificacao_representante_legal: Described;
  faixa_etaria: Described;
};

/** The company, one of its establishments, and the partners of that company. */
export type Company = {
  empresa: {
    cnpj_basico: string;
    razao_social: string;
    natureza_juridica: Described;
    qualificacao_responsavel: Described;
    capital_social: string;
    porte: Described;
    ente_federativo: string;
  };
  estabelecimento: {
    cnpj: string;
    cnpj_basico: string;
    cnpj_ordem: string;
    cnpj_dv: string;
    identificador_matriz_filial: Described;
    nome_fantasia: string;
    situacao_cadastral: Described;
    data_situacao_cadastral: string;
    motivo_situacao_cadastral: Described;
    nome_cidade_exterior: string;
    pais: Described;
    data_inicio_atividade: string;
    cnae_fiscal_principal: Described;
    cnae_fiscal_secundaria: Described[];
    tipo_logradouro: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    uf: string;
    municipio: Described;
    ddd_1: string;
    telefone_1: string;
    ddd_2: string;
    telefone_2: string;
    ddd_fax: string;
    fax: string;
    correio_eletronico: string;
    situacao_especial: string;
    data_situacao_especial: string;
  };
  /** Absent from an API deployed before the partners were added to the answer. */
  socios?: Socio[];
};

export type LookupResult =
  | { ok: true; company: Company }
  | { ok: false; status: number };

/** A missing value is a deployment mistake, not an outage, so it throws. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);

  return value;
}

/**
 * The only place that knows how to reach the API. It runs on the server, so the
 * browser talks to Next and there is no CORS to negotiate.
 */
async function api(path: string, revalidate: number): Promise<Response | null> {
  try {
    return await fetch(`${required("API_URL")}${path}`, {
      next: { revalidate },
    });
  } catch (error) {
    // Swallowed for the caller, logged for CloudWatch: without this there is nothing
    // to go on when the answer is a bare 503.
    console.error(`GET ${path} failed`, error);

    return null;
  }
}

export async function lookupCompany(cnpj: string): Promise<LookupResult> {
  const response = await api(`/cnpj/${cnpj}`, 60);

  if (!response) return { ok: false, status: 503 };
  if (!response.ok) return { ok: false, status: response.status };

  // An error page can arrive with a 200, so the body is not trusted to parse.
  const company = await response.json().catch(() => null);
  if (!company) return { ok: false, status: 502 };

  return { ok: true, company };
}

/**
 * The number in the bar. It lives in the Worker's environment, so it has to be read on
 * the request: a page prerendered at build time ships whatever number the machine that
 * built it happened to have, which is how the home came to show `42` from the local
 * `.env.local` while the cnpj page showed the deployed figure.
 */
export async function countActive(): Promise<number> {
  await connection();

  const count = Number(required("ACTIVE_COUNT"));
  if (!Number.isFinite(count)) throw new Error("ACTIVE_COUNT is not a number");

  return count;
}
