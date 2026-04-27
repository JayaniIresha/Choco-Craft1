import { z } from "zod";

export const CreateMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative(),
  minimumLevel: z.coerce.number().int().nonnegative(),
  supplierId: z.string().min(1),
});

export const UpdateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  minimumLevel: z.coerce.number().int().nonnegative().optional(),
  supplierId: z.string().min(1).optional(),
});

export const CreateStockUsageSchema = z.object({
  materialId: z.string().min(1),
  usedQty: z.coerce.number().int().positive(),
  productionId: z.string().min(1),
});

export const UpdateStockUsageSchema = z.object({
  usedQty: z.coerce.number().int().positive().optional(),
});
