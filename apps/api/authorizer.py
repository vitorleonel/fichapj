import hmac
import os

import boto3

# Kept for the life of the container, so Secrets Manager is read on cold start only.
_expected = None


def _token():
    global _expected
    if _expected is None:
        client = boto3.client("secretsmanager")
        _expected = client.get_secret_value(SecretId=os.environ["TOKEN_SECRET_ARN"])["SecretString"]
    return _expected


def handler(event, context):
    supplied = event.get("authorizationToken") or ""
    allowed = hmac.compare_digest(supplied.encode(), _token().encode())

    return {
        "principalId": "token",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow" if allowed else "Deny",
                    "Resource": event["methodArn"],
                }
            ],
        },
    }
