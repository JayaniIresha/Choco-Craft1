import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
  createMaterial,
  getMaterials,
  getMaterialById,
  updateMaterial,
  softDeleteMaterial,
  hardDeleteMaterial,
  createStockUsage,
  getStockUsage,
  getStockUsageById,
  updateStockUsage,
  softDeleteStockUsage,
  getSuppliers,
  getProduction,
} from "./inventory.controller";

const router = express.Router();

// Material routes
router.post("/materials", authMiddleware, roleMiddleware(["admin", "inventory"]), createMaterial);
router.get("/materials", authMiddleware, getMaterials);
router.get("/materials/:id", authMiddleware, getMaterialById);
router.put("/materials/:id", authMiddleware, roleMiddleware(["admin", "inventory"]), updateMaterial);
router.delete("/materials/:id", authMiddleware, roleMiddleware(["admin", "inventory"]), softDeleteMaterial);
router.delete("/materials/hard/:id", authMiddleware, roleMiddleware(["admin", "inventory"]), hardDeleteMaterial);

// Stock usage routes
router.post("/stock-usage", authMiddleware, roleMiddleware(["admin", "inventory"]), createStockUsage);
router.get("/stock-usage", authMiddleware, getStockUsage);
router.get("/stock-usage/:id", authMiddleware, getStockUsageById);
router.put("/stock-usage/:id", authMiddleware, roleMiddleware(["admin", "inventory"]), updateStockUsage);
router.delete("/stock-usage/:id", authMiddleware, roleMiddleware(["admin", "inventory"]), softDeleteStockUsage);

// Utility routes
router.get("/suppliers", authMiddleware, getSuppliers);
router.get("/production", authMiddleware, getProduction);

export default router;
