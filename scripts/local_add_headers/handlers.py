# Column names per zip, in file order. The Receita publishes these files without a
# header row, so position is the only thing that identifies a column. The key is the
# zip name without the extension — the file inside carries a versioned name that
# changes every release. Digits are stripped on lookup, so one entry covers the ten
# numbered parts of Empresas, Socios and Estabelecimentos.
HEADERS = {
    "Empresas": [
        "cnpj_basico",
        "razao_social",
        "natureza_juridica",
        "qualificacao_responsavel",
        "capital_social",
        "porte",
        "ente_federativo",
    ],
    "Estabelecimentos": [
        "cnpj_basico",
        "cnpj_ordem",
        "cnpj_dv",
        "identificador_matriz_filial",
        "nome_fantasia",
        "situacao_cadastral",
        "data_situacao_cadastral",
        "motivo_situacao_cadastral",
        "nome_cidade_exterior",
        "pais",
        "data_inicio_atividade",
        "cnae_fiscal_principal",
        "cnae_fiscal_secundaria",
        "tipo_logradouro",
        "logradouro",
        "numero",
        "complemento",
        "bairro",
        "cep",
        "uf",
        "municipio",
        "ddd_1",
        "telefone_1",
        "ddd_2",
        "telefone_2",
        "ddd_fax",
        "fax",
        "correio_eletronico",
        "situacao_especial",
        "data_situacao_especial",
    ],
    "Simples": [
        "cnpj_basico",
        "opcao_simples",
        "data_opcao_simples",
        "data_exclusao_simples",
        "opcao_mei",
        "data_opcao_mei",
        "data_exclusao_mei",
    ],
    "Socios": [
        "cnpj_basico",
        "identificador_socio",
        "nome_socio",
        "cnpj_cpf_socio",
        "qualificacao_socio",
        "data_entrada_sociedade",
        "pais",
        "representante_legal",
        "nome_representante",
        "qualificacao_representante_legal",
        "faixa_etaria",
    ],
    "Motivos": ["codigo", "descricao"],
    "Cnaes": ["codigo", "descricao"],
    "Naturezas": ["codigo", "descricao"],
    "Qualificacoes": ["codigo", "descricao"],
    "Municipios": ["codigo", "descricao"],
    "Paises": ["codigo", "descricao"],
}

# Columns the dump only holds in pieces, as (name, separator, parts). The value is appended
# after the dump's own columns, so every position above stays the dump's. It goes in the file
# because neither reader joins anything of its own — the S3 import reads what is there.
DERIVED = {
    "Estabelecimentos": ("cnpj", "", ("cnpj_basico", "cnpj_ordem", "cnpj_dv")),
    # A company has several sócios, and the same person can hold more than one qualificação or
    # leave and rejoin, so cnpj_basico alone does not identify a row. This is the sort key.
    "Socios": (
        "socio",
        "|",
        ("cnpj_cpf_socio", "nome_socio", "qualificacao_socio", "data_entrada_sociedade"),
    ),
}
