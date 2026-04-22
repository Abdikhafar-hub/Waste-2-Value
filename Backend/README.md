# Waste2Value Backend

Production-grade Node.js/Express/PostgreSQL backend for the Waste2Value multi-tenant platform.

Waste2Value models the operational chain:

```text
waste -> value -> money
```

Collectors submit waste, org admins approve and assign it, processors convert it into production outputs, products enter movement-based inventory, buyers order products, and the platform records wallet credits, ESG impact, reputation, analytics, energy data, AI insights, and audit history.

## Architecture

- **Runtime:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT access tokens, rotating refresh tokens, bcrypt password hashing
- **Validation:** Zod schemas per module
- **Security:** helmet, cors, compression, global/auth rate limiting, request body limits
- **Testing:** Jest + Supertest
- **Docs:** Swagger UI at `/api/docs`
- **Structure:** route -> controller -> service -> validator, with shared middleware/utilities

## Multi-Tenant Design

Waste2Value has two levels:

- `SUPER_ADMIN`: platform-only. Can create organizations, create the first org admin, inspect platform users/audit/analytics, and suspend users or tenants.
- Organization users: `ORG_ADMIN`, `COLLECTOR`, `PROCESSOR`, `BUYER`. They always operate inside `req.user.organizationId`.

Tenant isolation is enforced by:

- Separate platform routes under `/api/v1/platform`.
- `SUPER_ADMIN` is blocked from organization operations by middleware.
- Organization routes require `requireTenant`.
- Org-level services add `organizationId` server-side to queries.
- Client-supplied `organizationId` is ignored for protected org workflows.
- Role-specific service filters restrict own submissions, assigned processor work, and buyer-owned orders.

## Modules

- `auth`: login, refresh, logout, me, password changes/resets
- `platform`: super-admin organization/user/analytics/audit controls
- `users`: org-admin scoped user management
- `geo`: zones, collection points, processing centers, hotspots
- `waste`: traceable submissions, lifecycle, histories, tags
- `wallet`: ledger wallet, transactions, redemptions, adjustments
- `production`: batches, waste inputs, product outputs, inventory creation
- `products`: tenant products and marketplace visibility
- `inventory`: lots and movements, FIFO stock deduction
- `orders`: buyer orders, transactional stock deduction, status updates
- `esg`: impact summaries, metric snapshots, reports, carbon records
- `reputation`: worker profile recalculation
- `ai`: prediction/recommendation/flag/hotspot insight storage
- `energy`: units, consumers, production, usage, payments
- `audit`: tenant audit log visibility
- `analytics`: dashboard, waste, processor, collector, revenue, market metrics
- `health`: liveness and database readiness

## Setup

```bash
cd Backend
cp .env.example .env
npm install
npm run prisma:generate
```

Edit `.env` with real secrets and database URLs. JWT secrets must be at least 32 characters.

## Database

Create your local PostgreSQL databases, then run:

```bash
npm run prisma:migrate -- --name init
npm run prisma:seed
```

For production/staging deploys:

```bash
npm run prisma:deploy
```

## Run Locally

```bash
npm run dev
```

API base URL:

```text
http://localhost:4000/api/v1
```

Swagger:

```text
http://localhost:4000/api/docs
```

## Tests

Unit tests:

```bash
npm run test:unit
```

Core verification (schema + generated client + unit tests):

```bash
npm run verify
```

Integration tests require a migrated PostgreSQL test database at `TEST_DATABASE_URL`:

```bash
createdb waste2value_test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/waste2value_test?schema=public npm run prisma:migrate -- --name init
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/waste2value_test?schema=public npm run test:integration
```

All tests:

```bash
npm test
```

## Demo Accounts

Seed password defaults to `Password123!` unless `SEED_PASSWORD` is set.

- `superadmin@w2v.local`
- `admin@orga.w2v.local`
- `collector1@orga.w2v.local`
- `collector2@orga.w2v.local`
- `processor@orga.w2v.local`
- `buyer@orga.w2v.local`
- `admin@orgb.w2v.local`
- `collector1@orgb.w2v.local`
- `collector2@orgb.w2v.local`
- `processor@orgb.w2v.local`
- `buyer@orgb.w2v.local`

## Important Business Rules

- Wallet balance is derived from `WalletTransaction`; adjustments and redemptions are ledger entries.
- Inventory availability is derived from `InventoryLot.quantityAvailable` and every stock change creates `InventoryMovement`.
- Orders are transactional and prevent oversell.
- Production batches link source waste submissions to outputs and inventory.
- Waste status transitions are validated centrally.
- ESG, credit, yield, carbon, and reputation formulas live in `src/modules/rules/rules.service.js`.
- Critical changes write `AuditLog` entries with actor, entity, old/new values where useful, IP, and user agent.

## Route Overview

- `/api/v1/auth`
- `/api/v1/platform`
- `/api/v1/users`
- `/api/v1/waste`
- `/api/v1/wallet`
- `/api/v1/production`
- `/api/v1/products`
- `/api/v1/inventory`
- `/api/v1/orders`
- `/api/v1/esg`
- `/api/v1/geo`
- `/api/v1/reputation`
- `/api/v1/ai`
- `/api/v1/energy`
- `/api/v1/audit`
- `/api/v1/analytics`
- `/api/v1/health`

## Assumptions

- Public registration is intentionally not exposed. Super admin creates organizations and initial org admins; org admins create tenant users.
- Payment and delivery integrations are represented internally for now.
- AI is a storage and operations foundation, not a live ML system.
- Energy tracking is structurally complete but intentionally light on tariff logic.
- Decimal quantities are accepted as numbers at the API boundary and stored as Prisma/PostgreSQL decimals.

## Future Extensions

- Add external email/SMS delivery for reset tokens and notifications.
- Add object storage integration for submission images.
- Add row-level security at the database layer if desired.
- Add payment gateway adapters.
- Add geospatial indexes/PostGIS for distance queries.
- Add generated OpenAPI coverage for every schema and response shape.
