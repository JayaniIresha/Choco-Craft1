import { Router } from "express";
import {
  createPayment,
  getPaymentByOrderId,
  getPaymentById,
  updatePaymentStatus,
  softDeletePayment,
  hardDeletePayment,
  getPayments,
} from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

// All payment routes require authentication
router.post("/", authMiddleware, createPayment);
router.get("/", authMiddleware, getPayments);
router.get("/order/:orderId", authMiddleware, getPaymentByOrderId);
router.get("/:id", authMiddleware, getPaymentById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updatePaymentStatus);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeletePayment);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeletePayment);

export default router;
