import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
  createOrder,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrder,
  softDeleteOrder,
  hardDeleteOrder,
  getCustomizations,
} from "./order.controller";



const router = express.Router();

router.get("/customizations", getCustomizations); // public — needed at checkout
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "customer"]),
  createOrder,
);
router.get("/my-orders", authMiddleware, roleMiddleware(["customer"]), getMyOrders);
router.get("/", authMiddleware, getOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateOrder);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  softDeleteOrder,
);
router.delete(
  "/hard/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  hardDeleteOrder,
);

export default router;
