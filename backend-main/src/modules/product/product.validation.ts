import { z } from "zod";

export const CreateProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    imageUrl: z.string().optional().or(z.literal("")),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater").default(0),
    inStockAmount: z.number().int().min(0).default(0),
});

export const UpdateProductSchema = CreateProductSchema.partial();
