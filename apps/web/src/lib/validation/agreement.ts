import { z } from "zod";

export const paymentFrequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"]);

export const agreementSchema = z
  .object({
    propertyId: z.string().min(1),
    tenantIdentifier: z.string().min(1, "Search for a tenant by phone, email or ID number."),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rentalAmountEtb: z.coerce.number().positive("Rental amount must be greater than zero."),
    paymentFrequency: paymentFrequencyEnum,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after the start date.",
    path: ["endDate"],
  });

export const paymentProviderEnum = z.enum(["CBE", "TELEBIRR", "BANK_TRANSFER", "CASH"]);

export const initiatePaymentSchema = z.object({
  providerType: paymentProviderEnum,
  payerPhone: z.string().min(9, "Enter a valid phone number."),
});
