import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    softDeletePurchaseOrder,
    hardDeletePurchaseOrder,
} from "./purchaseOrder.controller";

const router = express.Router();

// Purchase Order routes
router.post("/", authMiddleware, roleMiddleware(["admin"]), createPurchaseOrder);
router.get("/", authMiddleware, getPurchaseOrders);
router.get("/:id", authMiddleware, getPurchaseOrderById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updatePurchaseOrder);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeletePurchaseOrder);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeletePurchaseOrder);

export default router;
