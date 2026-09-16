import "dotenv/config";
import {
  checkRentIncreaseAllowed,
  RENT_INCREASE_WAITING_PERIOD_MONTHS,
  RENT_INCREASE_MAX_PERCENTAGE,
} from "../src/lib/services/agreement.service";

/**
 * Focused, DB-free test of the rental price-increase regulation: an owner
 * may not increase rent before a 2-year waiting period has elapsed since
 * the rent was last set/changed, and even then the increase may not exceed
 * 11.5% above the current rent. This is a separate rule from rental-income
 * tax (see scripts/verify-tax-calculation.ts) — see docs/ASSUMPTIONS.md for
 * where this figure comes from and what is/isn't independently verified.
 *
 * Run with: npx tsx scripts/verify-rent-increase.ts
 */

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

function monthsAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() - n);
  return d;
}

function main() {
  console.log("== Verifying rental price-increase regulation ==\n");

  // 1. Increase attempted before the 2-year waiting period is blocked.
  {
    const r = checkRentIncreaseAllowed(10000, 11000, monthsAgo(6));
    assert(!r.allowed, "an increase after only 6 months should be blocked");
    assert(r.reason === "TOO_SOON", `expected TOO_SOON, got ${r.reason}`);
    console.log("1. Increase before 2 years -> blocked (TOO_SOON). OK");
  }

  // 2. Increase attempted exactly at the boundary (just under 24 months) is
  //    still blocked; at/after 24 months it is allowed (if within the cap).
  {
    const justUnder = checkRentIncreaseAllowed(10000, 10500, monthsAgo(23));
    assert(!justUnder.allowed && justUnder.reason === "TOO_SOON", "23 months should still be blocked");

    const atBoundary = checkRentIncreaseAllowed(10000, 10500, monthsAgo(RENT_INCREASE_WAITING_PERIOD_MONTHS));
    assert(atBoundary.allowed, "exactly 24 months should be allowed (within the 11.5% cap)");
    console.log("2. Waiting-period boundary (23 vs 24 months). OK");
  }

  // 3. After the waiting period, an increase within the 11.5% cap is allowed.
  {
    const r = checkRentIncreaseAllowed(10000, 11150, monthsAgo(30));
    assert(r.allowed, "an increase to exactly the 11.5% cap should be allowed");
    assert(r.maxAllowedRentEtb === 11150, `expected max allowed 11150, got ${r.maxAllowedRentEtb}`);
    console.log(`3. Increase exactly at the ${RENT_INCREASE_MAX_PERCENTAGE}% cap after the wait -> allowed. OK`);
  }

  // 4. After the waiting period, an increase exceeding 11.5% is blocked.
  {
    const r = checkRentIncreaseAllowed(10000, 12000, monthsAgo(30));
    assert(!r.allowed, "a 20% increase should be blocked even after the waiting period");
    assert(r.reason === "EXCEEDS_MAX_PERCENTAGE", `expected EXCEEDS_MAX_PERCENTAGE, got ${r.reason}`);
    console.log("4. Increase above the cap after the wait -> blocked (EXCEEDS_MAX_PERCENTAGE). OK");
  }

  // 5. A price decrease or no change is always allowed, regardless of timing.
  {
    const decreaseSoon = checkRentIncreaseAllowed(10000, 9000, monthsAgo(1));
    assert(decreaseSoon.allowed, "a decrease should be allowed even 1 month after the last change");
    const sameSoon = checkRentIncreaseAllowed(10000, 10000, monthsAgo(1));
    assert(sameSoon.allowed, "an unchanged price should be allowed even 1 month after the last change");
    console.log("5. Decrease / unchanged price -> always allowed, no waiting period applies. OK");
  }

  // 6. Invalid amounts are rejected.
  {
    let threw = false;
    try {
      checkRentIncreaseAllowed(-100, 500, monthsAgo(30));
    } catch {
      threw = true;
    }
    assert(threw, "a negative current rent must throw");

    threw = false;
    try {
      checkRentIncreaseAllowed(10000, Number.NaN, monthsAgo(30));
    } catch {
      threw = true;
    }
    assert(threw, "NaN new rent must throw");
    console.log("6. Invalid rent amounts are rejected. OK");
  }

  // 7. This rule must never be used as, or confused with, a tax rate: the
  //    result shape carries only rent-increase fields, no tax fields.
  {
    const r = checkRentIncreaseAllowed(10000, 11150, monthsAgo(30));
    const keys = Object.keys(r).sort();
    assert(
      JSON.stringify(keys) === JSON.stringify(["allowed", "maxAllowedRentEtb", "monthsRemaining", "monthsSinceLastChange"].sort()),
      "checkRentIncreaseAllowed's result must only ever contain rent-increase fields — never a tax rate or tax bracket"
    );
    console.log("7. Rent-increase result has no tax-related fields — cannot leak into tax calculation. OK");
  }

  console.log("\nALL CHECKS PASSED ✔");
}

main();
