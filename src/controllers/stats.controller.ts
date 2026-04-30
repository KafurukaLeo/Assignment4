import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalListings = await prisma.listing.count();
    const totalBookings = await prisma.booking.count();
    const totalReviews = await prisma.review.count();

    // Average rating
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
        averageRating: avgRating._avg.rating || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
};