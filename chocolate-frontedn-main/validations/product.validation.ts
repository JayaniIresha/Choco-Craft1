import { z } from "zod";

export const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    imageUrl: z.string().optional().or(z.literal("")),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater").default(0),
    inStockAmount: z.number().int().min(0, "Stock amount cannot be negative").default(0),
    isDeleted: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = ProductSchema.omit({ id: true, isDeleted: true, createdAt: true, updatedAt: true });
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
