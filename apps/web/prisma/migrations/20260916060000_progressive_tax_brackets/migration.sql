-- Replace the flat TaxRule.ratePercentage with a progressive TaxBracket
-- table, and record the per-bracket calculation on each TaxAssessment.
-- See docs/ASSUMPTIONS.md: rental income tax is progressive (PwC Worldwide
-- Tax Summaries -- Ethiopia), not a flat 11.5% rate.

-- DropColumn
ALTER TABLE "TaxRule" DROP COLUMN "ratePercentage";

-- AddColumn
ALTER TABLE "TaxAssessment" ADD COLUMN "bracketBreakdown" JSONB;

-- CreateTable
CREATE TABLE "TaxBracket" (
    "id" TEXT NOT NULL,
    "taxRuleId" TEXT NOT NULL,
    "minAmountEtb" DECIMAL(12,2) NOT NULL,
    "maxAmountEtb" DECIMAL(12,2),
    "ratePercentage" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "TaxBracket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxBracket_taxRuleId_idx" ON "TaxBracket"("taxRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxBracket_taxRuleId_sortOrder_key" ON "TaxBracket"("taxRuleId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TaxBracket" ADD CONSTRAINT "TaxBracket_taxRuleId_fkey" FOREIGN KEY ("taxRuleId") REFERENCES "TaxRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
