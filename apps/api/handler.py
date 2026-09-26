import json
import os

import boto3

TABLES = json.loads(os.environ["TABLES"])
dynamodb = boto3.resource("dynamodb")
empresas = dynamodb.Table(TABLES["empresas"])
estabelecimentos = dynamodb.Table(TABLES["estabelecimentos"])


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json"},
        "body": json.dumps(body, default=str),
    }


def handler(event, context):
    cnpj = (event.get("pathParameters") or {}).get("cnpj", "")

    if len(cnpj) != 14 or not cnpj.isdigit():
        return _response(400, {"message": "You need to provide a valid CNPJ."})

    estabelecimento = estabelecimentos.get_item(Key={"cnpj": cnpj}).get("Item")

    if estabelecimento is None:
        return _response(404, {"message": "CNPJ not found."})

    cnpj_basico = cnpj[:8]
    empresa = empresas.get_item(Key={"cnpj_basico": cnpj_basico}).get("Item")

    return _response(200, {"empresa": empresa, "estabelecimento": estabelecimento})
