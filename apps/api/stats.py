"""The counts behind the navbar. A function of its own so the scan permission stays
off the lookup route."""

import json
import os

import boto3

TABLES = json.loads(os.environ["TABLES"])
estabelecimentos = boto3.resource("dynamodb").Table(TABLES["estabelecimentos"])

ATIVA = "02"


def handler(event, context):
    """A scan stops at 1MB, so the total takes more than one call."""
    total = 0
    start = None

    while True:
        # ponytail: full scan per call; a counter item updated on import if the table outgrows this.
        page = estabelecimentos.scan(
            ProjectionExpression="cnpj",
            FilterExpression="situacao_cadastral = :ativa",
            ExpressionAttributeValues={":ativa": ATIVA},
            **({"ExclusiveStartKey": start} if start else {}),
        )
        total += len(page["Items"])

        start = page.get("LastEvaluatedKey")
        if not start:
            return {
                "statusCode": 200,
                "headers": {"content-type": "application/json"},
                "body": json.dumps({"active_companies": total}),
            }
