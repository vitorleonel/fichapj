# Ficha PJ

Looks up a CNPJ and returns the company plus its establishment, out of the Receita Federal open
data. API Gateway + Lambda in front of DynamoDB, described in OpenTofu.

Locally everything runs against [floci](https://floci.io), an AWS emulator, so no AWS account is
needed.

## What you need

| | |
|---|---|
| A container runtime | the emulator is a container. On macOS we use [Colima](https://colima.run) rather than Docker Desktop — the install page covers the `docker` CLI it also needs. Anywhere else, [Docker](https://docs.docker.com/get-docker/) |
| [OpenTofu](https://opentofu.org/docs/intro/install/) | creates the tables, the functions and the API |
| [uv](https://docs.astral.sh/uv/getting-started/installation/) | runs the scripts in `scripts/` |
| [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) | talks to the emulator |

## Run it

### 1. Start the emulator

```bash
docker compose up -d
```

Web UI on <http://localhost:3000>, the AWS endpoints on <http://localhost:4566>. Everything it
stores lands in `./data` (`docker compose down && rm -rf data` is the reset — the tables go with
it).

### 2. Create the tables, the Lambdas and the API

```bash
cd infrastructure/terraform/envs/local
tofu init
tofu apply
```

### 3. Set the API token

Terraform creates the secret container but never its value, so the token stays out of the state
file. Set it here, in the same directory:

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 \
  aws --endpoint-url http://localhost:4566 secretsmanager put-secret-value \
  --secret-id "$(tofu output -raw token_secret_name)" --secret-string local-dev-token
```

Floci takes any credentials; `test`/`test` is the convention.

### 4. Call it

```bash
curl -H "Authorization: local-dev-token" \
  "http://localhost:4566/execute-api/$(tofu output -raw api_id)/v1/cnpj/19131243000197"
```

`{"message": "CNPJ not found."}` with a `404` is the expected answer on a fresh database — the
tables are empty until step 5. A missing or wrong token is a `403`.

### 5. Load the data (optional)

Back at the repo root:

```bash
make headers   # unzip the Receita dumps and add their missing header row
make load      # push the csvs into the local DynamoDB
```

Both need the dumps in `scripts/local_add_headers/in/` first — see
[scripts/README.md](scripts/README.md) for where to get them. Then repeat step 4 with a real CNPJ.

## Further

- [scripts/README.md](scripts/README.md) — the dump pipeline, and how to add a table to it
- [infrastructure/terraform/README.md](infrastructure/terraform/README.md) — table imports, and
  what the API answers in each case
