import json
import os

import boto3

TABLES = json.loads(os.environ["TABLES"])
dynamodb = boto3.resource("dynamodb")
empresas = dynamodb.Table(TABLES["empresas"])
estabelecimentos = dynamodb.Table(TABLES["estabelecimentos"])
naturezas = dynamodb.Table(TABLES["naturezas_juridicas"])
cnaes = dynamodb.Table(TABLES["cnaes"])
municipios = dynamodb.Table(TABLES["municipios"])
motivos = dynamodb.Table(TABLES["motivos"])
qualificacoes = dynamodb.Table(TABLES["qualificacoes_de_socios"])
paises = dynamodb.Table(TABLES["paises"])

# Code field -> the table holding its description, and whether the dump packs several codes into
# the field. Resolved on read rather than at load time, so the tables stay in the shape the
# Receita publishes and a description that changes upstream needs no reimport.
EMPRESA_CODES = {
    "natureza_juridica": (naturezas, False),
    "qualificacao_responsavel": (qualificacoes, False),
}

ESTABELECIMENTO_CODES = {
    "cnae_fiscal_principal": (cnaes, False),
    "cnae_fiscal_secundaria": (cnaes, True),
    "municipio": (municipios, False),
    "motivo_situacao_cadastral": (motivos, False),
    "pais": (paises, False),
}

# The code to read when a field is empty. The dump only fills `pais` for an address abroad, so
# an empty one is a Brazilian address. Resolved through the table like any other code.
DEFAULT_CODES = {"pais": "105"}

# batch_get_item takes 100 keys, and refuses more instead of truncating.
BATCH = 100


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def _codes(value):
    """The codes packed into one field, comma-joined."""
    return [code.strip() for code in value.split(",") if code.strip()]


def _descriptions(table, codes):
    """{codigo: descricao} for the codes given. A code the table does not know is left out."""
    found = {}
    for start in range(0, len(codes), BATCH):
        pending = {table.name: {"Keys": [{"codigo": c} for c in codes[start:start + BATCH]]}}

        # DynamoDB can hand back keys it did not get to. Three rounds is plenty for a batch this
        # small, and past that a partial answer beats a Lambda that never returns.
        for _ in range(3):
            response = dynamodb.batch_get_item(RequestItems=pending)
            found.update(
                {i["codigo"]: i.get("descricao") for i in response["Responses"].get(table.name, [])}
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


def handler(event, context):
    cnpj = (event.get("pathParameters") or {}).get("cnpj", "")

    if len(cnpj) != 14 or not cnpj.isdigit():
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

    return _response(200, {"empresa": empresa, "estabelecimento": estabelecimento})
