import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    softDeleteSupplier,
    hardDeleteSupplier,
} from "./supplier.controller";

const router = express.Router();

// Supplier routes
router.post("/", authMiddleware, roleMiddleware(["admin"]), createSupplier);
router.get("/", authMiddleware, getSuppliers);
router.get("/:id", authMiddleware, getSupplierById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateSupplier);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), softDeleteSupplier);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeleteSupplier);

export default router;
