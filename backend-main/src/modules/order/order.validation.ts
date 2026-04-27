import { z } from "zod";

export const CustomizationSelectionSchema = z.object({
    id: z.string().min(1, "Customization ID is required"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const OrderItemSchema = z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    unitPrice: z.number().nonnegative("Unit price cannot be negative"),
    customizations: z.array(CustomizationSelectionSchema).optional(),
    customerMessage: z.string().max(500).optional(),
});

export const CreateOrderSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    customerEmail: z.string().email("Invalid email address"),
    country: z.string().optional(),
    streetAddress: z.string().min(1, "Street address is required"),
    streetAddress2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().optional(),
    senderPhone: z.string().min(1, "Sender phone number is required"),
    recipientPhone: z.string().min(1, "Recipient phone number is required"),
    cardQuote: z.string().max(300).optional(),
    orderNotes: z.string().max(500).optional(),
    shipToDifferentAddress: z.boolean().default(false),
    status: z.string().default("Pending"),
    totalPrice: z.number().positive("Total price must be positive"),
    orderItems: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
});

export const UpdateOrderSchema = z.object({
    status: z.string().optional(),
    totalPrice: z.number().positive().optional(),
});
