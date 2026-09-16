import { z } from "zod";

export const idTypeEnum = z.enum(["FAYDA", "KEBELE_ID", "PASSPORT", "DRIVER_LICENSE", "STUDENT_ID", "OTHER"]);

export const ownerProfileSchema = z.object({
  idType: idTypeEnum,
  idNumber: z.string().min(3, "ID number is required."),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
});

export const tenantProfileSchema = z.object({
  idType: idTypeEnum,
  idNumber: z.string().min(3, "ID number is required."),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  motherName: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
});

export const registerTenantByOwnerSchema = z.object({
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  idType: idTypeEnum,
  idNumber: z.string().min(3),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  motherName: z.string().optional(),
  subCity: z.string().optional(),
  woreda: z.string().optional(),
});
