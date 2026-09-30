import json
import os
import re

import boto3
from boto3.dynamodb.conditions import Key

TABLES = json.loads(os.environ["TABLES"])
dynamodb = boto3.resource("dynamodb")
empresas = dynamodb.Table(TABLES["empresas"])
estabelecimentos = dynamodb.Table(TABLES["estabelecimentos"])
socios = dynamodb.Table(TABLES["socios"])
naturezas = dynamodb.Table(TABLES["naturezas_juridicas"])
cnaes = dynamodb.Table(TABLES["cnaes"])
municipios = dynamodb.Table(TABLES["municipios"])
motivos = dynamodb.Table(TABLES["motivos"])
qualificacoes = dynamodb.Table(TABLES["qualificacoes_de_socios"])
paises = dynamodb.Table(TABLES["paises"])

# Code field -> where its description comes from, and whether the dump packs several codes into
# the field. The source is either a DynamoDB table or, for the two domains the Receita fixes in
# its layout instead of publishing as a file, a plain {codigo: descricao} map. Resolved on read
# rather than at load time, so the tables stay in the shape the Receita publishes and a
# description that changes upstream needs no reimport.
PORTE = {
    "00": "Não informado",
    "01": "Micro empresa",
    "03": "Empresa de pequeno porte",
    "05": "Demais",
}

SITUACAO_CADASTRAL = {
    "01": "NULA",
    "02": "Ativa",
    "03": "Suspensa",
    "04": "Inapta",
    "08": "Baixada",
}

# The sócio's cnpj_cpf comes masked from the dump, so this is the only thing that says whether
# a partner is a person or a company.
IDENTIFICADOR_SOCIO = {
    "1": "Pessoa jurídica",
    "2": "Pessoa física",
    "3": "Estrangeiro",
}

EMPRESA_CODES = {
    "natureza_juridica": (naturezas, False),
    "qualificacao_responsavel": (qualificacoes, False),
    "porte": (PORTE, False),
}

ESTABELECIMENTO_CODES = {
    "cnae_fiscal_principal": (cnaes, False),
    "cnae_fiscal_secundaria": (cnaes, True),
    "municipio": (municipios, False),
    "motivo_situacao_cadastral": (motivos, False),
    "pais": (paises, False),
    "situacao_cadastral": (SITUACAO_CADASTRAL, False),
}

# `faixa_etaria` is left as the dump's code: the layout publishes no legend for it, and a
# made-up band would read as fact.
SOCIO_CODES = {
    "identificador_socio": (IDENTIFICADOR_SOCIO, False),
    "qualificacao_socio": (qualificacoes, False),
    "qualificacao_representante_legal": (qualificacoes, False),
    "pais": (paises, False),
}

# The code to read when a field is empty. The dump fills `pais` only for an address abroad or a
# foreign sócio, so an empty one is Brazil. Resolved through the table like any other code.
DEFAULT_CODES = {"pais": "105"}

# batch_get_item takes 100 keys, and refuses more instead of truncating.
BATCH = 100

# The Receita's alphanumeric cnpj, in force since July 2026: twelve alphanumeric positions and
# two numeric check digits. The numeric ones issued before it still fit — digits are alphanumeric.
CNPJ = re.compile(r"[0-9A-Z]{12}[0-9]{2}")


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def _codes(value):
    """The codes packed into one field, comma-joined."""
    return [code.strip() for code in value.split(",") if code.strip()]


def _descriptions(source, codes):
    """{codigo: descricao} for the codes given. A code the source does not know is left out."""
    if isinstance(source, dict):
        return {code: source[code] for code in codes if code in source}

    found = {}
    for start in range(0, len(codes), BATCH):
        pending = {source.name: {"Keys": [{"codigo": c} for c in codes[start:start + BATCH]]}}

        # DynamoDB can hand back keys it did not get to. Three rounds is plenty for a batch this
        # small, and past that a partial answer beats a Lambda that never returns.
        for _ in range(3):
            response = dynamodb.batch_get_item(RequestItems=pending)
            found.update(
                {i["codigo"]: i.get("descricao") for i in response["Responses"].get(source.name, [])}
            )
            pending = response["UnprocessedKeys"]
            if not pending:
                break

    return found


def _resolve(item, fields):
    """Swaps each code field for {codigo, descricao}, or a list of them.

    A code with no row in its table keeps its place with a null descricao, so a gap in the
    reference data never drops something the company does have.
    """
    for field, (table, many) in fields.items():
        if field not in item:
            continue

        raw = item[field] or DEFAULT_CODES.get(field, "")
        codes = _codes(raw) if many else ([raw] if raw else [])
        if not codes:
            item[field] = [] if many else None
            continue

        found = _descriptions(table, codes)
        described = [{"codigo": code, "descricao": found.get(code)} for code in codes]

        item[field] = described if many else described[0]

    return item


def _socios(cnpj_basico):
    """Every sócio of a company, codes resolved.

    cnpj_basico is the partition key, so this is one query and not a scan. The reply is left
    unpaged: a page holds a megabyte of sócios, far past any real cap table.
    """
    items = socios.query(KeyConditionExpression=Key("cnpj_basico").eq(cnpj_basico))["Items"]

    return [_resolve(item, SOCIO_CODES) for item in items]


def handler(event, context):
    # Uppercased, so a cnpj typed in lower case still finds the row the dump stored.
    cnpj = (event.get("pathParameters") or {}).get("cnpj", "").upper()

    if not CNPJ.fullmatch(cnpj):
        return _response(400, {"message": "You need to provide a valid CNPJ."})

    estabelecimento = estabelecimentos.get_item(Key={"cnpj": cnpj}).get("Item")

    if estabelecimento is None:
        return _response(404, {"message": "CNPJ not found."})

    cnpj_basico = cnpj[:8]
    empresa = empresas.get_item(Key={"cnpj_basico": cnpj_basico}).get("Item")

    if empresa is None:
        return _response(404, {"message": "CNPJ not found."})

    _resolve(empresa, EMPRESA_CODES)
    _resolve(estabelecimento, ESTABELECIMENTO_CODES)

    return _response(
        200,
        {
            "empresa": empresa,
            "estabelecimento": estabelecimento,
            "socios": _socios(cnpj_basico),
        },
    )
