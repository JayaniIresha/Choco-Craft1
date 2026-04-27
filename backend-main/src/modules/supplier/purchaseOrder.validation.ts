import { z } from "zod";

export const CreatePurchaseOrderSchema = z.object({
    supplierId: z.string().min(1, "Supplier ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().positive("Quantity must be positive"),
    status: z.enum(["Pending", "Approved", "Delivered"]).default("Pending"),
});

export const UpdatePurchaseOrderSchema = z.object({
    status: z.enum(["Pending", "Approved", "Delivered"]),
});
