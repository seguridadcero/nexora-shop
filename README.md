# Nexora Shop — OWASP API Security Top 10:2023 laboratory

**Status: intentionally vulnerable training environment.** This is an intentionally vulnerable fictional e-commerce application. Run it **only on a controlled isolated training network**. The optional LAN ports may listen on host interfaces; use a firewall or VM network restrictions to prevent unintended access. Do not forward ports to the Internet or use real credentials or data.

## Run locally

Prerequisite: Docker Engine with Compose v2.

```sh
docker compose up --build -d --wait
```

| Component | URL | Purpose |
|---|---|---|
| Nexora Storefront | http://127.0.0.1:8090 | Customer and Admin UI |
| Swagger UI | http://127.0.0.1:8090/api/docs | Legitimate API contract |
| Supplier Panel | http://127.0.0.1:8091/ | Edit fictional supplier records |
| Resource Monitor (Admin) | http://127.0.0.1:8090/monitor | Sign in as Shop Admin; CPU %, RAM MB and API latency ms |

The API, supplier, internal SSRF target, monitor and Nginx run as separate processes in a single container. To preserve access from a Kali VM network, the existing deployment publishes ports 8090, 8091 and the legacy monitor on 8092 on all host interfaces. This is **not suitable for an untrusted network**: restrict exposure with host firewall or VM networking and never forward these ports to the Internet. The admin monitor is available at `/monitor` and its API requires an administrator token; the legacy monitor on port 8092 remains accessible directly. Existing named data volumes are retained. Docker isolation must still be reviewed before running on shared or untrusted infrastructure.

### Fictional customer accounts

| Role | Email | Password |
|---|---|---|
| Customer Alice | alice@nexora.example | AliceDemo!2026 |
| Customer Bob | bob@nexora.example | BobDemo!2026 |
| Admin | admin@nexora.example | AdminDemo!2026 |
| Supplier Admin (independent) | admin | admin |

No real payments or purchases take place.

## Checkout flow

The Cart page presents items, a payment method and a single **Place order** action. `POST /api/v1/cart/checkout` creates the confirmed order and its simulated payment within one SQLite transaction; the response includes the order ID, final decimal USD display amount and masked payment receipt. The storefront then renders **Thank you for your order** from that response without fetching the catalog or order history. **View my orders** and **Continue shopping** fetch data only when selected. API03 intentionally remains demonstrable by injecting the client-controlled `price` field into an item of the checkout request in an authorized local lab.

## Lab coverage

| OWASP 2023 | Intended scenario |
|---|---|
| API1 | Alice obtains Bob's order by changing ID |
| API2 | Only GET /api/v1/account/orders deliberately accepts a tampered JWT subject; GET /api/v1/account verifies the signature |
| API3 | Checkout accepts a client-controlled `items[].price` property and records the altered order total |
| API4 | Costly product searches without request/concurrency limits; administrator Resource Monitor at /monitor |
| API5 | Customer edits Admin-only product stock |
| API6 | Repeat purchases exceed per-customer limited edition rule |
| API7 | Admin image import sends a request to an internal Docker HTTP target |
| API8 | Invalid order ID leaks database query and stack |
| API9 | Experimental v2 orders endpoint lacks authentication |
| API10 | Supplier price override below the trusted minimum and stored HTML rendered unsafely in the storefront catalog and detail pages |

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

This test modifies **fictional** orders, stock and supplier prices; begin with reset fixtures. The GitHub Actions workflow also attempts these steps. Check the current GitHub Actions run for the latest build and smoke-test results.

## Restore lab state through the application

The Welcome page provides **Reset Lab Data**. It requires demo administrator credentials and the confirmation `RESET LAB`. It resets seeded customer and supplier data. Close or refresh open storefront and supplier sessions after restoring the lab. Do not treat the operation as atomic across the two stores; if one stage fails, verify both datasets before proceeding.

## Reset everything

```sh
docker compose down --volumes
docker compose up --build -d --wait
```

**Destructive:** wipes only this Compose project's named lab volumes, including store orders and supplier products. Do not use this command in a Compose project with any real data.

## Reproducing the guided challenges

Open `/challenges?api=api01` through `/challenges?api=api10`. Each scenario provides a Learning objective, progressive hints and a Technical walkthrough. Reproduction examples assume the seeded dataset unless otherwise stated; API03, API05, API06 and API10 modify persistent data. Use **Reset Lab Data** before retrying dependent scenarios when orders, cart contents, stock or supplier revisions have changed. HTTP examples contain placeholder JWTs; authenticate through `POST /api/v1/auth/login` and substitute the actual access token. For API10, a response containing HTML does not by itself prove that browser JavaScript executed: verify the result in the isolated storefront.

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
