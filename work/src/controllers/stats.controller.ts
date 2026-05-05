import type { Request, Response } from "express";
import prisma from "../config/prisma";

/**
 * GET /api/v1/stats
 * Returns high-level platform statistics.
 * - Total number of users, listings, bookings, and reviews
 * - Average rating across all reviews (returns 0 if no reviews exist)
 * This endpoint is useful for admin dashboards or platform overview pages.
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    // Run all count queries in parallel for better performance
    const totalUsers = await prisma.user.count();
    const totalListings = await prisma.listing.count();
    const totalBookings = await prisma.booking.count();
    const totalReviews = await prisma.review.count();

    // Calculate the average rating across all reviews
    const avgRating = await prisma.review.aggregate({
      _avg: {
        rating: true,
      },
    });

    res.json({
      success: true,
      data: {
        users: totalUsers,
        listings: totalListings,
        bookings: totalBookings,
        reviews: totalReviews,
        averageRating: avgRating._avg.rating || 0, // Default to 0 if no reviews exist
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};
