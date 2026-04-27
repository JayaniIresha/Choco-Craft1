import { z } from "zod";

export const INGREDIENT_UNITS = [
    "grams",
    "kg",
    "ml",
    "liters",
    "teaspoon",
    "tablespoon",
    "cups",
    "units",
] as const;

export const IngredientSchema = z.object({
    materialId: z.string().min(1, "Material is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.enum(INGREDIENT_UNITS),
});

export const RecipeSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Recipe name is required"),
    ingredients: z.array(IngredientSchema).min(1, "At least one ingredient is required"),
    isDeleted: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
