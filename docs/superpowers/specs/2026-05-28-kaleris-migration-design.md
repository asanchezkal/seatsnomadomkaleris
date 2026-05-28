# Office Seat Reservation — Kaleris Migration Design

**Date:** 2026-05-28
**Author:** Antonio Sanchez
**Status:** APPROVED

---

## Objective

Migrate the current office seat reservation app (React/JS + Tailwind + Supabase + Vercel) to a
fully Kaleris-compliant package ready for handoff to the internal Azure team for deployment.

The output is a containerized, production-ready codebase. The internal team supplies Azure AD
tenant / subscription credentials and runs Terraform to deploy. Nothing goes to production until
the Kaleris Security written approval for Azure AD OID storage is obtained.

---

## Scope — Phase A: Full Compliance

This phase delivers everything required by Kaleris internal app standards in a single handoff:

- Azure AD authentication (MSAL.js + Spring Security JWT validation)
- Azure hosting (Static Web Apps + App Service + Azure PostgreSQL)
- React + TypeScript + CSS Modules + Kaleris design system
- Java 21 Spring Boot REST API (replaces Supabase)
- PostgreSQL database (replaces Supabase)
- Docker Compose for local development
- Terraform for Azure infrastructure
- GitHub Actions CI/CD (dev + prod with manual approval gate)
- Immutable audit logging
- Health checks and structured logging
- Runbook + handoff documentation

---

## Decision Log

| Decision | Choice | Reason |
|---|---|---|
| Sub-project order | Auth + Hosting first | Most critical compliance gap |
| Azure tenant | Not yet — containerize for handoff | Internal team handles Azure setup |
| Backend language | Java 21 LTS (Spring Boot) | Kaleris approved; user preference |
| Migration approach | Full compliance in one phase | Internal team receives production-ready package |

---

## Compliance Flags

### Identity data storage — requires Kaleris Security written approval

The Kaleris security standard forbids persisting employee names, work emails, and Azure AD OIDs.
However the reservation system must store a user reference per reservation row to show colleagues
who has reserved a desk.

**Decision:** Store only the Azure AD OID (`oid` JWT claim) as a foreign reference in the
`reservations` table. Display names are read from the JWT at request time only — never stored.

**Action required before production release:** `docs/handoff/SECURITY-APPROVAL-REQUEST.md`
contains a pre-written approval request to Kaleris Security. This must be submitted and approved
before the app goes to production.

---

## Architecture

```
LOCAL DEV (Docker Compose)
┌──────────────────────────────────────────────────────────┐
│  frontend :3000          backend :8080       postgres     │
│  React/TS + Nginx   →    Java 21 Spring Boot    :5432    │
│  MSAL.js (dev bypass)    REST API + JWT          Flyway   │
└──────────────────────────────────────────────────────────┘

AZURE PRODUCTION (Terraform-provisioned)
  Azure Static Web Apps ──→ Azure App Service (Spring Boot)
                                      ↓
                          Azure Database for PostgreSQL
                                      ↓
                            Azure AD (JWT validation)
  App Insights ←── structured logs, traces, health checks
```

### Containers

| Service | Technology | Local port |
|---|---|---|
| `frontend` | React 18 + TypeScript, Vite build, Nginx 1.25 | 3000 |
| `api` | Java 21 Spring Boot 3.x | 8080 |
| `db` | PostgreSQL 16 | 5432 |

### Azure resources (Terraform)

| Resource | Azure service |
|---|---|
| Frontend hosting | Azure Static Web Apps (Standard) |
| API hosting | Azure App Service Plan + App Service (Linux, B2 min) |
| Database | Azure Database for PostgreSQL Flexible Server |
| Observability | Application Insights + Log Analytics Workspace |

---

## Frontend

**Stack:** React 18 + TypeScript (strict, zero errors), Vite build, CSS Modules, Kaleris
`design-system.css` imported at root, served via Nginx in Docker.

**Shell:** Kaleris `AppShell` — fixed top bar with Kaleris logo, app name ("Desk Reservations"),
environment badge, user display name from Azure AD, and logout. Left collapsible sidebar:

| Nav item | Visible to |
|---|---|
| Workspace (desk grid) | All users |
| My Reservations | All users |
| Admin | AppAdmin role only |

**Auth:** MSAL.js (`@azure/msal-browser`). On app load, MSAL checks for an active Azure AD
session. If none, redirects to Microsoft login. No custom LoginPage. After redirect, user name
and OID are read from token claims for the session only — never stored in localStorage.

**Dev bypass:** `VITE_DEV_AUTH=true` enables a mock user picker (replaces MSAL redirect). Two
mock users: one with `Reservation.AppAdmin`, one with `Reservation.User` only. Cannot be active
unless env var is explicitly set.

**Environment variables:**
```
VITE_AZURE_CLIENT_ID=
VITE_AZURE_TENANT_ID=
VITE_API_URL=http://localhost:8080
VITE_DEV_AUTH=false
VITE_ENV=development
```

**Pages (all functionality preserved from current app):**
- **Workspace:** desk grid with date picker, seat map image preview (hover desktop / tap mobile
  overlay), desk filter, status guide
- **My Reservations:** upcoming reservations panel (auto-filters expired)
- **Admin** (AppAdmin role only): add/remove desks, clear all reservations, view all bookings

---

## Backend

**Framework:** Spring Boot 3.x, Java 21, Maven. `spring-security-oauth2-resource-server`
validates Azure AD Bearer tokens on every protected request. Spring Data JPA + Flyway.
Spring Boot Actuator for health checks.

**REST API:**

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/desks` | User | List all desks |
| `POST` | `/api/desks` | AppAdmin | Add a desk |
| `DELETE` | `/api/desks/{id}` | AppAdmin | Remove a desk |
| `GET` | `/api/reservations` | User | List reservations (filter by date) |
| `POST` | `/api/reservations` | User | Create reservation |
| `DELETE` | `/api/reservations/{id}` | User / AppAdmin | Cancel reservation |
| `DELETE` | `/api/reservations` | AppAdmin | Clear all reservations |
| `GET` | `/actuator/health` | Public | Health check |

**Business rules (enforced server-side):**
- One reservation per user per day
- Cannot double-book a desk for the same date
- Users can only cancel their own reservation (AppAdmin can cancel any)

**Audit logging:** every write appends an immutable row to `audit_log` — event type, actor OID,
resource ID, timestamp. Table is insert-only; no UPDATE or DELETE permitted on it.

**Structured logging:** JSON via Logback, `X-Correlation-ID` propagated on every request.
Application Insights Java agent attaches via `APPLICATIONINSIGHTS_CONNECTION_STRING` env var
(no-op locally when blank).

**Dev auth bypass:** `DEV_AUTH=true` accepts `X-Dev-User` header with a mock OID instead of JWT
validation. Disabled unless env var is explicitly set.

**Environment variables:**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/seatreservation
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
DEV_AUTH=false
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

---

## Database Schema

**Engine:** PostgreSQL 16. All schema changes via Flyway versioned migrations.

```sql
-- V1__init.sql
CREATE TABLE desks (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reservations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desk_id    TEXT NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  user_oid   TEXT NOT NULL,      -- Azure AD OID only (Kaleris Security approval required)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (desk_id, date),        -- one booking per desk per day
  UNIQUE (user_oid, date)        -- one booking per user per day
);

CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,     -- RESERVATION_CREATED, RESERVATION_CANCELLED,
                                 -- DESK_ADDED, DESK_REMOVED, RESERVATIONS_CLEARED
  user_oid    TEXT NOT NULL,
  resource_id TEXT,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- V2__seed_desks.sql
INSERT INTO desks (id, label) VALUES
  ('A1','A1'),('A2','A2'),('B1','B1'),('B2','B2'),
  ('C1','C1'),('C2','C2'),('D1','D1'),('D2','D2');
```

**Permissions:** app DB user has `INSERT/SELECT/UPDATE/DELETE` on `desks` and `reservations`;
`INSERT/SELECT` only on `audit_log` (append-only enforcement at DB level).

**Retention:** daily Spring `@Scheduled` job deletes `reservations` rows older than 365 days.
`audit_log` rows are never deleted by the app. Azure PostgreSQL backup retention set to 365 days
in Terraform.

---

## Authentication & Authorization

**Flow (production):**
1. MSAL.js checks for active Azure AD session — none found → redirects to Microsoft login
2. User authenticates with Kaleris work account
3. Azure AD redirects back with ID token + access token
4. MSAL stores tokens in memory only (not localStorage)
5. Display name read from ID token for the session — never persisted
6. Every API call sends `Authorization: Bearer <access_token>`
7. Spring Security validates JWT against Azure AD JWKS endpoint and extracts app roles

**Azure AD App Registration (internal team configures):**
- Single-tenant (Kaleris tenant only)
- SPA redirect URI: `https://<static-web-app>.azurestaticapps.net`
- API scope: `api://<client-id>/access_as_user`

**App roles:**

| Role | Value | Description |
|---|---|---|
| User | `Reservation.User` | All employees (default) |
| AppAdmin | `Reservation.AppAdmin` | Admin panel access |
| SupportAdmin | `Reservation.SupportAdmin` | Read-only: view all desks and reservations, no writes |
| PlatformOperator | `Reservation.PlatformOperator` | Ops access |
| BreakGlassAdmin | `Reservation.BreakGlassAdmin` | Emergency only — never permanently assigned |

**Token claims used:**
- `oid` — stored as `user_oid` in DB (requires Kaleris Security approval)
- `name` — display name, session only, shown in top bar, never stored
- `roles` — drives sidebar visibility and API authorization

**Dev bypass:** `VITE_DEV_AUTH=true` + `DEV_AUTH=true` skips MSAL and JWT validation entirely.
Two mock users available locally: one AppAdmin, one User.

---

## Docker & Containerization

**File structure:**
```
├── frontend/
│   ├── Dockerfile         (Node 20 build stage → Nginx 1.25 serve stage)
│   └── nginx.conf         (proxies /api/* to backend, no CORS issues locally)
├── backend/
│   └── Dockerfile         (Maven + Java 21 build stage → Temurin 21 JRE run stage)
├── docker-compose.yml     (local dev: frontend + api + db)
├── docker-compose.prod.yml  (production-like smoke test, DEV_AUTH=false)
└── .env.example           (all required vars documented with descriptions)
```

**To run locally:**
```bash
cp .env.example .env
# edit .env: set DEV_AUTH=true and VITE_DEV_AUTH=true
docker compose up --build
# open http://localhost:3000
```

**`.env.example` key variables:**
```
VITE_AZURE_CLIENT_ID=        # Azure AD app client ID
VITE_AZURE_TENANT_ID=        # Azure AD tenant ID
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
VITE_DEV_AUTH=false          # set true for local testing without Azure AD
DEV_AUTH=false
POSTGRES_DB=seatreservation
POSTGRES_USER=seatapp
POSTGRES_PASSWORD=changeme
APPLICATIONINSIGHTS_CONNECTION_STRING=
```

---

## Terraform Infrastructure

**Location:** `infra/` directory.

**File structure:**
```
infra/
├── main.tf                    ← provider, resource group
├── variables.tf
├── outputs.tf                 ← frontend URL, API URL, DB connection string
├── static_web_app.tf          ← Azure Static Web Apps
├── app_service.tf             ← App Service Plan + App Service
├── postgres.tf                ← Azure PostgreSQL Flexible Server (zone redundant in prod)
├── monitoring.tf              ← Application Insights + Log Analytics (365-day retention)
└── terraform.tfvars.example   ← template for internal team
```

**Variables the internal team fills in:**
```hcl
subscription_id     = ""   # Azure subscription
tenant_id           = ""   # Azure AD tenant
location            = ""   # e.g. "eastus"
environment         = ""   # "dev" or "prod"
postgres_admin_user = ""
postgres_admin_pass = ""   # stored in Azure Key Vault, not in code
```

**Azure AD App Registration** is a manual step documented in `docs/handoff/AAD-SETUP.md` —
Terraform cannot create App Registrations without elevated AAD permissions.

**Environments:** `dev` and `prod` are separate Terraform workspaces and resource groups.
Internal team applies dev first, validates, then applies prod via the manual-approval GitHub
Actions gate.

---

## CI/CD (GitHub Actions)

**`ci.yml` — every pull request:**
- TypeScript type check (zero errors required)
- ESLint + Prettier
- Maven build + unit tests
- Secret scanning (GitHub built-in)
- OWASP Dependency-Check (zero High/Critical required)
- Terraform `validate` + `plan` (plan posted as PR comment)
- 2 human approvals required before merge

**`deploy-dev.yml` — on merge to `main`:**
- Build frontend + backend Docker images → push to GitHub Container Registry
- Terraform apply (`dev` workspace, automatic)
- Deploy to Azure Static Web Apps + App Service (dev)
- Post-deployment smoke tests (health check + one API call)

**`deploy-prod.yml` — manual trigger or git tag:**
- Same build steps
- **Manual approval gate** in GitHub `prod` environment (named reviewer required)
- Terraform apply (`prod` workspace)
- Deploy to prod Azure resources
- Post-deployment smoke tests must pass

**GitHub Secrets (internal team configures):**
```
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
AZURE_CREDENTIALS              ← service principal JSON for Terraform
TF_VAR_POSTGRES_ADMIN_PASS
```

---

## Observability

| Signal | Implementation |
|---|---|
| Structured logs | Logback JSON, `X-Correlation-ID` on every request |
| Distributed traces | Application Insights Java agent via env var |
| Frontend errors | App Insights JS SDK injected by Nginx in production |
| Health check | `GET /actuator/health` (App Service platform monitoring) |
| Dashboards | Azure Monitor workbook template in `infra/monitoring/` |
| Alerts | Terraform provisions: API error rate > 5%, health check failure |
| Log retention | Log Analytics workspace: 365 days (set in Terraform) |

---

## Handoff Package Contents

```
office-seat-reservation/
├── frontend/                  React + TypeScript app
├── backend/                   Spring Boot API
├── infra/                     Terraform (all Azure resources)
├── .github/workflows/         CI/CD pipelines
├── docker-compose.yml         Local dev
├── docker-compose.prod.yml    Production smoke test
├── .env.example               All env vars documented
└── docs/
    ├── handoff/
    │   ├── DEPLOY.md          Step-by-step Azure deployment guide
    │   ├── AAD-SETUP.md       Azure AD app registration walkthrough (with screenshots)
    │   ├── RUNBOOK.md         Incident response, rollback, common ops, on-call escalation
    │   └── SECURITY-APPROVAL-REQUEST.md  Pre-written OID storage approval for Kaleris Security
    └── superpowers/specs/
        └── 2026-05-28-kaleris-migration-design.md
```

**`DEPLOY.md`** covers: prerequisites checklist, first Terraform apply, GitHub Secrets setup,
smoke test verification, and dev → prod promotion steps.

**`RUNBOOK.md`** covers: deployment rollback, database connection failures, auth failures,
adding a new admin user in Azure AD, and on-call escalation path.

**`SECURITY-APPROVAL-REQUEST.md`** is a pre-written request to Kaleris Security for approval
to store Azure AD OIDs in the `reservations` table. Internal team submits it before go-live.

---

## Pre-Production Release Gate

Before the internal team deploys to production, all of the following must be true:

- [ ] Written approval from Kaleris Security for Azure AD OID storage received
- [ ] Zero High/Critical dependency vulnerabilities (CI enforces this)
- [ ] TypeScript type check passes with zero errors
- [ ] Post-deployment smoke tests pass in dev
- [ ] 2 human PR approvals on all merged code
- [ ] Manual approval gate used for prod deployment
- [ ] Azure AD App Registration created and client ID / tenant ID filled in
- [ ] `DEV_AUTH=false` and `VITE_DEV_AUTH=false` confirmed in prod environment
