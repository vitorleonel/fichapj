# /// script
# requires-python = ">=3.9"
# dependencies = ["boto3"]
# ///
"""Checks the count adds up across pages, without AWS. Run: uv run apps/api/test_stats.py"""

import json
import os

os.environ.update(
    TABLES=json.dumps({"estabelecimentos": "estabelecimentos"}),
    AWS_DEFAULT_REGION="us-east-1",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
)

import stats  # noqa: E402 — the environment has to be in place before the import


class _Table:
    def __init__(self, *pages):
        self._pages = list(pages)
        self.calls = []

    def scan(self, **kwargs):
        self.calls.append(kwargs)
        return self._pages.pop(0)


def _count(*pages):
    stats.estabelecimentos = _Table(*pages)
    return json.loads(stats.handler(None, None)["body"])["active_companies"]


def test_one_page():
    assert _count({"Items": [{"cnpj": "1"}, {"cnpj": "2"}]}) == 2


def test_pages_add_up():
    assert (
        _count(
            {"Items": [{"cnpj": "1"}], "LastEvaluatedKey": {"cnpj": "1"}},
            {"Items": [{"cnpj": "2"}, {"cnpj": "3"}], "LastEvaluatedKey": {"cnpj": "3"}},
            {"Items": [{"cnpj": "4"}]},
        )
        == 4
    )


def test_a_page_picks_up_where_the_last_one_stopped():
    _count({"Items": [], "LastEvaluatedKey": {"cnpj": "1"}}, {"Items": []})

    calls = stats.estabelecimentos.calls
    assert "ExclusiveStartKey" not in calls[0]
    assert calls[1]["ExclusiveStartKey"] == {"cnpj": "1"}


def test_only_active_rows_are_asked_for():
    _count({"Items": []})

    call = stats.estabelecimentos.calls[0]
    assert call["FilterExpression"] == "situacao_cadastral = :ativa"
    assert call["ExpressionAttributeValues"] == {":ativa": "02"}


if __name__ == "__main__":
    for name, check in sorted(globals().items()):
        if name.startswith("test_"):
            check()
            print(f"ok  {name}")
