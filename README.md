# Nexora Shop — OWASP API Security Training

**Status:** functional storefront foundation in development. The ten intentionally vulnerable scenarios have **not** yet been completed or validated. Use only in a locally isolated environment.

## Requirements

Docker Engine with Compose v2. No production data or external services are needed.

## Run

```sh
docker compose up --build -d --wait
```

Open http://127.0.0.1:8080 and Swagger UI at http://127.0.0.1:8080/api/docs.

The exposed web port is bound to **127.0.0.1 only**, not every host interface. Do not publish or forward this application to the public internet.

## Fictional demo accounts

| Role | Email | Password |
|---|---|---|
| Customer Alice | alice@nexora.example | AliceDemo!2026 |
| Customer Bob | bob@nexora.example | BobDemo!2026 |
| Admin | admin@nexora.example | AdminDemo!2026 |

These credentials are only intended for this isolated lab. No real transactions or payment integrations exist.

## Reinitialize fictional data

```sh
docker compose exec -e ALLOW_RESET=YES api node apps/api/dist/reset.js
```

This is **destructive**: all demo application data is reset.

## Local unit tests

Node.js 22.13+ is recommended:

```sh
npm install
npm run test:data
npm run build -w @nexora/api
npm run build -w @nexora/storefront
```

GitHub Actions also attempts to build the containers and smoke-test HTTP endpoints. Its results must be inspected before treating the Docker deployment as verified.

## Project layout

- `apps/api` — Hono, SQLite, JWT, commerce routes and OpenAPI
- `apps/storefront` — React/Vite shop and admin foundation
- `database` — local seed fixtures and schema
- `compose.yaml` — API, nginx proxy, isolated internal app network

## Outstanding work

API1–API10 vulnerability labs, Supplier API, internal SSRF destination, API4 resource monitor, full regression, and Docker smoke-test confirmation. Current authorization and purchase limits are a **safe baseline** and should not be mistaken for the intentionally vulnerable final lessons.
