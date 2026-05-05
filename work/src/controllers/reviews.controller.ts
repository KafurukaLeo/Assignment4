import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { deleteCache } from "../config/catche";

/**
 * POST /api/v1/reviews
 * Creates a new review for a listing.
 * - Required fields: userId, listingId, rating
 * - Rating must be between 1 and 5
 * - Clears the AI review summary cache for this listing after creation
 *   so the next call to GET /ai/listings/:id/review-summary gets fresh data
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, listingId, rating, comment } = req.body as {
      userId?: string; listingId?: string; rating?: number; comment?: string;
    };

    if (!userId || !listingId || !rating) {
      return res.status(400).json({ error: "userId, listingId, and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = await prisma.review.create({
      data: { userId, listingId, rating, comment: comment ?? "" },
      include: { user: true, listing: true },
    });

    res.status(201).json({ success: true, data: review });

    // Clear the cached AI review summary for this listing
    // so the next summary request reflects the new review
    deleteCache(`review-summary:${listingId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

/**
 * GET /api/v1/reviews
 * Returns all reviews ordered by most recent first.
 * - Includes user and listing details for each review
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      include: { user: true, listing: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

/**
 * GET /api/v1/reviews/:id
 * Returns a single review by its ID.
 * - Includes user and listing details
 * - Returns 404 if review doesn't exist
 */
export const getReviewById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: true, listing: true },
    });
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ success: true, data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching review" });
  }
};

/**
 * PUT /api/v1/reviews/:id
 * Updates an existing review.
 * - Both rating and comment are optional — only provided fields are updated
 * - Returns 404 if review doesn't exist
 */
export const updateReview = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { rating, comment } = req.body as { rating?: number; comment?: string };

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Keep existing values for fields not provided in the request
    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating ?? review.rating,
        comment: comment !== undefined ? comment : review.comment,
      },
      include: { user: true, listing: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

/**
 * DELETE /api/v1/reviews/:id
 * Permanently deletes a review.
 * - Returns 404 if review doesn't exist
 */
export const deleteReview = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};
