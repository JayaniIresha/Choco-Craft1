import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { reviewService } from "./review.service";
import { CreateReviewSchema, UpdateReviewSchema } from "./review.validation";

// Create Review
export async function createReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const data = CreateReviewSchema.parse(req.body);
    const review = await reviewService.createReview(userId, data);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// 🔥 NEW — Get ONLY logged user's reviews
export async function getMyReviews(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await reviewService.getReviews(
      page,
      limit,
      undefined,
      undefined,
      undefined,
      userId // ✅ filter by logged user
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Get All Reviews (public/admin)
export async function getReviews(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orderId = (req.query.orderId as string) || undefined;
    const userId = (req.query.userId as string) || undefined;
    const minRating = req.query.minRating
      ? parseInt(req.query.minRating as string)
      : undefined;
    const maxRating = req.query.maxRating
      ? parseInt(req.query.maxRating as string)
      : undefined;

    const result = await reviewService.getReviews(
      page,
      limit,
      orderId,
      minRating,
      maxRating,
      userId
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Get Review by ID
export async function getReviewById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const review = await reviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Update Review
export async function updateReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { id } = req.params as { id: string };
    const data = UpdateReviewSchema.parse(req.body);
    const review = await reviewService.updateReview(id, userId, data);
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Soft Delete Review
export async function softDeleteReview(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { id } = req.params as { id: string };
    await reviewService.softDeleteReview(id, userId);
    res.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

// Hard Delete Review (Admin)
export async function hardDeleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    await reviewService.hardDeleteReview(id);
    res.json({ message: "Review permanently deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}