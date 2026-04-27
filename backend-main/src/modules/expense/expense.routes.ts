import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getFinanceStats,
} from "./expense.controller";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["admin"]), createExpense);
router.get("/", authMiddleware, getExpenses);
router.get("/stats", authMiddleware, getExpenseStats);
router.get("/finance-stats", authMiddleware, getFinanceStats);
router.get("/:id", authMiddleware, getExpenseById);
router.put("/:id", authMiddleware, roleMiddleware(["admin"]), updateExpense);
router.delete("/:id", authMiddleware, roleMiddleware(["admin"]), deleteExpense);

export default router;
