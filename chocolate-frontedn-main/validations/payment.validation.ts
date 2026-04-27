import { z } from "zod";

export const PaymentSchema = z.object({
  id: z.string().optional(),
  orderId: z.string().min(1, "Order ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(
    ["credit_card", "bank_transfer", "cash_on_delivery"],
    { message: "Invalid payment method" }
  ),
  status: z
    .enum(["pending", "completed", "failed"])
    .optional()
    .default("pending"),
  imageUrl: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const UpdatePaymentSchema = z.object({
  status: z.enum(["pending", "completed", "failed"]).optional(),
  imageUrl: z.string().optional(),
});
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;

// Card form validation (client-side only, no real payment gateway)
export const CardFormSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{4} \d{4} \d{4} \d{4}$/, "Enter a valid 16-digit card number (e.g., 1234 5678 9012 3456)"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format (e.g., 12/25)"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});
export type CardFormValues = z.infer<typeof CardFormSchema>;
