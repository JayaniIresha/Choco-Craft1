import { z } from "zod";

const CustomizationSelectionSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(1),
});

const OrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  customizations: z.array(CustomizationSelectionSchema).optional(),
  customerMessage: z.string().max(500).optional(),
});

export const OrderSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  customerEmail: z.string().email("Invalid email address"),
  country: z.string().optional(),
  streetAddress: z.string().min(1, "Street address is required"),
  streetAddress2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().regex(/^\d{5}$/, "Postcode must be 5 digits").optional().or(z.literal("")),
  senderPhone: z
    .string()
    .regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  recipientPhone: z
    .string()
    .regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  cardQuote: z.string().max(300).optional(),
  orderNotes: z.string().max(500).optional(),
  shipToDifferentAddress: z.boolean().default(false),
  status: z
    .enum([
      "Pending",
      "Processing",
      "Completed",
      "Cancelled",
      "Driver Assigned",
    ])
    .default("Pending"),
  totalPrice: z.number().positive("Total price must be positive"),
  orderItems: z
    .array(OrderItemSchema)
    .min(1, "Order must have at least one item"),
  isDeleted: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderSchema = OrderSchema.omit({
  id: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderSchema = z.object({
  status: z
    .enum(["Pending", "Processing", "Completed", "Cancelled", "Driver Assigned"])
    .optional(),
  totalPrice: z.number().positive().optional(),
});
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
