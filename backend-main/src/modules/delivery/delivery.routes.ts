import { Router } from "express";
import {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getDeliveryByOrderId,
  updateDelivery,
  softDeleteDelivery,
  hardDeleteDelivery,
} from "./delivery.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), createDelivery);
router.get("/", authMiddleware, getDeliveries);
router.get("/:id", authMiddleware, getDeliveryById);
router.get("/order/:orderId", authMiddleware, getDeliveryByOrderId);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateDelivery);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeleteDelivery);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeleteDelivery);

export default router;
