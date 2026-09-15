import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const phoneRegex = /^(\+251|0)9\d{8}$/;

export const baseRegisterSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name is required."),
  email: z.string().email("Enter a valid email address."),
  phone: z.string().regex(phoneRegex, "Enter a valid Ethiopian phone number (e.g. 0911234567)."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["PROPERTY_OWNER", "TENANT"]),
});

export type RegisterInput = z.infer<typeof baseRegisterSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
