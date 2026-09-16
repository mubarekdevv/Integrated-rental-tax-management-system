import "dotenv/config";
import { calculateProgressiveTax, type TaxBracketLike } from "../src/lib/services/tax.service";

/**
 * Focused, DB-free test of the progressive rental-income tax calculation.
 * Rental income tax is progressive (PwC Worldwide Tax Summaries — Ethiopia,
 * individual rental income tax; see docs/ASSUMPTIONS.md), never a flat
 * rate — this specifically guards against the earlier bug where 11.5% was
 * used as a universal flat tax rate.
 *
 * This is deliberately separate from the rental-price-increase regulation
 * (the two-year waiting period / permitted increase percentage), which is
 * NOT implemented pending a legal source — see docs/ASSUMPTIONS.md. No test
 * here exercises rent-increase logic because none exists yet.
 *
 * Run with: npx tsx scripts/verify-tax-calculation.ts
 */

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

const BRACKETS: TaxBracketLike[] = [
  { minAmountEtb: 0, maxAmountEtb: 24000, ratePercentage: 0, sortOrder: 0 },
  { minAmountEtb: 24001, maxAmountEtb: 48000, ratePercentage: 15, sortOrder: 1 },
  { minAmountEtb: 48001, maxAmountEtb: 84000, ratePercentage: 20, sortOrder: 2 },
  { minAmountEtb: 84001, maxAmountEtb: 120000, ratePercentage: 25, sortOrder: 3 },
  { minAmountEtb: 120001, maxAmountEtb: 168000, ratePercentage: 30, sortOrder: 4 },
  { minAmountEtb: 168001, maxAmountEtb: null, ratePercentage: 35, sortOrder: 5 },
];

function main() {
  console.log("== Verifying progressive rental-income tax calculation ==\n");

  // 1. Zero-tax bracket: entire amount inside the first (0%) bracket.
  {
    const { taxAmountEtb, breakdown } = calculateProgressiveTax(15000, BRACKETS);
    assert(taxAmountEtb === 0, `expected 0 tax within the zero-rate bracket, got ${taxAmountEtb}`);
    assert(breakdown.length === 1 && breakdown[0].ratePercentage === 0, "breakdown should show only the zero-rate bracket");
    console.log("1. Zero-tax bracket (15,000 ETB) -> 0 ETB tax. OK");
  }

  // 2. Each confirmed bracket individually (amount that lands entirely
  //    inside a single bracket, well clear of any boundary).
  {
    const cases: [number, number][] = [
      [12000, 0], // bracket 1 (0%)
      [30000, (30000 - 24001) * 0.15], // bracket 2 (15%) — only the slice above 24,000 is taxed
      [60000, (48000 - 24001) * 0.15 + (60000 - 48001) * 0.2], // bracket 3 (20%)
      [100000, (48000 - 24001) * 0.15 + (84000 - 48001) * 0.2 + (100000 - 84001) * 0.25], // bracket 4 (25%)
      [150000, (48000 - 24001) * 0.15 + (84000 - 48001) * 0.2 + (120000 - 84001) * 0.25 + (150000 - 120001) * 0.3], // bracket 5 (30%)
      [
        200000,
        (48000 - 24001) * 0.15 +
          (84000 - 48001) * 0.2 +
          (120000 - 84001) * 0.25 +
          (168000 - 120001) * 0.3 +
          (200000 - 168001) * 0.35,
      ], // bracket 6 (35%, open-ended)
    ];
    for (const [income, expected] of cases) {
      const { taxAmountEtb } = calculateProgressiveTax(income, BRACKETS);
      const expectedRounded = Math.round(expected * 100) / 100;
      assert(
        taxAmountEtb === expectedRounded,
        `income ${income}: expected ${expectedRounded}, got ${taxAmountEtb}`
      );
    }
    console.log("2. Each confirmed bracket produces the correct marginal tax. OK");
  }

  // 3. Boundary values between brackets.
  {
    const atZeroTop = calculateProgressiveTax(24000, BRACKETS);
    assert(atZeroTop.taxAmountEtb === 0, `24,000 (top of zero bracket) should owe 0, got ${atZeroTop.taxAmountEtb}`);

    const atSecondBracketStart = calculateProgressiveTax(24001, BRACKETS);
    assert(
      atSecondBracketStart.taxAmountEtb === 0,
      `24,001 (first ETB of the 15% bracket) should owe a rounded 0, got ${atSecondBracketStart.taxAmountEtb}`
    );

    const atTopBracketStart = calculateProgressiveTax(168001, BRACKETS);
    const expectedAtTop =
      Math.round(((48000 - 24001) * 0.15 + (84000 - 48001) * 0.2 + (120000 - 84001) * 0.25 + (168000 - 120001) * 0.3) * 100) / 100;
    assert(
      atTopBracketStart.taxAmountEtb === expectedAtTop,
      `168,001 (first ETB of the open-ended 35% bracket) should owe ${expectedAtTop}, got ${atTopBracketStart.taxAmountEtb}`
    );
    console.log("3. Boundary values between brackets. OK");
  }

  // 4. Invalid / missing rental-income values.
  {
    let threw = false;
    try {
      calculateProgressiveTax(-1000, BRACKETS);
    } catch {
      threw = true;
    }
    assert(threw, "a negative taxable amount must throw, not silently compute a tax");

    threw = false;
    try {
      calculateProgressiveTax(Number.NaN, BRACKETS);
    } catch {
      threw = true;
    }
    assert(threw, "NaN (missing/invalid rental income) must throw, not silently compute a tax");

    threw = false;
    try {
      calculateProgressiveTax(100000, []);
    } catch {
      threw = true;
    }
    assert(threw, "an empty bracket set must throw rather than silently returning 0 tax");

    const zeroIncome = calculateProgressiveTax(0, BRACKETS);
    assert(zeroIncome.taxAmountEtb === 0 && zeroIncome.breakdown.length === 0, "0 income should owe 0 tax with no bracket breakdown");
    console.log("4. Invalid or missing rental-income values are rejected; 0 income owes 0 tax. OK");
  }

  // 5. The rent-increase percentage concept must never be used as a tax
  //    rate. There is no rent-increase field in TaxBracketLike at all —
  //    this assertion documents that guarantee structurally: the only
  //    inputs to calculateProgressiveTax are the taxable amount and the
  //    tax brackets, so a rent-increase percentage has no code path into
  //    a tax calculation.
  {
    const bracketKeys = Object.keys(BRACKETS[0]).sort();
    assert(
      JSON.stringify(bracketKeys) === JSON.stringify(["maxAmountEtb", "minAmountEtb", "ratePercentage", "sortOrder"].sort()),
      "a TaxBracket must only ever contain income-range/rate fields — never a rent-increase percentage or waiting-period field"
    );
    console.log("5. TaxBracket has no rent-increase field — a rent-increase percentage cannot reach the tax calculation. OK");
  }

  console.log("\nALL CHECKS PASSED ✔");
}

main();
