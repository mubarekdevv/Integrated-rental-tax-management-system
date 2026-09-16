# RHTMS — Presentation Summary

Integrated Digital House Rental and Tax Management System. This document
summarizes the project for a Software Project Management presentation. It is
derived from the current, running implementation in this repository — see
`README.md`, `apps/web/README.md`, and `docs/ASSUMPTIONS.md` for the
underlying technical detail this document draws from.

---

# Project Overview

RHTMS is a web application that digitizes the residential rental lifecycle in
Addis Ababa: property registration, tenant registration, rental agreements,
housing-office review and approval, service-fee and rental-income-tax
payment, contract-agreement issuance with QR verification, and
penalty/compliance tracking. It connects five roles — Property Owner, Tenant,
Housing Officer, Tax Officer, and Super Admin — on one shared platform,
served in English, Amharic, and Afaan Oromoo.

It is implemented as a single Next.js/React full-stack web application (a
**modular monolith**, not microservices) with PostgreSQL as the database of
record.

---

# Problem Statement

The rental registration and taxation process this project models is
traditionally paper-based and split across separate offices (housing
registration and tax assessment), with no shared digital record between
them. This creates:

- Fragmented processes — property/tenant/agreement data is captured
  separately from tax and compliance data.
- No shared status visibility — an owner or tenant cannot easily see where
  their submission stands.
- Difficult verification — no simple way for a third party to confirm a
  rental contract is genuine.
- Weak auditability — no consolidated record of who approved, changed, or
  paid what, and when.
- Tax calculation risk — rental-income tax in Ethiopia is progressive
  (bracketed), and a system that models it incorrectly (e.g. as a single
  flat rate) produces materially wrong tax amounts. This project itself
  encountered and corrected exactly this error during development (see
  *Change Management* below).

**Scope note:** this project does not claim to replace or integrate with any
specific named government system. It is an academic prototype modeling the
described workflow, grounded where possible in real regulatory text (see
*Non-Functional Requirements* and `docs/ASSUMPTIONS.md`).

---

# Existing Process/System and Identified Gaps

| Existing process (as described in the project brief) | Gap |
|---|---|
| Property/tenant/agreement registration on paper or in disconnected records | No single, structured, searchable record |
| Housing-office approval handled manually | No enforced workflow or status tracking |
| Rental-income tax assessed separately from registration | No shared data between registration and tax stages |
| Contract authenticity verified manually / in person | No self-service, verifiable proof of a genuine agreement |
| Compliance/penalty tracking informal or paper-based | No consolidated audit trail |

## What this project newly developed / integrated

Everything below is **new work implemented in this repository** — it did not
exist as a prior system this project modified:

- A single database-backed application covering the full lifecycle:
  property registration → housing review → tenant registration → rental
  agreement → price validation → service fee → approval → contract/QR
  generation → tax assessment → payment → active rental → renewal/termination.
- Role-based dashboards and permissions for all five roles, enforced at the
  request-routing layer, not just hidden in the UI (see *Security and Access
  Control*).
- A public, unauthenticated QR-code verification page for any issued
  contract agreement.
- A configurable, database-backed rules engine for rental-income tax
  brackets, penalty amounts, and rental-price validation ranges, editable by
  an administrator without a code change.
- A full audit trail (actor, action, before/after values) on sensitive
  writes.
- A complete English / Amharic / Afaan Oromoo translation of the UI across
  the property, agreement, tenant-registration, payment, tax, penalty, and
  contract/verification workflows, plus all five role dashboards.

---

# Proposed Solution

One shared, database-backed system replaces paper records for every office
in the rental lifecycle:

- A configurable rules engine (progressive tax brackets, penalty amounts,
  price ranges) lets an administrator update policy without a code change.
- Every record carries an explicit status (Draft → Submitted → Under Review
  → Approved/Rejected → Active → Terminated) visible to every relevant
  party.
- A QR-coded contract agreement lets anyone verify a rental contract's
  authenticity without contacting an office.
- An audit log and in-app notifications give every party visibility into
  what happened and when.
- The interface renders in the user's chosen language across the
  implemented workflow.

---

# Project Objectives

**General objective:** design and implement a single digital platform that
manages the residential rental lifecycle — from property registration to
tax compliance — connecting property owners, tenants, housing offices and
tax offices under role-based access.

**Specific objectives:**

1. Allow property owners to register and manage properties and rental
   agreements digitally.
2. Allow tenants to search listed properties and be registered onto rental
   agreements.
3. Give housing officers a review/approval workflow for property
   registrations and agreements.
4. Give tax officers a way to assess rental-income tax against a correctly
   sourced, configurable, progressive bracket table.
5. Generate a verifiable digital contract agreement (with QR code) once an
   agreement is approved.
6. Enforce role-based access control and record-level ownership so users
   can only act on their own records.
7. Serve the interface in English, Amharic, and Afaan Oromoo.
8. Maintain a full audit trail of approvals, payments, and status changes.

---

# Stakeholders and Roles

| Role | Responsibility |
|---|---|
| Property Owner | Registers properties, creates rental agreements, pays service fees, views tax status |
| Tenant | Searches listed properties, is registered onto agreements, pays rent-related fees, requests termination |
| Housing Officer | Reviews/approves properties and agreements, reviews penalties, manages corrections and terminations |
| Tax Officer | Assesses rental-income tax against the active bracket table, tracks overdue tax, reviews penalties |
| Super Admin | Manages users, tax brackets, penalty/price rules, system configuration, audit log, and reports |
| Public / Verifier | Anyone can scan a contract's QR code to confirm it is a genuine, system-issued agreement — no login required |

---

# Functional Requirements

Derived from what is actually implemented and demonstrable:

- User registration and login (owner, tenant self-registration; officer/admin
  accounts are seeded, not self-registrable).
- Property registration by an owner, including type, construction, rooms,
  size, location, and asking rent.
- Housing-officer review of a submitted property: approve, reject, or
  request correction, with a recorded reason.
- Tenant registration (self-service or owner-initiated with a temporary
  password).
- Rental agreement creation by an owner for a registered tenant on an
  approved property, with automatic rental-price validation against
  configured expected ranges.
- Service-fee payment required before an agreement can be approved.
- Housing-officer approval of an agreement, which activates it and issues a
  contract agreement with a QR code.
- Public, unauthenticated verification of a contract agreement by its QR
  token.
- Tax assessment by a tax officer against the active progressive tax
  bracket table, with a stored per-bracket breakdown.
- Tax and penalty payment via a mock multi-provider payment flow.
- Rental-price change and agreement renewal, both recorded as versioned
  history rather than overwriting prior terms, and gated by the rental
  price-increase regulation (a rent increase is only allowed after a 2-year
  wait since the rent was last set, capped at 11.5% above the current
  rent — see *Change Management*).
- Agreement termination requiring an initiating party and housing-officer
  approval.
- Penalty recording, review, approval, and payment.
- In-app notifications for approvals, rejections, payments, tax
  assessments, and penalty actions.
- Admin console for user management, tax-bracket/penalty/price-rule
  management, system configuration, audit log, and revenue reports.

---

# Non-Functional Requirements

| Category | Requirement | How it's met |
|---|---|---|
| Security | Only authenticated, authorized users can act on records | Auth.js credentials + JWT sessions; central role-permission map re-checked on every server action |
| Authorization | A user can only access/modify their own records or their role's scope | Record-level ownership checks; role enforced in request middleware (see *Security and Access Control*) |
| Auditability | Every sensitive change is traceable | `AuditLog` records actor, action, and before/after values |
| Data integrity | Historical records are never silently overwritten | Versioned agreement history (`AgreementVersion`); deactivated (not deleted) tax/penalty/price rules |
| Localization | The UI is usable in the user's preferred language | next-intl, English/Amharic/Afaan Oromoo, cookie-based locale |
| Maintainability | Business rules (tax, penalties, price ranges) can change without a code deploy | Stored as configurable database rows, editable via the admin console |
| Testability | Core business logic can be verified without a browser | Framework-independent service layer + `verify:workflow`, `verify:tax`, and `verify:rent-increase` scripts |

---

# System Architecture

A **layered, modular-monolith** architecture (one deployable application,
internally separated by responsibility — not a microservices split):

```
User Interface (Next.js App Router, React, Tailwind CSS, shadcn/ui)
        |
Authentication / Authorization (Auth.js sessions, role-permission map,
        request-middleware role gate, record-level ownership checks)
        |
Application / Business Logic (framework-independent service modules:
        property, agreement, payment, tax, penalty, admin, audit,
        notifications — plain async functions, callable outside Next.js)
        |
Data Access (Prisma ORM, typed queries and migrations)
        |
PostgreSQL (single source of truth — 23 models covering users, properties,
        ownership/heirs/delegation, agreements + version history, payments,
        tax rules/brackets/assessments, penalty rules/penalties, rental
        price rules, notifications, audit log, system configuration)
```

Key structural decisions:

- `src/lib/services/*` holds business logic as plain functions against
  Prisma — reusable and testable outside of any HTTP request.
- `src/server/actions/*` are thin Server Action wrappers: validate input,
  authorize, call a service function, revalidate affected pages.
- `src/proxy.ts` (Next.js 16's renamed middleware) performs the role-gate
  check on every request to a dashboard route — this is the layer that
  closed the cross-role access bug described under *Security*.

---

# Technologies and Tools

Only tools actually evidenced in this repository:

| Category | Tool |
|---|---|
| Language | TypeScript |
| Framework | Next.js 16 (App Router, Turbopack, Server Actions), React 19 |
| Styling / UI | Tailwind CSS v4, shadcn/ui (Base UI primitives) |
| Forms / validation | React Hook Form, Zod |
| Database | PostgreSQL |
| ORM / migrations | Prisma 7 (driver-adapter client) |
| Authentication | Auth.js (NextAuth v5), credentials provider, JWT sessions |
| Internationalization | next-intl (English / Amharic / Afaan Oromoo) |
| Charts | Recharts (admin reports) |
| QR generation | `qrcode` package, verified at `/verify/[token]` |
| Runtime / package manager | Node.js, npm |
| Version control | Git, GitHub (`github.com/mubarekdevv/Integrated-rental-tax-management-system`) |
| Configuration | Environment variables (`.env`, `.env.example`) |

---

# Project Management Approach

This project was developed by a small team/individual contributor working
directly against the codebase, using **Git-based iterative development**:
each change was scoped, implemented, validated with automated checks, and
committed with a descriptive message before moving to the next change. No
formal ceremony framework (e.g. Scrum sprints, daily standups) is evidenced
in this repository, so none is claimed here.

The practical process actually followed, evidenced by commit history and
the validation scripts in `apps/web/package.json`:

1. Scope a change (feature, bug fix, or correction).
2. Implement it, keeping unrelated code untouched.
3. Run the project's own validation gates before considering it done:
   `npm run typecheck`, `npm run lint`, `npm run verify:i18n`,
   `npm run verify:tax`, `npm run verify:rent-increase`, `npm run verify:workflow`.
4. Record legal/business-rule assumptions in `docs/ASSUMPTIONS.md` when the
   exact rule wasn't specified by the source material.
5. Commit with a message describing the change.

---

# Planning and Work Breakdown

Reconstructed from the actual Git commit history (`git log`), which is the
only evidenced record of project activities:

| Phase | What it covered |
|---|---|
| 1. Project initialization | Repository/project structure set up |
| 2. Foundation + core lifecycle | Core data model and the property → agreement → tax → payment lifecycle built |
| 3. Security hardening, i18n wiring, navigation, terminology correction | Access-control hardening, initial English/Amharic/Afaan Oromoo wiring, full navigation, contract-document terminology corrected (Amharic "WUL" → "Contract Agreement") |
| 4. Targeted bug fixes | Language-switcher and login-routing defects found and fixed |
| 5. Access-control fix | A cross-role dashboard access bug found and fixed, enforced in request middleware |
| 6. Tax model correction | Flat, unverified tax rate replaced with a sourced, progressive tax-bracket model |
| 7. Full localization pass | Translation coverage extended across the property, agreement, payment, tax, penalty, and contract workflows |
| 8. Presentation preparation | Presentation deck and this summary document prepared |

---

# Team Responsibilities

The repository's commit history evidences a single contributor
(`Mubarek Hussein`) across all commits. If this is being presented as a
team project, insert your team's actual member names and role assignments
here — they are not invented in this document since no additional
contributor names are evidenced in the repository.

| Name | Role | Area |
|---|---|---|
| [Insert] | [Insert] | [Insert] |

---

# Risks and Mitigation

Real risks actually encountered during development, and how each was
handled (not a generic/invented risk register):

| Risk | Impact | Mitigation actually applied |
|---|---|---|
| Local development database (PGlite-based) instability under load | Development blocked, stale/locked state | Restart procedure; migration re-applied via `prisma migrate deploy` when the shadow database became unusable |
| Incorrect business-rule assumption reaching production code (flat 11.5% tax rate) | Materially wrong tax amounts | Root-caused against a real source (PwC Worldwide Tax Summaries — Ethiopia), replaced with a progressive bracket model, existing data recomputed |
| Access-control gap (cross-role dashboard access) | A user could view another role's dashboard data | Found via targeted review, fixed by enforcing the role check in request middleware, re-verified across all role combinations |
| UI framework/library edge cases (Base UI vs. Radix API differences) | Non-functional controls (language switcher, login link visibility) | Root-caused against library source/docs, fixed with the smallest correct change |
| Legal/business rules not fully specified in source material | Risk of inventing incorrect rules | Documented explicitly as assumptions in `docs/ASSUMPTIONS.md`; a rule was left unimplemented until its figures were supplied (e.g. the rental price-increase regulation, since implemented per project-owner-supplied figures rather than a guess — see *Change Management*) |

---

# Implementation

Implemented in `apps/web` as a Next.js 16 application. Highlights:

- **Property lifecycle** — registration, housing review (approve / reject /
  correction), status-gated agreement creation.
- **Agreement lifecycle** — creation, price validation, service-fee
  payment, housing approval → activation, contract/QR issuance, renewal,
  termination.
- **Tax** — progressive rental-income tax brackets (see *Change Management*
  for the correction history), configurable via the admin console, with a
  stored per-bracket breakdown for transparency.
- **Payments** — a mock multi-provider abstraction (CBE, Telebirr, Bank
  Transfer, Cash) behind a common interface; explicitly simulated, no real
  financial transaction occurs.
- **Notifications** — in-app, triggered by real business events (approvals,
  rejections, payments, tax assessments, penalties).
- **Localization** — English, Amharic, Afaan Oromoo across the implemented
  workflow (property, agreement, tenant registration, payment, tax,
  penalty, contract/verification, and all five dashboards).
- **Admin console** — user management, tax-bracket/penalty/price-rule
  management, system configuration, audit log, and live revenue reports.

---

# Testing and Verification

| Check | What it verifies |
|---|---|
| `npm run typecheck` | TypeScript correctness across the codebase |
| `npm run lint` | Code-quality/style rules (ESLint) |
| `npm run verify:i18n` | All three locale catalogs are valid JSON with matching keys; the locale-switch mechanism revalidates correctly |
| `npm run verify:tax` | The progressive tax calculation: each bracket, the zero-rate bracket, boundary values, and invalid/negative input, run independently of the database |
| `npm run verify:rent-increase` | The rent-increase regulation: blocked before 2 years, allowed at/after 2 years within the 11.5% cap, blocked above the cap, decreases always allowed, invalid input rejected — run independently of the database |
| `npm run verify:workflow` | A real 16-step end-to-end lifecycle against the actual database: property → review → agreement → service fee → approval/contract issuance → cross-owner authorization block → tax assessment → tax payment → price-change history (including a rent increase, gated by the price-increase regulation) → penalty → renewal → termination → audit trail → history preservation |

All six checks pass against the current implementation. Manual/HTTP-level
verification (real session cookies against the running server) additionally
confirmed: role-based dashboard access control, logout session clearing,
public QR contract verification, and locale switching across all three
languages on representative pages.

---

# Security and Access Control

- **Authentication** — Auth.js (NextAuth v5), credentials provider with
  bcrypt-hashed passwords, JWT session strategy (the signed cookie is the
  session; no server-side session table).
- **Role-based access control** — a central permission map is the single
  source of truth for what each of the five roles may do; every server
  action re-checks it rather than trusting the UI.
- **Record-level authorization** — ownership checks prevent one property
  owner from reading or writing another owner's property or agreement,
  verified by an automated negative test in `verify:workflow`.
- **Route-level role enforcement** — every dashboard section is gated in
  request middleware so an authenticated user of one role cannot open
  another role's dashboard by navigating directly to its URL. **This was
  found broken during a final review** (the per-section layout guard was
  not reliably re-invoked by the framework on every request) **and has
  since been fixed** by moving the check into middleware, which is
  guaranteed to run on every request; re-verified across all role
  combinations.
- **Audit trail** — every write to a sensitive record (approvals, payments,
  rule changes) is logged with actor, action, and before/after values.

---

# Change Management

Three examples of how a discovered defect or missing requirement was
actually handled in this project, illustrating the change-management
practice followed (root-cause, correct, verify, document):

1. **Terminology correction.** The Amharic loanword "WUL" for the rental
   contract document was identified as inappropriate for the intended
   English/Amharic/Afaan Oromoo audience and renamed to "Contract
   Agreement" across the UI, routes, and generated document numbers.

2. **Tax-model correction.** An earlier version of the tax calculation used
   a single flat rate (11.5%, from an early project interview figure) for
   all rental income. This was identified as incorrect: Ethiopian
   rental-income tax is **progressive** (bracketed), confirmed against PwC
   Worldwide Tax Summaries — Ethiopia. The data model was changed from a
   single `TaxRule.ratePercentage` field to a `TaxBracket` table (a genuine
   schema change, judged necessary since a flat rate cannot represent a
   progressive table), the calculation was rewritten as a pure, unit-tested
   function, and existing seeded/demo tax records were recomputed rather
   than left inconsistent.

3. **Rental price-increase regulation added.** Once the project owner
   supplied the specific figures (a 2-year waiting period, an 11.5% cap on
   any increase), this was implemented as its own rule in
   `agreement.service.ts`, enforced wherever rent can change (both an
   explicit price update and a renewal that also changes rent), with its
   own dedicated test script.

   **Important clarification, since both rules happen to involve the same
   number:** the 11.5% figure that was *incorrectly* used as a flat tax
   rate (item 2, now removed) and the 11.5% figure now used as the
   rent-increase cap (item 3) are **coincidentally the same percentage but
   entirely unrelated rules**, from different areas of the system, sourced
   at different times. Rental-income tax now uses the progressive 0–35%
   bracket table exclusively; 11.5% appears nowhere in the tax calculation
   anymore. The only place 11.5% appears in this system today is as the
   rent-increase cap.

Every code change in this project was gated by the same validation scripts
listed under *Testing and Verification* before being considered complete,
and legal/business-rule assumptions are tracked centrally in
`docs/ASSUMPTIONS.md` rather than left implicit in code comments scattered
across files.

---

# Limitations

- Payment integrations (CBE, Telebirr, bank transfer) are **simulated** —
  no real bank or mobile-money connection exists.
- The rental-income tax brackets are sourced (PwC Worldwide Tax Summaries —
  Ethiopia) and progressive, but a small (sub-2 ETB) rounding difference
  can occur for income amounts landing exactly on a bracket boundary —
  identified during a final technical review and intentionally left
  unfixed pending a decision on the correct rounding convention. This is a
  calculation-precision issue, not a misunderstanding of the bracket
  structure.
- The **rental price-increase regulation** (a landlord may only raise rent
  after a 2-year wait, capped at 11.5% above the current rent) is now
  implemented, but the 2-year period and 11.5% cap are project-owner-supplied
  figures, not independently verified against a cited proclamation article
  (unlike the tax brackets) — see `docs/ASSUMPTIONS.md`. The values are
  currently fixed code constants, not yet exposed as admin-configurable
  settings the way tax brackets and penalty rules are.
- Identity verification is a manual officer decision (a checkbox), not a
  live government ID-verification API.
- Notifications are in-app and event-triggered only — no SMS/email
  delivery, no scheduled reminders.
- Property document upload (title deeds, ID scans) is modeled in the
  database schema but has no upload UI yet.
- No production deployment/hosting infrastructure exists — this runs as a
  local development prototype.
- This is an academic prototype: legal/regulatory grounding is documented
  where a real source was available (see `docs/ASSUMPTIONS.md`), but no
  claim of legal compliance is made beyond what those sources support.

---

# Future Improvements

- Make the rent-increase waiting period and cap percentage admin-configurable
  (currently fixed code constants), and verify the 11.5% figure against a
  specific cited proclamation article.
- Resolve the known tax-bracket boundary rounding edge case.
- Real payment-gateway integration behind the existing payment-provider
  interface.
- Real government identity verification (e.g. Fayda National ID).
- SMS/email delivery and scheduled reminders for upcoming tax/rent due
  dates.
- A tenant-initiated "request to rent" flow, as an alternative to
  owner-only agreement creation.
- Document upload for property titles/IDs.
- Production deployment with proper hosting, backups, and monitoring.

---

# Conclusion

RHTMS digitizes a fragmented, paper-based rental registration and taxation
process into one shared, role-based, auditable, multi-language platform.
Across development, the project identified and corrected real defects in
its own implementation — a terminology error, a cross-role authorization
gap, and an incorrect tax-rate model — through root-cause investigation,
minimal targeted fixes, and automated re-verification, rather than
papering over them. The result is a working prototype with real business
logic, disclosed limitations, and a clear, evidenced boundary between what
is implemented, what is simulated, and what remains future work.
