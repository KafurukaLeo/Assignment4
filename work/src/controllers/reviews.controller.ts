import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { deleteCache } from "../config/catche";

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
    deleteCache(`review-summary:${listingId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

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

export const updateReview = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { rating, comment } = req.body as { rating?: number; comment?: string };

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

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
