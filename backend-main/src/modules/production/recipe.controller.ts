import { Request, Response } from "express";
import { z } from "zod";
import { recipeService } from "./recipe.service";
import { CreateRecipeSchema, UpdateRecipeSchema } from "./recipe.validation";

export const createRecipe = async (req: Request, res: Response) => {
    try {
        const data = CreateRecipeSchema.parse(req.body);
        const result = await recipeService.createRecipe(data);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const getRecipes = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || undefined;

        const result = await recipeService.getRecipes(page, limit, search);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getRecipeById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await recipeService.getRecipeById(id);
        if (!result) {
            return res.status(404).json({ error: "Recipe not found" });
        }
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateRecipe = async (req: Request, res: Response) => {
    try {
        const data = UpdateRecipeSchema.parse(req.body);
        const id = req.params.id as string;
        const result = await recipeService.updateRecipe(id, data);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
};

export const softDeleteRecipe = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await recipeService.softDeleteRecipe(id);
        res.json({ message: "Recipe deleted successfully" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const hardDeleteRecipe = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await recipeService.hardDeleteRecipe(id);
        res.json({ message: "Recipe permanently deleted" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
