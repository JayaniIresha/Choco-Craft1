import { z } from "zod";

export const CreatePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["credit_card", "bank_transfer", "cash_on_delivery"], { message: "Invalid payment method" }),
  status: z.enum(["pending", "completed", "failed"]).optional().default("pending"),
  imageUrl: z.string().optional(),
});

export const UpdatePaymentSchema = z.object({
  status: z.enum(["pending", "completed", "failed"]).optional(),
  imageUrl: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
