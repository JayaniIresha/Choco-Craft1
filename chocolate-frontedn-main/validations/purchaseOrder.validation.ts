import { z } from "zod";

// If material is needed it could be imported, but simple strings work for now
export const PurchaseOrderSchema = z.object({
    id: z.string().optional(),
    supplierId: z.string().min(1, "Supplier ID is required"),
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().positive("Quantity must be greater than zero"),
    status: z.enum(["Pending", "Approved", "Delivered"]).default("Pending"),
    createdAt: z.string().optional(),

    // Relations that will be populated by API calls
    supplier: z.any().optional(),
    material: z.any().optional()
});

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const UpdatePurchaseOrderStatusSchema = z.object({
    status: z.enum(["Pending", "Approved", "Delivered"]),
});
