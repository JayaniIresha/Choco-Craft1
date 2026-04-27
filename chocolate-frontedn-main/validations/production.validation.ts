import { z } from "zod";

export const ProductionSchema = z.object({
    id: z.string().optional(),
    orderId: z.string().min(1, "Order ID is required"),
    recipeId: z.string().min(1, "Recipe is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    status: z.enum(["Planned", "InProgress", "Completed"]).default("Planned"),
    isDeleted: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Production = z.infer<typeof ProductionSchema>;

export const UpdateProductionSchema = z.object({
    status: z.enum(["Planned", "InProgress", "Completed"]),
});
export type UpdateProduction = z.infer<typeof UpdateProductionSchema>;
