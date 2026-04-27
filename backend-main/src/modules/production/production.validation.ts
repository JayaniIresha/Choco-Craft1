import { z } from "zod";

export const CreateProductionSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    status: z.enum(["Planned", "InProgress", "Completed"]).default("Planned"),
    quantity: z.number().positive("Quantity must be greater than 0"),
    recipeId: z.string().min(1, "Recipe ID is required"),
});

export const UpdateProductionSchema = z.object({
    status: z.enum(["Planned", "InProgress", "Completed"]).optional(),
});
