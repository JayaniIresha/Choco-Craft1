import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getStats, getSales, getInventory } from "./dashboard.controller";

const router = express.Router();

router.get("/stats", authMiddleware, getStats);
router.get("/sales", authMiddleware, getSales);
router.get("/inventory", authMiddleware, getInventory);

export default router;
