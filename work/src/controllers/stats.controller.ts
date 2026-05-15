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

/**
 * GET /api/v1/stats/dashboard
 * Returns role-specific dashboard statistics.
 * - Admin: Platform-wide stats
 * - Host: Stats for their listings and bookings
 * - Guest: Stats for their bookings and reviews
 */
export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const { userId, role } = req;

    if (role === "admin") {
      const [totalUsers, totalListings, totalBookings, totalRevenue] = await Promise.all([
        prisma.user.count(),
        prisma.listing.count(),
        prisma.booking.count(),
        prisma.booking.aggregate({ _sum: { totalPrice: true } }),
      ]);

      const recentBookings = await prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { listing: { select: { title: true } }, guest: { select: { name: true } } },
      });

      const topListings = await prisma.listing.findMany({
        take: 5,
        orderBy: { bookings: { _count: "desc" } },
        include: { _count: { select: { bookings: true } } },
      });

      return res.json({
        totalUsers,
        totalListings,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        recentBookings,
        topListings,
      });
    }

    if (role === "host") {
      const [listingsCount, bookingsCount, revenue, avgRating, guestBookingsCount, totalSpent] = await Promise.all([
        prisma.listing.count({ where: { hostId: userId } }),
        prisma.booking.count({ where: { listing: { hostId: userId } } }),
        prisma.booking.aggregate({
          where: { listing: { hostId: userId }, status: "confirmed" },
          _sum: { totalPrice: true },
        }),
        prisma.review.aggregate({
          where: { listing: { hostId: userId } },
          _avg: { rating: true },
        }),
        prisma.booking.count({ where: { guestId: userId } }),
        prisma.booking.aggregate({
          where: { guestId: userId, status: "confirmed" },
          _sum: { totalPrice: true },
        }),
      ]);

      const recentBookings = await prisma.booking.findMany({
        where: { listing: { hostId: userId } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { listing: { select: { title: true } }, guest: { select: { name: true } } },
      });

      const recentGuestBookings = await prisma.booking.findMany({
        where: { guestId: userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { listing: { select: { title: true, location: true, photos: true } } },
      });

      const topListings = await prisma.listing.findMany({
        where: { hostId: userId },
        take: 5,
        orderBy: { bookings: { _count: "desc" } },
        include: { _count: { select: { bookings: true } } },
      });

      return res.json({
        totalListings: listingsCount,
        totalBookings: bookingsCount,
        totalRevenue: revenue._sum.totalPrice || 0,
        averageRating: avgRating._avg.rating || 0,
        recentBookings,
        recentGuestBookings, // New: host's own trips
        topListings,
        guestStats: {
          totalBookings: guestBookingsCount,
          totalSpent: totalSpent._sum.totalPrice || 0,
        }
      });
    }

    if (role === "guest") {
      const [bookingsCount, totalSpent, reviewsCount] = await Promise.all([
        prisma.booking.count({ where: { guestId: userId } }),
        prisma.booking.aggregate({
          where: { guestId: userId, status: "confirmed" },
          _sum: { totalPrice: true },
        }),
        prisma.review.count({ where: { userId: userId } }),
      ]);

      const recentBookings = await prisma.booking.findMany({
        where: { guestId: userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { listing: { select: { title: true, location: true, photos: true } } },
      });

      return res.json({
        totalBookings: bookingsCount,
        totalSpent: totalSpent._sum.totalPrice || 0,
        totalReviews: reviewsCount,
        recentBookings,
      });
    }

    res.status(403).json({ error: "Unauthorized role" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};
