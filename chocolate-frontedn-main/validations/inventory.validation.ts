import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().int().nonnegative("Quantity must be a non-negative number"),
  minimumLevel: z.coerce.number().int().nonnegative("Minimum level must be a non-negative number"),
  supplierId: z.string().min(1, "Supplier is required"),
});

export const updateMaterialSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  quantity: z.coerce.number().int().nonnegative("Quantity must be a non-negative number").optional(),
  minimumLevel: z.coerce.number().int().nonnegative("Minimum level must be a non-negative number").optional(),
  supplierId: z.string().min(1, "Supplier is required").optional(),
});

export const stockUsageSchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  usedQty: z.coerce.number().int().positive("Used quantity must be a positive number"),
  productionId: z.string().min(1, "Production order is required"),
});

export const updateStockUsageSchema = z.object({
  usedQty: z.coerce.number().int().positive("Used quantity must be a positive number").optional(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;
export type UpdateMaterialFormData = z.infer<typeof updateMaterialSchema>;
export type StockUsageFormData = z.infer<typeof stockUsageSchema>;
export type UpdateStockUsageFormData = z.infer<typeof updateStockUsageSchema>;
