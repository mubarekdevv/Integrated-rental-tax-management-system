import "dotenv/config";

/**
 * End-to-end smoke test of the core rental lifecycle, exercised directly
 * against the service layer (the same functions the server actions call).
 * There is no headless browser available in this environment, so this
 * script is how the full owner -> housing -> payment -> contract agreement -> tax ->
 * termination workflow described in the project brief is verified.
 *
 * Run with: npm run verify:workflow
 */
import { prisma } from "../src/lib/db/prisma";
import { createProperty, submitProperty, reviewProperty } from "../src/lib/services/property.service";
import {
  createAgreement,
  submitAgreement,
  reviewAgreement,
  updateAgreementPrice,
  renewAgreement,
  approveTermination,
  requestTermination,
} from "../src/lib/services/agreement.service";
import { initiatePayment } from "../src/lib/services/payment.service";
import { assessTax, calculateProgressiveTax } from "../src/lib/services/tax.service";
import { createPenalty, reviewPenalty } from "../src/lib/services/penalty.service";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

// Must match the brackets seeded in prisma/seed.ts (PwC Worldwide Tax
// Summaries — Ethiopia, individual rental income tax). See docs/ASSUMPTIONS.md.
const DEMO_TAX_BRACKETS = [
  { minAmountEtb: 0, maxAmountEtb: 24000, ratePercentage: 0, sortOrder: 0 },
  { minAmountEtb: 24001, maxAmountEtb: 48000, ratePercentage: 15, sortOrder: 1 },
  { minAmountEtb: 48001, maxAmountEtb: 84000, ratePercentage: 20, sortOrder: 2 },
  { minAmountEtb: 84001, maxAmountEtb: 120000, ratePercentage: 25, sortOrder: 3 },
  { minAmountEtb: 120001, maxAmountEtb: 168000, ratePercentage: 30, sortOrder: 4 },
  { minAmountEtb: 168001, maxAmountEtb: null, ratePercentage: 35, sortOrder: 5 },
];

async function main() {
  console.log("== Verifying end-to-end rental lifecycle ==\n");

  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "owner1@rhtms.et" } });
  const housingOfficer = await prisma.user.findUniqueOrThrow({ where: { email: "housing.officer@rhtms.et" } });
  const taxOfficer = await prisma.user.findUniqueOrThrow({ where: { email: "tax.officer@rhtms.et" } });
  const tenant = await prisma.user.findUniqueOrThrow({ where: { email: "tenant2@rhtms.et" } });
  const tenantProfile = await prisma.tenantProfile.findUniqueOrThrow({ where: { userId: tenant.id } });
  const bole = await prisma.subCity.findUniqueOrThrow({ where: { name: "Bole" } });

  console.log("1. Owner registers a new property (DRAFT)...");
  const property = await createProperty({
    ownerUserId: owner.id,
    title: "Verification Test Apartment",
    propertyType: "APARTMENT",
    constructionType: "CONCRETE",
    numberOfRooms: 3,
    furnishedStatus: "FURNISHED",
    subCityId: bole.id,
    houseNumber: `VERIFY-${Date.now()}`,
    askingRentEtb: 20000,
  });
  assert(property.status === "DRAFT", "property should start as DRAFT");
  console.log(`   Property ${property.code} created.\n`);

  console.log("2. Owner submits the property for review...");
  const submitted = await submitProperty(property.id, owner.id);
  assert(submitted.status === "SUBMITTED", "property should be SUBMITTED");
  console.log("   Submitted.\n");

  console.log("3. Housing officer approves the property...");
  const approvedProperty = await reviewProperty(property.id, housingOfficer.id, "APPROVED", "Looks good.");
  assert(approvedProperty.status === "APPROVED", "property should be APPROVED");
  assert(approvedProperty.isListed === true, "approved property should be listed for search");
  console.log("   Approved and listed.\n");

  console.log("4. Owner creates a rental agreement with the tenant...");
  const agreement = await createAgreement({
    propertyId: property.id,
    tenantId: tenantProfile.id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    rentalAmountEtb: 20000,
    paymentFrequency: "MONTHLY",
    createdById: owner.id,
  });
  assert(agreement.status === "DRAFT", "agreement should start as DRAFT");
  console.log(`   Agreement ${agreement.agreementNumber} created, service fee ${agreement.serviceFeeAmountEtb} ETB.\n`);

  console.log("5. Owner submits the agreement...");
  await submitAgreement(agreement.id, owner.id);
  console.log("   Submitted.\n");

  console.log("6. Approval should fail before the service fee is paid...");
  let blocked = false;
  try {
    await reviewAgreement(agreement.id, housingOfficer.id, "APPROVED");
  } catch {
    blocked = true;
  }
  assert(blocked, "agreement approval must be blocked until the service fee is paid");
  console.log("   Correctly blocked.\n");

  console.log("7. Owner pays the service fee via the mock CBE provider...");
  await initiatePayment({
    purpose: "SERVICE_FEE",
    providerType: "CBE",
    amountEtb: Number(agreement.serviceFeeAmountEtb),
    payerId: owner.id,
    payerRole: "PROPERTY_OWNER",
    payerPhone: "0922000099",
    agreementId: agreement.id,
  });
  console.log("   Service fee paid.\n");

  console.log("8. Housing officer approves the agreement, issuing the contract agreement...");
  const approvedAgreement = await reviewAgreement(agreement.id, housingOfficer.id, "APPROVED");
  assert(approvedAgreement.status === "ACTIVE" || approvedAgreement.status === "APPROVED", "agreement should be approved/active");
  assert(!!approvedAgreement.wulNumber, "contract number should be issued");
  assert(!!approvedAgreement.wulQrToken, "contract QR token should be issued");
  console.log(`   Contract issued: ${approvedAgreement.wulNumber} (QR token ${approvedAgreement.wulQrToken}).\n`);

  console.log("9. Verifying the contract is resolvable by QR token (public verification page query)...");
  const byToken = await prisma.rentalAgreement.findUnique({ where: { wulQrToken: approvedAgreement.wulQrToken! } });
  assert(byToken?.id === agreement.id, "QR token should resolve back to the same agreement");
  console.log("   QR verification lookup OK.\n");

  console.log("9b. Security: a different owner must not be able to touch this agreement...");
  const otherOwner = await prisma.user.findUniqueOrThrow({ where: { email: "owner2@rhtms.et" } });
  let crossOwnerBlocked = false;
  try {
    await updateAgreementPrice({
      agreementId: agreement.id,
      newRentalAmountEtb: 1,
      reason: "hostile takeover attempt",
      actorUserId: otherOwner.id,
      actorRole: "PROPERTY_OWNER",
    });
  } catch {
    crossOwnerBlocked = true;
  }
  assert(crossOwnerBlocked, "a different owner must not be able to update this agreement's price");
  let crossOwnerTerminationBlocked = false;
  try {
    await requestTermination(agreement.id, otherOwner.id, "not my agreement");
  } catch {
    crossOwnerTerminationBlocked = true;
  }
  assert(crossOwnerTerminationBlocked, "a different owner must not be able to request termination on this agreement");
  console.log("   Correctly blocked both attempts.\n");

  console.log("10. Tax officer assesses tax on the agreement...");
  const assessment = await assessTax({
    agreementId: agreement.id,
    periodStart: agreement.startDate,
    periodEnd: agreement.endDate,
    actorId: taxOfficer.id,
  });
  assert(assessment.status === "ASSESSED", "assessment should be ASSESSED");
  // Rental income tax is progressive (PwC Worldwide Tax Summaries — Ethiopia;
  // see docs/ASSUMPTIONS.md), never a single flat rate — recompute the
  // expectation from the same bracket function assessTax() uses internally,
  // rather than hand-deriving a literal number.
  const { taxAmountEtb: expectedTax } = calculateProgressiveTax(20000 * 12, DEMO_TAX_BRACKETS);
  assert(
    Number(assessment.taxAmountEtb) === expectedTax,
    `tax should be computed progressively from the active brackets, never a flat rate (expected ${expectedTax}, got ${assessment.taxAmountEtb})`
  );
  assert(
    Number(assessment.rateApplied) !== 11.5,
    "rateApplied must never equal the old flat 11.5% figure — it is a blended effective rate, not a rent-increase percentage or a hard-coded tax rate"
  );
  console.log(`   Assessed ${assessment.taxAmountEtb} ETB tax (effective rate: ${assessment.rateApplied}%).\n`);

  console.log("11. Owner pays the assessed tax...");
  await initiatePayment({
    purpose: "TAX",
    providerType: "TELEBIRR",
    amountEtb: Number(assessment.taxAmountEtb),
    payerId: owner.id,
    payerRole: "PROPERTY_OWNER",
    payerPhone: "0922000099",
    taxAssessmentId: assessment.id,
  });
  const paidAssessment = await prisma.taxAssessment.findUniqueOrThrow({ where: { id: assessment.id } });
  assert(paidAssessment.status === "PAID", "tax assessment should be marked PAID");
  console.log("   Tax paid and marked PAID.\n");

  console.log("12. Rent price change is recorded with history preserved...");
  const beforePrice = agreement.rentalAmountEtb;
  // The rental price-increase regulation (see agreement.service.ts) blocks
  // any increase within 2 years of the rent last being set. Backdate the
  // agreement's initial version so this legitimate annual increase is
  // actually eligible — see scripts/verify-rent-increase.ts for the
  // dedicated, DB-free tests of the rule itself (including the block case).
  await prisma.agreementVersion.updateMany({
    where: { agreementId: agreement.id, versionNumber: 1 },
    data: { createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 25) },
  });
  await updateAgreementPrice({
    agreementId: agreement.id,
    newRentalAmountEtb: 22000,
    reason: "Annual increase per addendum.",
    actorUserId: owner.id,
    actorRole: "PROPERTY_OWNER",
  });
  const versions = await prisma.agreementVersion.findMany({ where: { agreementId: agreement.id }, orderBy: { versionNumber: "asc" } });
  assert(versions.length >= 2, "price update should add a new AgreementVersion");
  assert(Number(versions[0].rentalAmountEtb) === Number(beforePrice), "version 1 should preserve the original price");
  console.log(`   ${versions.length} versions on record; original price ${beforePrice} preserved in history.\n`);

  console.log("13. Housing officer records a compliance penalty...");
  const penaltyRule = await prisma.penaltyRule.findFirstOrThrow({ where: { reasonCode: "NON_COMPLIANCE" } });
  const penalty = await createPenalty({
    penaltyRuleId: penaltyRule.id,
    responsiblePartyId: owner.id,
    reason: "Verification test penalty.",
    agreementId: agreement.id,
    createdById: housingOfficer.id,
    baseAmountEtb: Number(agreement.rentalAmountEtb),
  });
  assert(Number(penalty.calculatedAmountEtb) > 0, "penalty should have a calculated amount");
  console.log(`   Penalty of ${penalty.calculatedAmountEtb} ETB recorded (${penalty.status}).\n`);

  console.log("13b. Housing officer approves the penalty, owner pays it...");
  const approvedPenalty = await reviewPenalty(penalty.id, housingOfficer.id, "APPROVED");
  assert(approvedPenalty.status === "APPROVED", "penalty should be APPROVED before payment");
  await initiatePayment({
    purpose: "PENALTY",
    providerType: "CASH",
    amountEtb: Number(approvedPenalty.calculatedAmountEtb),
    payerId: owner.id,
    payerRole: "PROPERTY_OWNER",
    payerPhone: "0922000099",
    penaltyId: penalty.id,
  });
  const paidPenalty = await prisma.penalty.findUniqueOrThrow({ where: { id: penalty.id } });
  assert(paidPenalty.status === "PAID", "penalty should be marked PAID after payment");
  console.log("   Penalty approved and paid.\n");

  console.log("13c. Owner renews the agreement before termination...");
  const beforeRenewalEndDate = agreement.endDate;
  const newEndDate = new Date(agreement.endDate.getTime() + 1000 * 60 * 60 * 24 * 365);
  await renewAgreement({
    agreementId: agreement.id,
    newEndDate,
    actorUserId: owner.id,
    actorRole: "PROPERTY_OWNER",
  });
  const renewed = await prisma.rentalAgreement.findUniqueOrThrow({ where: { id: agreement.id } });
  assert(renewed.endDate.getTime() === newEndDate.getTime(), "agreement end date should reflect the renewal");
  assert(renewed.endDate.getTime() > beforeRenewalEndDate.getTime(), "renewed end date should be later than before");
  console.log(`   Renewed through ${renewed.endDate.toDateString()}.\n`);

  console.log("14. Tenant requests termination, housing officer approves it...");
  await requestTermination(agreement.id, tenant.id, "Relocating for work.");
  const terminated = await approveTermination(agreement.id, housingOfficer.id);
  assert(terminated.status === "TERMINATED", "agreement should be TERMINATED");
  const propertyAfter = await prisma.property.findUniqueOrThrow({ where: { id: property.id } });
  assert(propertyAfter.status === "APPROVED", "property should return to APPROVED after termination");
  console.log("   Agreement terminated; property freed up for a new agreement.\n");

  console.log("15. Audit trail recorded the key actions...");
  const auditCount = await prisma.auditLog.count({ where: { entityId: { in: [property.id, agreement.id, penalty.id] } } });
  assert(auditCount >= 6, `expected at least 6 audit log entries, got ${auditCount}`);
  console.log(`   ${auditCount} audit log entries found for this run.\n`);

  console.log("16. Historical records were preserved, not deleted...");
  const historicalAgreement = await prisma.rentalAgreement.findUnique({ where: { id: agreement.id } });
  assert(historicalAgreement !== null, "terminated agreement must still exist in the database");
  console.log("   Confirmed.\n");

  console.log("ALL CHECKS PASSED ✔");
}

main()
  .catch((error) => {
    console.error("\nVERIFICATION FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
