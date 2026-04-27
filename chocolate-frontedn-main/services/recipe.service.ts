import api from "@/lib/api";
import { Recipe } from "@/validations/recipe.validation";

export const recipeService = {
    async getRecipes(page = 1, limit = 100, search?: string) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.append("search", search);
        const res = await api.get(`/recipes?${params.toString()}`);
        return res.data as { recipes: Recipe[]; total: number; pages: number };
    },

    async getRecipeById(id: string) {
        const res = await api.get(`/recipes/${id}`);
        return res.data as Recipe;
    },

    async createRecipe(data: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "isDeleted">) {
        const res = await api.post("/recipes", data);
        return res.data as Recipe;
    },

    async updateRecipe(id: string, data: Partial<Omit<Recipe, "id" | "createdAt" | "updatedAt" | "isDeleted">>) {
        const res = await api.put(`/recipes/${id}`, data);
        return res.data as Recipe;
    },

    async softDeleteRecipe(id: string) {
        const res = await api.delete(`/recipes/${id}`);
        return res.data;
    },

    async hardDeleteRecipe(id: string) {
        const res = await api.delete(`/recipes/hard/${id}`);
        return res.data;
    },
};
