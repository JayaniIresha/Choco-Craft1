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
    materialId: z.string().min(1, "Material ID is required"),
    quantity: z.number().positive("Ingredient quantity must be positive"),
    unit: z.enum(INGREDIENT_UNITS),
});

export const CreateRecipeSchema = z.object({
    name: z.string().min(1, "Recipe name is required"),
    ingredients: z.array(IngredientSchema).min(1, "At least one ingredient is required"),
});

export const UpdateRecipeSchema = CreateRecipeSchema.partial();

