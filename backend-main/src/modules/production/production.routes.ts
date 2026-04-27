import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
    createProduction,
    getProductions,
    getProductionById,
    updateProduction,
    softDeleteProduction,
    hardDeleteProduction,
} from "./production.controller";

const router = express.Router();

// Production routes
router.post("/", authMiddleware, roleMiddleware(["admin"]), createProduction);
router.get("/", authMiddleware, getProductions);
router.get("/:id", authMiddleware, getProductionById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateProduction);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeleteProduction);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeleteProduction);

export default router;
