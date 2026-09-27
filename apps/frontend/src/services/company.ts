/** A code from the dump together with the description the API resolved for it. */
export type Described = { codigo: string; descricao: string | null };

/** The two halves the API answers with: the company and one of its establishments. */
export type Company = {
  empresa: {
    razao_social: string;
    natureza_juridica: Described;
    capital_social: string;
    porte: Described;
  };
  estabelecimento: {
    cnpj: string;
    nome_fantasia: string;
    situacao_cadastral: Described;
    data_inicio_atividade: string;
    cnae_fiscal_principal: Described;
    cnae_fiscal_secundaria: Described[];
    tipo_logradouro: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cep: string;
    uf: string;
    municipio: Described;
    ddd_1: string;
    telefone_1: string;
    correio_eletronico: string;
  };
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
 * The only place that knows how to reach the API. Runs on the server, so the
 * token never reaches the browser and there is no CORS to negotiate.
 */
export async function lookupCompany(cnpj: string): Promise<LookupResult> {
  const response = await fetch(`${required("API_URL")}/cnpj/${cnpj}`, {
    headers: { Authorization: required("API_TOKEN") },
    cache: "no-store",
  }).catch(() => null);

  if (!response) return { ok: false, status: 503 };
  if (!response.ok) return { ok: false, status: response.status };

  // An error page can arrive with a 200, so the body is not trusted to parse.
  const company = await response.json().catch(() => null);
  if (!company) return { ok: false, status: 502 };

  return { ok: true, company };
}
