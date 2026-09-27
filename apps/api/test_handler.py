# /// script
# requires-python = ">=3.9"
# dependencies = ["boto3"]
# ///
"""Checks the code resolution, without AWS. Run: uv run apps/api/test_handler.py"""

import json
import os

# handler reads these at import, and a stub table stands in for the network, so nothing here
# talks to DynamoDB.
os.environ.update(
    TABLES=json.dumps(
        {
            "empresas": "empresas",
            "estabelecimentos": "estabelecimentos",
            "naturezas_juridicas": "naturezas",
            "cnaes": "cnaes",
            "municipios": "municipios",
            "motivos": "motivos",
            "qualificacoes_de_socios": "qualificacoes",
            "paises": "paises",
        }
    ),
    AWS_DEFAULT_REGION="us-east-1",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
)

import handler  # noqa: E402 — the environment has to be in place before the import

DESCRICOES = {
    "2062": "Sociedade Empresária Limitada",
    "6201501": "Desenvolvimento de programas de computador sob encomenda",
    "7089": "SAO JOAQUIM DA BARRA",
    "00": "SEM MOTIVO",
    "49": "Sócio-Administrador",
    "105": "BRASIL",
    "013": "AFEGANISTAO",
}
# The fixed domains resolve from the map in the handler, so only the table path is stubbed.
_real_descriptions = handler._descriptions
handler._descriptions = lambda source, codes: (
    _real_descriptions(source, codes)
    if isinstance(source, dict)
    else {c: DESCRICOES.get(c) for c in codes}
)


class _Table:
    def __init__(self, item):
        self._item = item

    def get_item(self, **kwargs):
        return {} if self._item is None else {"Item": self._item}


def test_not_found():
    """Either half missing is a 404 — the two tables describe one company."""
    event = {"pathParameters": {"cnpj": "39581412000106"}}

    handler.empresas, handler.estabelecimentos = _Table(None), _Table(None)
    assert handler.handler(event, None)["statusCode"] == 404, "no estabelecimento"

    handler.estabelecimentos = _Table({"cnpj": "39581412000106", "cnae_fiscal_principal": "6201501"})
    assert handler.handler(event, None)["statusCode"] == 404, "estabelecimento without empresa"


def test_codes():
    assert handler._codes("4761001,5811500") == ["4761001", "5811500"]
    assert handler._codes("4761001, 5811500") == ["4761001", "5811500"]
    assert handler._codes("4761001,,5811500,") == ["4761001", "5811500"]
    assert handler._codes("") == []


def test_empresa():
    empresa = {
        "cnpj_basico": "39581412",
        "natureza_juridica": "2062",
        "qualificacao_responsavel": "49",
        "porte": "03",
    }
    handler._resolve(empresa, handler.EMPRESA_CODES)

    assert empresa["natureza_juridica"] == {
        "codigo": "2062",
        "descricao": "Sociedade Empresária Limitada",
    }
    assert empresa["qualificacao_responsavel"] == {"codigo": "49", "descricao": "Sócio-Administrador"}
    assert empresa["porte"] == {
        "codigo": "03",
        "descricao": "EMPRESA DE PEQUENO PORTE",
    }, "porte comes from the layout's fixed domain, not a table"


def test_fixed_domain_without_the_code():
    """A code the layout does not list keeps its place, like any other unknown code."""
    assert handler._descriptions(handler.SITUACAO_CADASTRAL, ["02", "99"]) == {"02": "ATIVA"}

    estab = {"situacao_cadastral": "99"}
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["situacao_cadastral"] == {"codigo": "99", "descricao": None}


def test_estabelecimento():
    estab = {
        "cnae_fiscal_principal": "6201501",
        "cnae_fiscal_secundaria": "4761001,9999999",
        "municipio": "7089",
        "motivo_situacao_cadastral": "00",
        "situacao_cadastral": "02",
        "pais": "",
    }
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["cnae_fiscal_principal"]["descricao"].startswith("Desenvolvimento")
    assert estab["municipio"] == {"codigo": "7089", "descricao": "SAO JOAQUIM DA BARRA"}
    assert estab["motivo_situacao_cadastral"] == {"codigo": "00", "descricao": "SEM MOTIVO"}
    assert estab["situacao_cadastral"] == {"codigo": "02", "descricao": "ATIVA"}
    assert estab["pais"] == {"codigo": "105", "descricao": "BRASIL"}, "vazio é endereço no Brasil"
    assert estab["cnae_fiscal_secundaria"] == [
        {"codigo": "4761001", "descricao": None},
        {"codigo": "9999999", "descricao": None},
    ], "a code with no row keeps its place"


def test_empty():
    estab = {"cnae_fiscal_principal": "", "cnae_fiscal_secundaria": ""}
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["cnae_fiscal_principal"] is None
    assert estab["cnae_fiscal_secundaria"] == []


def test_pais_preenchido():
    estab = {"pais": "013"}
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["pais"] == {"codigo": "013", "descricao": "AFEGANISTAO"}, "um país de fora manda"


def test_missing_field():
    estab = {"cnpj": "39581412000106"}
    assert handler._resolve(estab, handler.ESTABELECIMENTO_CODES) == {"cnpj": "39581412000106"}


if __name__ == "__main__":
    for name, check in sorted(globals().items()):
        if name.startswith("test_"):
            check()
            print(f"ok  {name}")
