# Assumptions and Legal/Business-Rule Notes

This project digitizes a real government workflow (rental registration and
taxation) for a semester project. Where the exact legal rule was not
documented in the source interview/screenshots, we made a reasonable,
**configurable** assumption instead of hard-coding guesses. Nothing below is
asserted as legally authoritative — an authorized administrator can change
every numeric rule through the admin console without a code change.

## Legal sources used

Three authoritative sources informed the rules below:

- **Addis Ababa City Administration Housing Development and Management
  Bureau, Directive No. 184/2025** — "Residential Rent Control and
  Management Directive," issued under the Housing Rent Control and
  Management Proclamation No. 1320/2016. This is the source for the
  registration workflow, the model rental agreement fields, and the
  administrative penalty amounts in Article 22.
- **Income Tax (Amendment) Proclamation No. 1395/2025** — referenced as the
  basis the Addis Ababa City Administration Justice Bureau uses for rental
  income tax. We were not given the specific statutory bracket text from the
  proclamation itself.
- **PwC Worldwide Tax Summaries — Ethiopia** (taxsummaries.pwc.com), rental
  income tax section, supplied directly by the project owner as a
  screenshot on 2026-09-16. This is the source for the actual bracket
  amounts/rates below. **Correction (2026-09-16): an earlier version of this
  project incorrectly treated 11.5% as a flat, universal rental-income tax
  rate. That was wrong — it has been removed.** Rental income tax in
  Ethiopia is progressive, not flat; see below.

## Tax — rental income tax (progressive brackets)

**This section is entirely separate from any rental-price-increase
regulation (the landlord's right to raise rent after a legal waiting
period) — see "Rental Price Increase Regulation" below, which is a
different rule, NOT YET IMPLEMENTED, and must never be confused with the
tax rate.**

- **Confirmed by source** (PwC Worldwide Tax Summaries — Ethiopia,
  individual rental income tax, progressive brackets):

  | Annual rental income (ETB) | Rate |
  |---|---|
  | 0 – 24,000 | 0% |
  | 24,001 – 48,000 | 15% |
  | 48,001 – 84,000 | 20% |
  | 84,001 – 120,000 | 25% |
  | 120,001 – 168,000 | 30% |
  | Over 168,000 | 35% |

  Each bracket's rate applies **only to the slice of income within that
  bracket** (marginal/progressive calculation — the same mechanism as
  personal income tax), never to the whole taxable amount. This is
  implemented as `TaxBracket` rows under a `TaxRule` (not a single
  `ratePercentage` scalar, which cannot represent a progressive table) and
  calculated by the pure function `calculateProgressiveTax()` in
  `src/lib/services/tax.service.ts` — see `scripts/verify-tax-calculation.ts`
  for the bracket-by-bracket, boundary-value, and zero-bracket tests.
  `TaxAssessment.rateApplied` now stores the **blended/effective rate**
  (`taxAmountEtb / taxableAmountEtb × 100`) for display only — it is not a
  statutory rate, and the true per-bracket math is stored alongside it in
  `TaxAssessment.bracketBreakdown`.
- **Project assumption (not confirmed by the source)**: the PwC table is
  explicitly for **individuals**; the same source shows a flat 30% rate for
  "bodies" (companies). Every seeded `PROPERTY_OWNER` in this project is an
  individual, so the individual progressive table is applied uniformly. If
  a company-owned property is ever modeled, this would need revisiting.
- **Project assumption**: because the source states brackets as whole-ETB
  ranges with a literal 1-ETB gap at each boundary (e.g. "0 to 24,000" then
  "24,001 to 48,000"), `calculateProgressiveTax()` reproduces that gap
  exactly as printed rather than smoothing it into continuous ranges. The
  effect is a sub-1-ETB rounding artifact at each boundary, considered
  immaterial for a prototype.
- **Taxable amount**: unchanged from before — the agreement's
  `rentalAmountEtb` is treated as a **monthly** figure; the taxable amount
  for an assessment period is `monthlyRent × number of calendar months in
  the period`. This annualized-equivalent figure is then run through the
  brackets above. **Assumption, not confirmed by the source**: the source
  states brackets in terms of *annual* rental income; how a
  shorter-or-longer-than-12-month assessment period should be pro-rated
  against annual brackets is not specified anywhere available to this
  project, so no proration is applied — whatever `taxableAmountEtb` the
  period computes is run through the brackets as-is.
- **Rate**: stored as a set of `TaxBracket` rows under a `TaxRule`
  (`isActive: true`), not a constant in code. `getActiveTaxRule()` in
  `src/lib/services/config.ts` always reads the currently active rule and
  its brackets. Admins create a new bracket table via **Admin → Tax
  Rules**, which deactivates the old rule (preserving it and its brackets
  for historical assessments) and activates the new one from that moment
  forward.
- **Due date / grace period**: configurable via the `TAX_PAYMENT_GRACE_DAYS`
  system setting (default 30 days after the assessment period ends).

## Rental Price Increase Regulation — NOT IMPLEMENTED

The project owner has separately described a distinct rule: a landlord
cannot increase a tenant's rent before a legally specified waiting period
(stated as two years) has elapsed since the agreement started or the rent
was last increased, and after that period may only increase rent up to a
legally permitted percentage. **This is a real, separate business rule from
rental-income tax, and it is not yet implemented.** No waiting-period
field, last-increase-date tracking, permitted-percentage figure, or
validation exists in this codebase. The exact waiting period and permitted
percentage have not yet been supplied from an authoritative source (the PwC
screenshot provided so far covers only income tax, not this rule) — per
explicit instruction, nothing here is guessed or hard-coded. This will be
implemented once that source is provided, as a change scoped to
`RentalAgreement`/`AgreementVersion` (which already tracks price-change
history) and `updateAgreementPrice()` in `src/lib/services/agreement.service.ts`,
kept independent of `TaxRule`/`TaxBracket`.

## Service Fee

- Configurable via the `SERVICE_FEE_PERCENTAGE` system setting (default 2%
  of the agreement's rental amount). The legacy screenshots show a flat fee
  for a specific contract; we generalized this to a configurable percentage
  since the exact fee schedule wasn't documented.

## Rental Price Validation

- `RentalPriceRule` rows define expected `min`/`max` rent ranges, optionally
  scoped by sub-city, property type, construction type, room count and
  furnished status. `checkRentalPrice()` picks the most specific matching
  rule and flags the agreement (`priceFlagged`) if the declared rent falls
  outside it.
- **The seeded ranges are illustrative sample data only** (see
  `prisma/seed.ts`), not an authoritative price table for Addis Ababa. A real
  deployment would replace these with the actual rules published by the
  housing bureau.

## Penalties

- Seeded `PenaltyRule` amounts follow **Directive No. 184/2025, Article 22**
  directly, expressed as a percentage of one month's registered rent (e.g.
  "two months' rent" is modeled as 200% via `PERCENTAGE_OF_RENT`):
  - Late registration within 3 months of the deadline: 1 month's rent (Art.
    22.1)
  - Late registration beyond 3 months: 2 months' rent (Art. 22.2)
  - Unregistered agreement found by office inspection after 3+ months: 3
    months' rent (Art. 22.3)
  - Failure to register a renewal: 1 month's rent (Art. 22.4)
  - Illegal rent increase, early eviction, or forced advance payment by the
    lessor: 1 month's rent (Art. 22.5)
  - Termination without the required notice period: 2 months' rent (Art.
    22.6)
  - Rent not paid via bank/electronic means: 10% of the monthly rent, per
    late payment (Art. 22.7)
  - False information to misuse an owner incentive: 3 months' rent (Art.
    22.10)
  - Late tax payment: 5% of rent — this one is **not** in the directive; it
    is a reasonable, clearly-configurable placeholder pending a specific tax
    penalty rule.
- **Not implemented**: Article 22.8's escalating property-tax surcharge
  (5%/10%/15%/20%/25%) for a residential unit left vacant/unrented for
  1–5+ years. This needs a "vacancy duration" concept the current schema
  does not track automatically (it would require monitoring how long a
  property sits `APPROVED` with no agreement). Documented here as a known
  gap rather than half-implemented.
- Calculation types (`FIXED`, `PERCENTAGE_OF_RENT`, `PER_DAY_LATE`) are
  generic enough that an admin can model additional penalty categories by
  adding new `PenaltyRule` rows — no schema change needed for new amounts.

## Ownership / Delegation / Heirs

- `Ownership` is a join table between `Property` and `OwnerProfile` with an
  `ownershipType` (`ORIGINAL_OWNER`, `HEIR`, `DELEGATED_REPRESENTATIVE`), an
  optional `sharePercentage`, and a self-relation (`representsOwnership`) so
  a delegated representative can be linked back to the owner they act for.
  This models the three situations named in the brief, but the exact legal
  rules for how heirs' shares are computed, or what documents a delegation
  requires, were not specified — the model is intentionally flexible rather
  than encoding a specific legal formula.

## Identity Verification

- `OwnerProfile.isVerified` / `TenantProfile.isVerified` are booleans a
  housing officer can set after reviewing ID documents. The prototype does
  not integrate with a live Fayda/National ID verification API — this would
  be the natural place to plug one in later.

## Payments

- All payment providers (`CBE`, `TELEBIRR`, `BANK_TRANSFER`, `CASH`) are
  **mock/sandbox implementations** (`src/lib/services/payment-providers.ts`)
  that settle instantly. They implement a `PaymentProvider` interface so a
  real integration can replace the mock without touching the rest of the
  application. No real financial transaction ever occurs in this prototype.

## Payment Method

- Directive No. 184/2025, Article 21(8) requires rent to be paid through a
  bank or other legal electronic means; Article 22(7) penalizes non-electronic
  rent payment at 10% of monthly rent per instance (seeded as a
  `PenaltyRule`, see above). The system still offers a `CASH` mock payment
  provider for flexibility in a classroom demo; a real deployment enforcing
  the directive strictly would remove it or route cash payments straight
  into that penalty rule.

## Agreement Lifecycle

- Housing officer **approval** and **activation** are treated as the same
  event: once a service fee is paid and the officer approves, the agreement
  goes straight to `ACTIVE` and the contract agreement is issued — there is no separate
  "approved but not yet active" waiting state in this prototype.
- Termination requires both an initiating party (owner or tenant) and
  housing officer approval, matching the brief's requirement that
  terminations be reviewable rather than unilateral.
