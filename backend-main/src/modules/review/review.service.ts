import prisma from "../../config/prisma";
import { CreateReviewInput, UpdateReviewInput } from "./review.validation";
import { queryActive } from "../../utils/softDelete";

export const reviewService = {
  async createReview(userId: string, data: CreateReviewInput) {
    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Check if user already has a review for this order
    const existingReview = await prisma.review.findUnique({
      where: {
        orderId_userId: {
          orderId: data.orderId,
          userId,
        },
      },
    });

    if (existingReview && !existingReview.isDeleted) {
      throw new Error("You have already reviewed this order");
    }

    const review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        userId,
        rating: data.rating,
        comment: data.comment,
      },
      include: { user: true, order: true },
    });

    return review;
  },

  async getReviewById(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true, order: true },
    });

    if (review?.isDeleted) {
      return null;
    }

    return review;
  },

  async getReviews(
    page = 1,
    limit = 10,
    orderId?: string,
    minRating?: number,
    maxRating?: number,
    userId?: string
  ) {
    const skip = (page - 1) * limit;

    const where = {
      ...queryActive(),
      ...(orderId && { orderId }),
      ...(userId && { userId }),
      ...(minRating || maxRating) && {
        rating: {
          ...(minRating && { gte: minRating }),
          ...(maxRating && { lte: maxRating }),
        },
      },
    } as any;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true, order: true },
      }),
      prisma.review.count({ where }),
    ]);

    return { reviews, total, pages: Math.ceil(total / limit) };
  },

  async updateReview(id: string, userId: string, data: UpdateReviewInput) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== userId) {
      throw new Error("You can only update your own reviews");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
      include: { user: true, order: true },
    });

    return updated;
  },

  async softDeleteReview(id: string, userId: string) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.userId !== userId) {
      throw new Error("You can only delete your own reviews");
    }

    await prisma.review.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async hardDeleteReview(id: string) {
    await prisma.review.delete({
      where: { id },
    });
  },
};
