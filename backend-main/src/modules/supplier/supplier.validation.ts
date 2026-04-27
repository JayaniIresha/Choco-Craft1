import { z } from "zod";

export const CreateSupplierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();
