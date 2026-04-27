import { Router } from "express";
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  softDeleteReview,
  hardDeleteReview,
  getMyReviews,
} from "./review.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

router.post("/", authMiddleware, createReview);
router.get("/my-reviews", authMiddleware, getMyReviews);
router.get("/", getReviews);
router.get("/:id", getReviewById);
router.put("/:id", authMiddleware, updateReview);
router.delete("/:id", authMiddleware, softDeleteReview);
router.delete("/hard/:id", authMiddleware, roleMiddleware(["admin"]), hardDeleteReview);

export default router;
