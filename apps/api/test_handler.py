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
            "socios": "socios",
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
    """One item for get_item, a list for the sócios query."""

    def __init__(self, item=None, items=()):
        self._item = item
        self._items = items

    def get_item(self, **kwargs):
        return {} if self._item is None else {"Item": self._item}

    def query(self, **kwargs):
        return {"Items": self._items}


def test_not_found():
    """Either half missing is a 404 — the two tables describe one company."""
    event = {"pathParameters": {"cnpj": "39581412000106"}}

    handler.empresas, handler.estabelecimentos = _Table(None), _Table(None)
    assert handler.handler(event, None)["statusCode"] == 404, "no estabelecimento"

    handler.estabelecimentos = _Table({"cnpj": "39581412000106", "cnae_fiscal_principal": "6201501"})
    assert handler.handler(event, None)["statusCode"] == 404, "estabelecimento without empresa"


def test_cnpj_shape():
    """Twelve alphanumeric positions and two numeric check digits, since July 2026."""
    handler.empresas = handler.estabelecimentos = _Table(None)

    def status(cnpj):
        return handler.handler({"pathParameters": {"cnpj": cnpj}}, None)["statusCode"]

    # A 404 means it passed the shape and went looking; a 400 means it never got there.
    assert status("39581412000106") == 404, "the numeric ones issued before still go through"
    assert status("12ABC34501DE35") == 404, "letters above the check digits"
    assert status("12abc34501de35") == 404, "and lower case finds the same row"

    assert status("12ABC34501DE3") == 400, "short"
    assert status("12ABC34501DE3X") == 400, "a letter in a check digit"
    assert status("12.ABC.345/01DE-35") == 400, "punctuation is the form's job, not the api's"


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
        "descricao": "Empresa de pequeno porte",
    }, "porte comes from the layout's fixed domain, not a table"


def test_fixed_domain_without_the_code():
    """A code the layout does not list keeps its place, like any other unknown code."""
    assert handler._descriptions(handler.SITUACAO_CADASTRAL, ["02", "99"]) == {"02": "Ativa"}

    estab = {"situacao_cadastral": "99"}
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["situacao_cadastral"] == {"codigo": "99", "descricao": None}


def test_estabelecimento():
    estab = {
        "identificador_matriz_filial": "1",
        "cnae_fiscal_principal": "6201501",
        "cnae_fiscal_secundaria": "4761001,9999999",
        "municipio": "7089",
        "motivo_situacao_cadastral": "00",
        "situacao_cadastral": "02",
        "pais": "",
    }
    handler._resolve(estab, handler.ESTABELECIMENTO_CODES)

    assert estab["identificador_matriz_filial"] == {"codigo": "1", "descricao": "Matriz"}
    assert estab["cnae_fiscal_principal"]["descricao"].startswith("Desenvolvimento")
    assert estab["municipio"] == {"codigo": "7089", "descricao": "SAO JOAQUIM DA BARRA"}
    assert estab["motivo_situacao_cadastral"] == {"codigo": "00", "descricao": "SEM MOTIVO"}
    assert estab["situacao_cadastral"] == {"codigo": "02", "descricao": "Ativa"}
    assert estab["pais"] == {"codigo": "105", "descricao": "BRASIL"}, "vazio é endereço no Brasil"
    assert estab["cnae_fiscal_secundaria"] == [
        {"codigo": "4761001", "descricao": None},
        {"codigo": "9999999", "descricao": None},
    ], "a code with no row keeps its place"


def test_socios():
    """The sócios ride along with the company, codes resolved like anywhere else."""
    handler.estabelecimentos = _Table({"cnpj": "39581412000106"})
    handler.empresas = _Table({"cnpj_basico": "39581412"})
    handler.socios = _Table(
        items=[
            {
                "cnpj_basico": "39581412",
                "identificador_socio": "2",
                "nome_socio": "ZENIRA DA SILVA MACEDO",
                "cnpj_cpf_socio": "***903770**",
                "qualificacao_socio": "49",
                "data_entrada_sociedade": "20100805",
                "pais": "",
                "faixa_etaria": "6",
                "socio": "***903770**|ZENIRA DA SILVA MACEDO|49|20100805",
            }
        ]
    )

    body = json.loads(handler.handler({"pathParameters": {"cnpj": "39581412000106"}}, None)["body"])
    socio = body["socios"][0]

    assert socio["nome_socio"] == "ZENIRA DA SILVA MACEDO", "free text is passed through"
    assert socio["qualificacao_socio"] == {"codigo": "49", "descricao": "Sócio-Administrador"}
    assert socio["identificador_socio"] == {"codigo": "2", "descricao": "Pessoa física"}
    assert socio["pais"] == {"codigo": "105", "descricao": "BRASIL"}, "sócio sem país é do Brasil"
    assert socio["faixa_etaria"] == "6", "a faixa etária has no legend, so the code stands"
    assert "socio" not in socio, "the sort key is the table's, not the partner's"


def test_socios_vazio():
    """A company with no partners answers with an empty list, not a missing key."""
    handler.estabelecimentos = _Table({"cnpj": "39581412000106"})
    handler.empresas = _Table({"cnpj_basico": "39581412"})
    handler.socios = _Table()

    body = json.loads(handler.handler({"pathParameters": {"cnpj": "39581412000106"}}, None)["body"])

    assert body["socios"] == []


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
