# Rental & Tax Management System — Web App

Next.js 16 (App Router) modular monolith implementing the Integrated
Digital House Rental and Tax Management System.

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions) + **TypeScript**
- **PostgreSQL** via **Prisma 7** (driver-adapter client, `@prisma/adapter-pg`)
- **Auth.js / NextAuth v5** (credentials + JWT sessions) with a central
  role-permission map (`src/lib/auth/permissions.ts`) — every server action
  re-checks authorization server-side, never trusting the UI alone
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Zod** + **React Hook Form** (`useActionState`) for validated forms
- **Recharts** for the admin dashboard chart
- **qrcode** for contract-agreement QR generation, verified at `/verify/[token]`
- **next-intl** for English / Amharic / Afaan Oromoo UI text

## Architecture

A modular monolith, not microservices:

- `prisma/schema.prisma` — the single source of truth for the domain model
  (users, properties, ownership/heirs/delegation, agreements + version
  history, payments, tax rules/assessments, penalty rules/penalties,
  rental price rules, notifications, audit log, system config).
- `src/lib/services/*` — framework-free business logic (property, tenant,
  agreement, payment, tax, penalty, admin, audit, notifications). These are
  plain async functions against Prisma, reusable and testable outside of
  Next.js — see `scripts/verify-workflow.ts`.
- `src/server/actions/*` — thin Server Action wrappers: validate input with
  Zod, call a service function inside `requireUser`/`requirePermission`,
  revalidate the affected paths.
- `src/app/**` — routes. `src/proxy.ts` (Next 16's renamed `middleware.ts`)
  does an optimistic auth redirect; every dashboard section additionally
  has a server-side `requireRole()` layout guard, and every mutation is
  re-authorized inside the server action itself.

## Getting started

### 1. Database

You need a PostgreSQL connection string. Pick one:

**Option A — Prisma's local dev Postgres (no Docker/root needed):**

```bash
npx prisma dev
```

This prints a `postgres://...` connection string — put it in `.env` as
`DATABASE_URL`.

**Option B — Docker:**

```bash
docker run --name rental-tax-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rental_tax -p 5432:5432 -d postgres:16
```

then `DATABASE_URL="postgres://postgres:postgres@localhost:5432/rental_tax"`.

### 2. Configure environment

```bash
cp .env.example .env
# edit DATABASE_URL, AUTH_SECRET (openssl rand -base64 32)
```

### 3. Install, migrate, seed

```bash
npm install
npm run db:migrate   # applies prisma/migrations
npm run db:seed      # loads sub-cities, tax/penalty/price rules, demo users
```

### 4. Run

```bash
npm run dev
```

Visit http://localhost:3000.

## Demo accounts

All seeded accounts share the password `Passw0rd!1`:

| Role | Email | Notes |
|---|---|---|
| Super Admin | `admin@rhtms.et` | Users, tax/penalty/price rules, audit log |
| Housing Officer | `housing.officer@rhtms.et` | Property & agreement review queue |
| Tax Officer | `tax.officer@rhtms.et` | Tax assessments, penalties |
| Property Owner | `owner1@rhtms.et` | Has an active agreement + issued contract, plus a property mid-review |
| Property Owner | `owner2@rhtms.et` | Property sitting in the housing review queue |
| Tenant | `tenant1@rhtms.et` | Active agreement, issued contract |
| Tenant | `tenant2@rhtms.et` | No agreement yet — good for the search/registration demo |

## Checks

```bash
npm run typecheck        # tsc --noEmit
npm run lint              # eslint
npm run build              # production build
npm run verify:workflow  # end-to-end lifecycle check against the real DB:
                          # property -> review -> agreement -> service fee
                          # payment -> contract agreement/QR -> tax assessment -> tax
                          # payment -> price change history -> penalty ->
                          # termination -> audit trail
```

## What's implemented

Auth + RBAC, property registration/review, tenant registration (self and
owner-initiated), rental agreements with price-range validation, service
fee + tax payment via a mock multi-provider abstraction, contract agreement generation
with QR verification, tax assessment against a configurable rate, penalty
recording/review, agreement price-change and renewal history, termination
workflow, notifications, a full audit trail, role-specific dashboards, an
admin console for tax/penalty/price rules and system config, public
property search, and English/Amharic/Afaan Oromoo UI text.

## What's next

Document upload storage (currently modeled in the schema but no file
upload UI), SMS/email notification delivery (in-app only for now), a
tenant-initiated "request to rent" flow (currently the owner creates the
agreement directly, matching the reference system), and automated tests
beyond the workflow verification script.
