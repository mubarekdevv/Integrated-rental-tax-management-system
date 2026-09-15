# Assumptions and Legal/Business-Rule Notes

This project digitizes a real government workflow (rental registration and
taxation) for a semester project. Where the exact legal rule was not
documented in the source interview/screenshots, we made a reasonable,
**configurable** assumption instead of hard-coding guesses. Nothing below is
asserted as legally authoritative — an authorized administrator can change
every numeric rule through the admin console without a code change.

## Tax

- **Rate**: 11.5% rental income tax, stored as a `TaxRule` row
  (`isActive: true`), not a constant in code. `getActiveTaxRule()` in
  `src/lib/services/config.ts` always reads the currently active rule.
  Admins create a new rate via **Admin → Tax Rules**, which deactivates the
  old rule (preserving it for historical assessments) and activates the new
  one from that moment forward.
- **Taxable amount**: the agreement's `rentalAmountEtb` is treated as a
  **monthly** figure; the taxable amount for an assessment period is
  `monthlyRent × number of calendar months in the period`. This is an
  assumption — the real rule may differ (e.g., prorate by days, or tax
  annually regardless of payment frequency).
- **Due date / grace period**: configurable via the `TAX_PAYMENT_GRACE_DAYS`
  system setting (default 30 days after the assessment period ends).

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

- Three sample `PenaltyRule` types are seeded: delayed registration
  (per-day-late), non-compliance (fixed amount), and late tax payment
  (percentage of rent). These are a starting framework, not an exhaustive
  codification of every penalty in Ethiopian housing/tax law.
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

## Agreement Lifecycle

- Housing officer **approval** and **activation** are treated as the same
  event: once a service fee is paid and the officer approves, the agreement
  goes straight to `ACTIVE` and the WUL is issued — there is no separate
  "approved but not yet active" waiting state in this prototype.
- Termination requires both an initiating party (owner or tenant) and
  housing officer approval, matching the brief's requirement that
  terminations be reviewable rather than unilateral.
