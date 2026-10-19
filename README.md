# Nexora Shop — OWASP API Security Top 10:2023 laboratory

**Status: development / unverified Docker deployment.** This is an intentionally vulnerable fictional e-commerce application. Run it **only on an isolated local host**. Do not forward ports, expose a proxy publicly, or place real credentials or data in the lab.

## Run locally

Prerequisite: Docker Engine with Compose v2.

```sh
docker compose up --build -d --wait
```

| Component | URL | Purpose |
|---|---|---|
| Nexora Storefront | http://127.0.0.1:8080 | Customer and Admin UI |
| Swagger UI | http://127.0.0.1:8080/api/docs | Legitimate API contract |
| Supplier Panel | http://127.0.0.1:8081/supplier/panel | Edit fictional supplier records |
| Resource Monitor | http://127.0.0.1:8082 | Real CPU %, RAM MB and API latency ms |

The API, supplier, and internal SSRF target communicate through a private Docker network. Host-facing ports bind to `127.0.0.1` only. Docker isolation must still be reviewed before running on shared or untrusted infrastructure.

### Fictional customer accounts

| Role | Email | Password |
|---|---|---|
| Customer Alice | alice@nexora.example | AliceDemo!2026 |
| Customer Bob | bob@nexora.example | BobDemo!2026 |
| Admin | admin@nexora.example | AdminDemo!2026 |
| Supplier Admin (independent) | admin | admin |

No real payments or purchases take place.

## Lab coverage

| OWASP 2023 | Intended scenario |
|---|---|
| API1 | Alice obtains Bob's order by changing ID |
| API2 | Only GET /api/v1/account fails to validate the JWT signature |
| API3 | Draft order mass assignment changes unit_price_cents |
| API4 | Costly product searches without request/concurrency limits; independent monitor |
| API5 | Customer edits Admin-only product stock |
| API6 | Repeat purchases exceed per-customer limited edition rule |
| API7 | Admin image import sends a request to an internal Docker HTTP target |
| API8 | Invalid order ID leaks database query and stack |
| API9 | Experimental v2 orders endpoint lacks authentication |
| API10 | Supplier price override below internal minimum and HTML injected into Admin sync report |

The two API10 consequences bring the intended exploitation demonstrations to **eleven**.

## Run tests

Node.js 22.13+ recommended:

```sh
npm install
npm run test:data
npm run build -w @nexora/api
npm run build -w @nexora/storefront
```

Once Docker is running, execute the HTTP regression:

```sh
node scripts/smoke.mjs
```

This test modifies **fictional** orders, stock and supplier prices; begin with reset fixtures. The GitHub Actions workflow also attempts these steps. No CI success has been confirmed yet, so do not treat the application as fully tested.

## Reset everything

```sh
docker compose down --volumes
docker compose up --build -d --wait
```

**Destructive:** wipes only this Compose project's named lab volumes, including store orders and supplier products. Do not use this command in a Compose project with any real data.

## Source layout

- `apps/api/`: Hono/Node, JWT, SQLite, Swagger and OWASP scenarios
- `apps/storefront/`: React Customer/Admin interfaces
- `services/supplier/`: independently persisted fictional supplier
- `services/internal-target/`: no-external-access SSRF target
- `services/resource-monitor/`: live resource observations
- `database/`: seeded fictional business state
- `scripts/smoke.mjs`: HTTP exploitation/regression suite

## Verification limits

Unit and database tests run locally without npm dependencies. Full TypeScript builds, actual Docker deployment, browser XSS execution, and end-to-end exploits still require a successful CI execution. Incomplete or queued workflows do **not** certify any of these.
