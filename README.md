# Integrated Digital House Rental and Tax Management System

A modular-monolith Next.js application that digitizes the Ethiopian
residential rental lifecycle: property registration, tenant registration,
rental agreements, housing office review/approval, service fees, WUL
(rental contract) generation with QR verification, tax assessment, and
penalty/compliance tracking — connecting property owners, tenants, housing
officers, tax officers and system administrators on one platform.

The application lives in [`apps/web`](./apps/web). See
[`apps/web/README.md`](./apps/web/README.md) for setup and run instructions,
and [`docs/ASSUMPTIONS.md`](./docs/ASSUMPTIONS.md) for the legal/business-rule
assumptions made where the source requirements didn't specify an exact rule.

## Repository layout

```
apps/web/     Next.js application (this is the whole system — a modular
              monolith, not a set of separate services)
docs/         Assumptions and other project documentation
```

`database/`, `services/`, `infrastructure/` and `tests/` from the original
scaffold were placeholders for a microservices-style layout; this project
intentionally uses a modular monolith instead (see the architecture
rationale in `apps/web/README.md`), so application code, the Prisma schema
and the database migrations all live together under `apps/web`.
