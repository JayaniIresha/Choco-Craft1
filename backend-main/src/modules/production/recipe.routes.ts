import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    softDeleteRecipe,
    hardDeleteRecipe,
} from "./recipe.controller";

const router = express.Router();

// Recipe routes
router.post("/", authMiddleware, createRecipe);
router.get("/", authMiddleware, getRecipes);
router.get("/:id", authMiddleware, getRecipeById);
router.put("/:id", authMiddleware, updateRecipe);
router.delete("/:id", authMiddleware, softDeleteRecipe);
router.delete("/hard/:id", authMiddleware, hardDeleteRecipe);

export default router;
