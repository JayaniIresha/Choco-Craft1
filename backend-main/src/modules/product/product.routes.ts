import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    softDeleteProduct,
    hardDeleteProduct,
} from "./product.controller";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateProduct);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeleteProduct);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeleteProduct);

export default router;
