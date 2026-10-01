import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { LegalPage, Section } from "@/components/legal";

export const metadata: Metadata = {
  title: "API pública",
  description:
    "A mesma consulta do site, em JSON: uma rota, sem chave e sem cadastro. O formato da resposta, os campos, os erros e o limite de uso.",
  alternates: { canonical: "/api" },
};

const REQUEST = `curl "https://api.fichapj.com.br/cnpj/19131243000197"`;

const RESPONSE = `{
  "empresa": {
    "cnpj_basico": "…",
    "razao_social": "…",
    "porte": { "codigo": "05", "descricao": "Demais" }
  },
  "estabelecimento": {
    "cnpj": "…",
    "situacao_cadastral": { "codigo": "02", "descricao": "Ativa" },
    "municipio": { "codigo": "7107", "descricao": "SAO PAULO" },
    "uf": "…"
  },
  "socios": [
    {
      "nome_socio": "…",
      "identificador_socio": { "codigo": "2", "descricao": "Pessoa física" },
      "qualificacao_socio": { "codigo": "49", "descricao": "Sócio-Administrador" }
    }
  ]
}`;

/** The `tipo` of a field, as the reader will meet it in the JSON. */
type Tipo = "texto" | "data" | "código" | "lista";

type Campo = [nome: string, tipo: Tipo, oQue: string];

/**
 * Every field the answer carries, grouped by what the reader is looking for — the dump's own
 * order puts a phone number next to a company name. Data and not prose: it is one long table,
 * and each field gets one line.
 */
const FIELDS: [objeto: string, grupos: [titulo: string, campos: Campo[]][]][] =
  [
    [
      "empresa",
      [
        [
          "A empresa",
          [
            [
              "cnpj_basico",
              "texto",
              "As oito primeiras posições do CNPJ. A matriz e todas as filiais trazem o mesmo.",
            ],
            ["razao_social", "texto", "O nome da empresa, em maiúsculas."],
            [
              "natureza_juridica",
              "código",
              "A forma jurídica: limitada, sociedade anônima, associação.",
            ],
          ],
        ],
        [
          "Enquadramento",
          [
            ["porte", "código", "Microempresa, pequeno porte ou demais."],
            [
              "capital_social",
              "texto",
              `Como o dump escreve: "1000,00" — ponto no milhar, vírgula no decimal.`,
            ],
            [
              "qualificacao_responsavel",
              "código",
              "Quem responde pela empresa na Receita.",
            ],
            [
              "ente_federativo",
              "texto",
              "O nome do ente, e só em órgão público. Vazio numa empresa.",
            ],
          ],
        ],
      ],
    ],
    [
      "estabelecimento",
      [
        [
          "Identificação",
          [
            ["cnpj", "texto", "As 14 posições, sem pontuação."],
            ["cnpj_basico", "texto", "As oito primeiras."],
            [
              "cnpj_ordem",
              "texto",
              "As quatro seguintes, que separam as filiais.",
            ],
            ["cnpj_dv", "texto", "Os dois dígitos verificadores."],
            ["identificador_matriz_filial", "código", "Matriz ou filial."],
            [
              "nome_fantasia",
              "texto",
              "O nome de fachada. Vazio em quem não tem.",
            ],
          ],
        ],
        [
          "Situação",
          [
            [
              "situacao_cadastral",
              "código",
              "Ativa, suspensa, inapta, baixada ou nula.",
            ],
            [
              "data_situacao_cadastral",
              "data",
              "Quando a situação passou a valer.",
            ],
            [
              "motivo_situacao_cadastral",
              "código",
              "A razão da situação, e só fora de ativa.",
            ],
            [
              "situacao_especial",
              "texto",
              "Uma anotação da Receita fora da situação cadastral. Vazio na maioria.",
            ],
            ["data_situacao_especial", "data", "Quando a anotação foi feita."],
          ],
        ],
        [
          "Atividade",
          [
            ["cnae_fiscal_principal", "código", "A atividade principal."],
            [
              "cnae_fiscal_secundaria",
              "lista",
              "As secundárias, na ordem do dump. Vazia quando não há.",
            ],
            [
              "data_inicio_atividade",
              "data",
              "Quando a empresa começou a operar.",
            ],
          ],
        ],
        [
          "Endereço",
          [
            [
              "tipo_logradouro",
              "texto",
              "RUA, AVENIDA, TRAVESSA — sem o nome.",
            ],
            ["logradouro", "texto", "O nome da rua, em maiúsculas."],
            ["numero", "texto", `Pode vir "S/N".`],
            ["complemento", "texto", "Sala, andar, bloco."],
            ["bairro", "texto", "Em maiúsculas."],
            ["cep", "texto", "Oito dígitos, sem traço."],
            [
              "municipio",
              "código",
              "O código da Receita, que não é o do IBGE.",
            ],
            ["uf", "texto", "A sigla do estado."],
            ["pais", "código", "O vazio é resolvido para o Brasil."],
            [
              "nome_cidade_exterior",
              "texto",
              "A cidade, e só num endereço fora do Brasil.",
            ],
          ],
        ],
        [
          "Contato",
          [
            ["ddd_1", "texto", "O DDD do primeiro telefone."],
            ["telefone_1", "texto", "O número, só dígitos."],
            ["ddd_2", "texto", "O DDD do segundo telefone."],
            ["telefone_2", "texto", "O número do segundo, só dígitos."],
            ["ddd_fax", "texto", "O DDD do fax."],
            ["fax", "texto", "O número do fax. Quase sempre vazio."],
            ["correio_eletronico", "texto", "O e-mail de contato."],
          ],
        ],
      ],
    ],
    [
      "socios",
      [
        [
          "O sócio",
          [
            [
              "identificador_socio",
              "código",
              "Pessoa física, pessoa jurídica ou estrangeiro — o tipo de sócio, já que o documento dele não vem.",
            ],
            ["nome_socio", "texto", "O nome da pessoa ou a razão social."],
            [
              "qualificacao_socio",
              "código",
              "Sócio-administrador, sócio, titular.",
            ],
            ["data_entrada_sociedade", "data", "Quando entrou na sociedade."],
            [
              "faixa_etaria",
              "código",
              `Só para pessoa física — numa empresa, "Não se aplica".`,
            ],
            [
              "pais",
              "código",
              "Só o sócio estrangeiro tem outro: o vazio é resolvido para o Brasil.",
            ],
          ],
        ],
        [
          "Representante legal",
          [
            [
              "nome_representante",
              "texto",
              "Quem representa o sócio, quando ele é empresa ou estrangeiro.",
            ],
            [
              "qualificacao_representante_legal",
              "código",
              "A qualificação de quem representa.",
            ],
          ],
        ],
      ],
    ],
  ];

/**
 * One field per row, so the eye can run down the names and stop at the one it wants.
 *
 * The name column is a fixed width and not `max-content`: every list in the section then
 * starts its description at the same x, and the eye keeps one column down the whole page.
 */
function Fields({ campos }: { campos: Campo[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[19rem_1fr]">
      {campos.map(([nome, tipo, oQue]) => (
        <Fragment key={nome}>
          <dt className="flex items-baseline gap-2">
            <code>{nome}</code>
            <span className="text-[0.7rem] tracking-wide text-zinc-400 uppercase">
              {tipo}
            </span>
          </dt>
          <dd>{oQue}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** A `pre` and not a `pre > code`: the Section around it dresses every `code` for prose. */
function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100">
      {children}
    </pre>
  );
}

export default function Page() {
  return (
    <LegalPage title="API pública" updated="1º de outubro de 2026">
      <Section title="O que é">
        <p>
          A mesma consulta deste site, em JSON. Uma rota, sem chave, sem
          cadastro e sem cobrança. Os dados são os mesmos: a base aberta do CNPJ
          que a Receita Federal publica.
        </p>
      </Section>

      <Section title="A rota">
        <p>
          <code>GET https://api.fichapj.com.br/cnpj/&lt;cnpj&gt;</code> — o CNPJ
          em 14 posições, sem pontuação, em maiúsculas ou minúsculas. Sem os
          pontos, a barra e o traço: <code>19.131.243/0001-97</code> responde{" "}
          <code>400</code>.
        </p>
        <Code>{REQUEST}</Code>
      </Section>

      <Section title="A resposta">
        <p>
          Três chaves: <code>empresa</code> (uma por CNPJ raiz),{" "}
          <code>estabelecimento</code> (o endereço consultado) e{" "}
          <code>socios</code> (o quadro societário, ou uma lista vazia quando
          não há — MEI e empresário individual não têm sócios).
        </p>
        <Code>{RESPONSE}</Code>
        <p>
          Os nomes dos campos são os do layout da Receita Federal. Todo campo
          que no dump é um código volta como{" "}
          <code>{`{ "codigo", "descricao" }`}</code>, já resolvido contra as
          tabelas da Receita — e um código sem linha na tabela volta com{" "}
          <code>descricao</code> nulo, sem sumir da resposta.
        </p>
      </Section>

      <Section title="Os campos">
        <p>
          Quatro tipos. <code>texto</code> é a string como o dump a escreve — em
          maiúsculas quando é nome, rua ou bairro. <code>data</code> é{" "}
          <code>AAAAMMDD</code>, sem separador. <code>código</code> é o par
          acima, e <code>lista</code> é uma lista dele.
        </p>

        {FIELDS.map(([objeto, grupos]) => (
          <div key={objeto} className="flex flex-col gap-5">
            <h3 className="font-mono text-sm font-semibold text-zinc-900">
              {objeto}
            </h3>

            {grupos.map(([titulo, campos]) => (
              <div key={titulo} className="flex flex-col gap-2">
                <h4 className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                  {titulo}
                </h4>
                <Fields campos={campos} />
              </div>
            ))}
          </div>
        ))}

        <p>
          Dois dados da Receita não saem daqui. O CPF ou CNPJ do sócio e do
          representante legal, que ela já publica com o meio em asteriscos — e
          mesmo assim fica de fora. E a opção pelo Simples Nacional e pelo MEI,
          que vem num arquivo à parte e esta API ainda não devolve.
        </p>
      </Section>

      <Section title="Erros">
        <p>
          O corpo é sempre <code>{`{ "message": "..." }`}</code>.
        </p>
        <ul className="flex flex-col gap-2">
          <li>
            <code>400</code> — o CNPJ não tem o formato de 14 posições.
          </li>
          <li>
            <code>404</code> — CNPJ válido que não está na base. Vale tanto para
            empresa que não existe quanto para a que ficou de fora do dump.
          </li>
          <li>
            <code>429</code> — passou do limite abaixo. Espere e repita.
          </li>
          <li>
            <code>5xx</code> — erro nosso. Repita mais tarde.
          </li>
        </ul>
      </Section>

      <Section title="Limites">
        <p>
          Dez requisições por segundo, com picos de vinte. O teto é um só para
          todo mundo — este site entra na mesma fila —, então uma varredura em
          massa responde <code>429</code> para os outros. Se você precisa da
          base inteira, baixe direto da Receita Federal: ela é pública.
        </p>
        <p>
          A API não manda cabeçalhos CORS, então chame do seu servidor. Do
          navegador, uma página de outro domínio não consegue ler a resposta.
        </p>
      </Section>

      <Section title="Os dados">
        <p>
          A base é uma fotografia, não um espelho: uma mudança feita hoje só
          aparece na publicação seguinte da Receita, o que pode levar semanas. É
          a mesma ressalva dos{" "}
          <Link
            href="/termos-de-uso"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900"
          >
            Termos de Uso
          </Link>{" "}
          — os dados vêm como vieram, sem conferência nossa.
        </p>
      </Section>
    </LegalPage>
  );
}
