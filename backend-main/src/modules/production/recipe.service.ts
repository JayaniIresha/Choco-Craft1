import prisma from "../../config/prisma";
import { queryActive } from "../../utils/softDelete";
import { CreateRecipeSchema, UpdateRecipeSchema } from "./recipe.validation";
import { z } from "zod";

type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
type UpdateRecipeInput = z.infer<typeof UpdateRecipeSchema>;

export const recipeService = {
    async createRecipe(data: CreateRecipeInput) {
        return prisma.recipe.create({
            data: {
                name: data.name,
                ingredients: data.ingredients as any, // Prisma Json compatibility
            },
        });
    },

    async getRecipes(page = 1, limit = 10, search?: string) {
        const skip = (page - 1) * limit;

        const baseQuery = queryActive();
        const where = {
            ...baseQuery,
            ...(search && {
                name: { contains: search, mode: "insensitive" } as any,
            }),
        } as any;

        const [recipes, total] = await Promise.all([
            prisma.recipe.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.recipe.count({ where }),
        ]);

        return { recipes, total, pages: Math.ceil(total / limit) };
    },

    async getRecipeById(id: string) {
        return prisma.recipe.findFirst({
            where: queryActive({ id }),
        });
    },

    async updateRecipe(id: string, data: UpdateRecipeInput) {
        return prisma.recipe.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.ingredients && { ingredients: data.ingredients as any }),
            },
        });
    },

    async softDeleteRecipe(id: string) {
        return prisma.recipe.update({
            where: { id },
            data: { isDeleted: true },
        });
    },

    async hardDeleteRecipe(id: string) {
        return prisma.recipe.delete({ where: { id } });
    }
};
