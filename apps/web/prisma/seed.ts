import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// All demo accounts share this password so the app can be demoed easily.
const DEMO_PASSWORD = "Passw0rd!1";

const SUB_CITIES = [
  { name: "Addis Ketema", nameAm: "አዲስ ከተማ", nameOm: "Addis Katamaa" },
  { name: "Akaky Kaliti", nameAm: "አቃቂ ቃሊቲ", nameOm: "Akaakii Qaallittii" },
  { name: "Arada", nameAm: "አራዳ", nameOm: "Arradaa" },
  { name: "Bole", nameAm: "ቦሌ", nameOm: "Boolee" },
  { name: "Gullele", nameAm: "ጉለሌ", nameOm: "Gullallee" },
  { name: "Kirkos", nameAm: "ቂርቆስ", nameOm: "Qirqos" },
  { name: "Kolfe Keranio", nameAm: "ኮልፌ ቀራንዮ", nameOm: "Kolfe Qaraaniyo" },
  { name: "Lideta", nameAm: "ልደታ", nameOm: "Lidataa" },
  { name: "Nifas Silk-Lafto", nameAm: "ንፋስ ስልክ ላፍቶ", nameOm: "Nifaas Silk Laaftoo" },
  { name: "Yeka", nameAm: "የካ", nameOm: "Yakaa" },
  { name: "Lemi Kura", nameAm: "ለሚ ኩራ", nameOm: "Lammii Kuraa" },
];

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding sub-cities and woredas...");
  const subCityRecords: Record<string, { id: number }> = {};
  for (const sc of SUB_CITIES) {
    const created = await prisma.subCity.upsert({
      where: { name: sc.name },
      create: sc,
      update: sc,
    });
    subCityRecords[sc.name] = created;
    for (let w = 1; w <= 5; w++) {
      await prisma.woreda.upsert({
        where: { subCityId_number: { subCityId: created.id, number: String(w).padStart(2, "0") } },
        create: { subCityId: created.id, number: String(w).padStart(2, "0") },
        update: {},
      });
    }
  }

  const bole = subCityRecords["Bole"];
  const kirkos = subCityRecords["Kirkos"];
  const lideta = subCityRecords["Lideta"];

  console.log("Seeding staff and admin users...");
  const passwordHash = await hash(DEMO_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rhtms.et" },
    create: {
      email: "admin@rhtms.et",
      phone: "0911000001",
      passwordHash,
      role: "SUPER_ADMIN",
      firstName: "Selam",
      lastName: "Getachew",
      staffProfile: { create: { department: "ADMIN", title: "System Administrator" } },
    },
    update: {},
  });

  const housingOfficer = await prisma.user.upsert({
    where: { email: "housing.officer@rhtms.et" },
    create: {
      email: "housing.officer@rhtms.et",
      phone: "0911000002",
      passwordHash,
      role: "HOUSING_OFFICER",
      firstName: "Mekdes",
      lastName: "Alemu",
      staffProfile: { create: { department: "HOUSING", title: "Housing Registration Officer", subCityId: bole.id } },
    },
    update: {},
  });

  const taxOfficer = await prisma.user.upsert({
    where: { email: "tax.officer@rhtms.et" },
    create: {
      email: "tax.officer@rhtms.et",
      phone: "0911000003",
      passwordHash,
      role: "TAX_OFFICER",
      firstName: "Dawit",
      lastName: "Bekele",
      staffProfile: { create: { department: "TAX", title: "Rental Tax Officer" } },
    },
    update: {},
  });

  console.log("Seeding tax rule, penalty rules and price rules...");
  const existingTaxRule = await prisma.taxRule.findFirst({ where: { isActive: true } });
  if (!existingTaxRule) {
    await prisma.taxRule.create({
      data: {
        name: "Rental Income Tax",
        ratePercentage: 11.5,
        effectiveFrom: new Date("2023-01-01"),
        isActive: true,
        createdById: admin.id,
      },
    });
  }

  const penaltyRuleDefs = [
    {
      name: "Delayed property registration",
      reasonCode: "DELAYED_REGISTRATION" as const,
      calculationType: "PER_DAY_LATE" as const,
      perDayAmountEtb: 50,
    },
    {
      name: "Non-compliance with registration requirements",
      reasonCode: "NON_COMPLIANCE" as const,
      calculationType: "FIXED" as const,
      fixedAmountEtb: 2000,
    },
    {
      name: "Late tax payment",
      reasonCode: "LATE_TAX_PAYMENT" as const,
      calculationType: "PERCENTAGE_OF_RENT" as const,
      percentage: 5,
    },
  ];
  for (const def of penaltyRuleDefs) {
    const existing = await prisma.penaltyRule.findFirst({ where: { name: def.name } });
    if (!existing) {
      await prisma.penaltyRule.create({ data: { ...def, createdById: admin.id } });
    }
  }

  const priceRuleDefs = [
    { label: "Bole apartments (sample)", subCityId: bole.id, propertyType: "APARTMENT" as const, minPriceEtb: 8000, maxPriceEtb: 35000 },
    { label: "Kirkos shared houses (sample)", subCityId: kirkos.id, propertyType: "SHARED_HOUSE" as const, minPriceEtb: 3000, maxPriceEtb: 12000 },
    { label: "Citywide fallback range (sample)", subCityId: null, propertyType: null, minPriceEtb: 1500, maxPriceEtb: 60000 },
  ];
  for (const def of priceRuleDefs) {
    const existing = await prisma.rentalPriceRule.findFirst({ where: { label: def.label } });
    if (!existing) {
      await prisma.rentalPriceRule.create({ data: { ...def, createdById: admin.id } });
    }
  }

  await prisma.systemConfiguration.upsert({
    where: { key: "SERVICE_FEE_PERCENTAGE" },
    create: { key: "SERVICE_FEE_PERCENTAGE", value: 2, description: "Service fee as % of rent, charged on agreement submission.", updatedById: admin.id },
    update: {},
  });
  await prisma.systemConfiguration.upsert({
    where: { key: "TAX_PAYMENT_GRACE_DAYS" },
    create: { key: "TAX_PAYMENT_GRACE_DAYS", value: 30, description: "Days after assessment period end before tax is overdue.", updatedById: admin.id },
    update: {},
  });

  console.log("Seeding demo owners, tenants, property and agreement...");

  const owner1 = await prisma.user.upsert({
    where: { email: "owner1@rhtms.et" },
    create: {
      email: "owner1@rhtms.et",
      phone: "0922000001",
      passwordHash,
      role: "PROPERTY_OWNER",
      firstName: "Yohannes",
      lastName: "Tesfaye",
      ownerProfile: {
        create: { idType: "FAYDA", idNumber: "FAYDA-0001", gender: "MALE", subCity: "Bole", woreda: "03", isVerified: true, verifiedAt: new Date(), verifiedById: housingOfficer.id },
      },
    },
    update: {},
  });

  const owner2 = await prisma.user.upsert({
    where: { email: "owner2@rhtms.et" },
    create: {
      email: "owner2@rhtms.et",
      phone: "0922000002",
      passwordHash,
      role: "PROPERTY_OWNER",
      firstName: "Hiwot",
      lastName: "Girma",
      ownerProfile: { create: { idType: "KEBELE_ID", idNumber: "KEBELE-0002", gender: "FEMALE", subCity: "Kirkos", woreda: "02" } },
    },
    update: {},
  });

  const tenant1 = await prisma.user.upsert({
    where: { email: "tenant1@rhtms.et" },
    create: {
      email: "tenant1@rhtms.et",
      phone: "0933000001",
      passwordHash,
      role: "TENANT",
      firstName: "Betelhem",
      lastName: "Worku",
      tenantProfile: {
        create: { idType: "FAYDA", idNumber: "FAYDA-1001", gender: "FEMALE", motherName: "Almaz", subCity: "Bole", woreda: "04", isVerified: true, verifiedAt: new Date(), verifiedById: housingOfficer.id },
      },
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "tenant2@rhtms.et" },
    create: {
      email: "tenant2@rhtms.et",
      phone: "0933000002",
      passwordHash,
      role: "TENANT",
      firstName: "Nahom",
      lastName: "Assefa",
      tenantProfile: { create: { idType: "PASSPORT", idNumber: "EP1234567", gender: "MALE", motherName: "Tsehay", subCity: "Yeka", woreda: "01" } },
    },
    update: {},
  });

  const owner1Profile = await prisma.ownerProfile.findUniqueOrThrow({ where: { userId: owner1.id } });
  const owner2Profile = await prisma.ownerProfile.findUniqueOrThrow({ where: { userId: owner2.id } });
  const tenant1Profile = await prisma.tenantProfile.findUniqueOrThrow({ where: { userId: tenant1.id } });

  // Property 1: fully approved, active agreement, tax assessed & paid.
  let property1 = await prisma.property.findUnique({ where: { code: "P-DEMO-001" } });
  if (!property1) {
    property1 = await prisma.property.create({
      data: {
        code: "P-DEMO-001",
        title: "2-Bedroom Apartment near Edna Mall",
        description: "Modern 2-bedroom apartment, 3rd floor, with elevator access and 24/7 security.",
        propertyType: "APARTMENT",
        constructionType: "CONCRETE",
        numberOfRooms: 2,
        furnishedStatus: "UNFURNISHED",
        sizeSqm: 85,
        subCityId: bole.id,
        houseNumber: "KB1-5-3",
        askingRentEtb: 18000,
        status: "APPROVED",
        isListed: false,
        createdById: owner1.id,
        approvedById: housingOfficer.id,
        approvedAt: new Date(),
        ownerships: {
          create: { ownerProfileId: owner1Profile.id, ownershipType: "ORIGINAL_OWNER", sharePercentage: 100, isPrimaryContact: true },
        },
      },
    });
  }

  let agreement1 = await prisma.rentalAgreement.findUnique({ where: { agreementNumber: "TE/04/900001" } });
  if (!agreement1) {
    agreement1 = await prisma.rentalAgreement.create({
      data: {
        agreementNumber: "TE/04/900001",
        propertyId: property1.id,
        tenantId: tenant1Profile.id,
        startDate: new Date("2025-09-01"),
        endDate: new Date("2027-09-01"),
        rentalAmountEtb: 18000,
        paymentFrequency: "MONTHLY",
        furnishedStatus: "UNFURNISHED",
        status: "ACTIVE",
        serviceFeeAmountEtb: 360,
        wulNumber: "WUL/04/900001",
        wulQrToken: "demo-wul-token-0001",
        wulIssuedAt: new Date("2025-09-02"),
        createdById: owner1.id,
        approvedById: housingOfficer.id,
        approvedAt: new Date("2025-09-02"),
      },
    });

    await prisma.agreementVersion.create({
      data: {
        agreementId: agreement1.id,
        versionNumber: 1,
        changeType: "CREATED",
        rentalAmountEtb: 18000,
        startDate: agreement1.startDate,
        endDate: agreement1.endDate,
        status: "ACTIVE",
        changedById: owner1.id,
        snapshot: { note: "seed data" },
      },
    });

    await prisma.property.update({ where: { id: property1.id }, data: { status: "ACTIVE" } });

    await prisma.payment.create({
      data: {
        purpose: "SERVICE_FEE",
        providerType: "CBE",
        referenceNumber: "PAY-SEED-SERVICEFEE-0001",
        amountEtb: 360,
        status: "COMPLETED",
        payerId: owner1.id,
        agreementId: agreement1.id,
        completedAt: new Date("2025-09-01"),
      },
    });

    const taxAssessment1 = await prisma.taxAssessment.create({
      data: {
        agreementId: agreement1.id,
        taxRuleId: (await prisma.taxRule.findFirstOrThrow({ where: { isActive: true } })).id,
        periodStart: new Date("2025-09-01"),
        periodEnd: new Date("2026-09-01"),
        taxableAmountEtb: 18000 * 12,
        rateApplied: 11.5,
        taxAmountEtb: Math.round(18000 * 12 * 0.115 * 100) / 100,
        status: "PAID",
        dueDate: new Date("2026-10-01"),
        assessedById: taxOfficer.id,
        assessedAt: new Date("2025-09-10"),
        paidAt: new Date("2025-09-15"),
      },
    });

    await prisma.payment.create({
      data: {
        purpose: "TAX",
        providerType: "TELEBIRR",
        referenceNumber: "PAY-SEED-TAX-0001",
        amountEtb: taxAssessment1.taxAmountEtb,
        status: "COMPLETED",
        payerId: owner1.id,
        agreementId: agreement1.id,
        taxAssessmentId: taxAssessment1.id,
        completedAt: new Date("2025-09-15"),
      },
    });

    await prisma.notification.create({
      data: {
        userId: tenant1.id,
        type: "APPROVAL",
        title: "Rental agreement approved",
        message: `Your agreement ${agreement1.agreementNumber} has been approved and your WUL is ready.`,
        agreementId: agreement1.id,
      },
    });
  }

  // Property 2 (owner 2): sitting in the housing officer's review queue.
  let property2 = await prisma.property.findUnique({ where: { code: "P-DEMO-002" } });
  if (!property2) {
    property2 = await prisma.property.create({
      data: {
        code: "P-DEMO-002",
        title: "Single Room in Shared Compound",
        description: "Single furnished room, shared kitchen and bathroom, near Kirkos square.",
        propertyType: "SHARED_HOUSE",
        constructionType: "HOLLOW_BLOCK",
        numberOfRooms: 1,
        furnishedStatus: "FURNISHED",
        sizeSqm: 20,
        subCityId: kirkos.id,
        houseNumber: "1037-Ext-01",
        askingRentEtb: 4500,
        status: "SUBMITTED",
        createdById: owner2.id,
        ownerships: {
          create: { ownerProfileId: owner2Profile.id, ownershipType: "ORIGINAL_OWNER", sharePercentage: 100, isPrimaryContact: true },
        },
      },
    });

    await prisma.propertyReview.create({
      data: {
        propertyId: property2.id,
        reviewerId: owner2.id,
        action: "SUBMITTED",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED",
      },
    });
  }

  // Property 3 (owner 1): still a draft, so the owner dashboard shows the full lifecycle.
  const property3Exists = await prisma.property.findUnique({ where: { code: "P-DEMO-003" } });
  if (!property3Exists) {
    await prisma.property.create({
      data: {
        code: "P-DEMO-003",
        title: "Studio Unit in Lideta",
        propertyType: "APARTMENT",
        constructionType: "CONCRETE",
        numberOfRooms: 1,
        furnishedStatus: "SEMI_FURNISHED",
        subCityId: lideta.id,
        houseNumber: "77-B",
        askingRentEtb: 9000,
        status: "DRAFT",
        createdById: owner1.id,
        ownerships: {
          create: { ownerProfileId: owner1Profile.id, ownershipType: "ORIGINAL_OWNER", sharePercentage: 100, isPrimaryContact: true },
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (all use password: %s):", DEMO_PASSWORD);
  console.log("  Super Admin      admin@rhtms.et");
  console.log("  Housing Officer  housing.officer@rhtms.et");
  console.log("  Tax Officer      tax.officer@rhtms.et");
  console.log("  Property Owner   owner1@rhtms.et (has an active agreement + a submitted property)");
  console.log("  Property Owner   owner2@rhtms.et (property awaiting housing review)");
  console.log("  Tenant           tenant1@rhtms.et (active agreement + WUL)");
  console.log("  Tenant           tenant2@rhtms.et (no agreement yet, can browse & search)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
