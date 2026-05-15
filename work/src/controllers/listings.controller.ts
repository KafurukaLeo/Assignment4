import type { Request, Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache, deleteCache } from "../config/catche";
import { formatListing } from "../utils/listing";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";

/**
 * GET /api/v1/listings
 * Returns all listings with pagination.
 * - Results are cached for 60 seconds to reduce database load
 * - Cache key includes page and limit so different pages are cached separately
 * - Includes host info and reviews for each listing
 */
export async function getAllListings(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    // Check cache first — avoids hitting the database on repeated requests
    const cacheKey = `listings:page=${page}:limit=${limit}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    // Removed active status filter per user request ("bring back all listings")
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip,
        take: limit,
        include: { host: { select: { id: true, name: true, email: true, avatar: true } }, reviews: true },
      }),
      prisma.listing.count(),
    ]);

    const result = { 
      data: listings.map(formatListing), 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    };

    // Cache the result for 60 seconds
    setCache(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    const errorDetails = error instanceof Error ? error.stack : String(error);
    require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] ${errorDetails}\n`);
    console.error("Full error in getAllListings:", error);
    res.status(500).json({ error: "Error fetching listings", details: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * GET /api/v1/listings/me
 * Returns all listings owned by the authenticated host.
 * - Requires authentication
 */
export async function getMyListings(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { hostId: req.userId! },
        skip,
        take: limit,
        include: { reviews: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where: { hostId: req.userId! } }),
    ]);

    res.json({
      data: listings.map(formatListing),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching your listings" });
  }
}

/**
 * GET /api/v1/listings/:id
 * Returns a single listing by its ID.
 * - Includes host info, reviews (with reviewer details), and bookings
 * - Returns 404 if listing doesn't exist
 */
export async function getListingById(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, email: true, avatar: true } },
        reviews: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        bookings: true,
      },
    });

    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(formatListing(listing));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching listing" });
  }
}

/**
 * GET /api/v1/listings/search
 * Searches listings using query parameters with pagination.
 * - Supported filters: location (partial match), type, minPrice, maxPrice, guests
 * - All filters are optional — omitting them returns all listings
 * - location search is case-insensitive
 */
export async function searchListings(req: Request, res: Response) {
  try {
    const { location, type, minPrice, maxPrice, guests, checkIn, checkOut } = req.query;
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    // Removed active status filter per user request ("bring back all listings")
    const where: Record<string, unknown> = {};
    if (location) where["location"] = { contains: location as string };
    if (type) where["type"] = { contains: type as string };
    if (minPrice || maxPrice) {
      where["pricePerNight"] = {
        ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
      };
    }
    if (guests) where["guests"] = { gte: parseInt(guests as string, 10) };

    // FR-025: Filter out listings that are booked or blocked during the requested dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn as string);
      const checkOutDate = new Date(checkOut as string);

      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkInDate < checkOutDate) {
        where["bookings"] = {
          none: {
            status: { in: ["confirmed", "pending"] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        };
        where["blockedDates"] = {
          none: {
            startDate: { lt: checkOutDate },
            endDate: { gt: checkInDate },
          },
        };
      }
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: { host: { select: { id: true, name: true, email: true } } },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({ 
      data: listings.map(formatListing), 
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error searching listings" });
  }
}

/**
 * POST /api/v1/listings
 * Creates a new listing.
 * - Requires authentication (host must be logged in)
 * - Required fields: title, description, location, pricePerNight, guests, type
 * - amenities is optional (defaults to empty array)
 * - Clears the listings cache and stats cache after creation
 */
export async function createListing(req: AuthRequest, res: Response) {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities, cancellationPolicy } = req.body;

    // Parse numeric fields since they come as strings in multipart/form-data
    const price = parseFloat(pricePerNight);
    const guestCount = parseInt(guests, 10);

    if (!title || !description || !location || isNaN(price) || isNaN(guestCount) || !type) {
      return res.status(400).json({ 
        message: "Missing required fields or invalid numeric values",
        error: "Missing required fields" 
      });
    }

    // Check host approval status
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { hostStatus: true, role: true }
    });

    if (!user || (user.role === "host" && user.hostStatus !== "approved")) {
      return res.status(403).json({ 
        message: "Host account not approved. You cannot create listings until an admin approves your account.",
        error: "Host account not approved" 
      });
    }

    // Handle photo uploads to Cloudinary
    const files = (req as any).files as Express.Multer.File[];
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const { url } = await uploadToCloudinary(file.buffer, "airbnb/listings");
        photoUrls.push(url);
      }
    }

    // Parse amenities if it's a string (sent via FormData)
    let finalAmenities = amenities;
    if (typeof amenities === "string") {
      try {
        finalAmenities = JSON.parse(amenities);
      } catch (e) {
        finalAmenities = [];
      }
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight: price,
        guests: guestCount,
        type,
        amenities: JSON.stringify(finalAmenities ?? []),
        photos: JSON.stringify(photoUrls),
        cancellationPolicy: cancellationPolicy ?? "flexible",
        hostId: req.userId!,
        status: "active", // Changed from draft to active for immediate visibility as requested by user before
      },
      include: { host: true },
    });

    // Invalidate cached listings and stats since data has changed
    deleteCache("listings:");
    deleteCache("listing_stats");
    res.status(201).json({
      message: "Listing created successfully",
      ...formatListing(listing)
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    res.status(500).json({ 
      message: "An internal server error occurred while creating the listing",
      error: "Error creating listing" 
    });
  }
}

/**
 * PUT /api/v1/listings/:id
 * Updates an existing listing.
 * - Requires authentication
 * - Only the listing owner (host) or an admin can update it
 * - All fields are optional — only provided fields are updated
 * - Clears the listings cache and stats cache after update
 */
export async function updateListing(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found", error: "Listing not found" });

    // Only the host who owns this listing or an admin can edit it
    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ message: "You can only edit your own listings", error: "Unauthorized" });
    }

    const { title, description, location, pricePerNight, guests, type, amenities, cancellationPolicy, existingPhotos } = req.body;

    // Parse numeric fields
    const price = pricePerNight !== undefined ? parseFloat(pricePerNight) : undefined;
    const guestCount = guests !== undefined ? parseInt(guests, 10) : undefined;

    // Handle new photo uploads
    const files = (req as any).files as Express.Multer.File[];
    let photoUrls: string[] = [];
    
    // Start with existing photos if provided (as a JSON string from FormData)
    if (existingPhotos) {
      try {
        photoUrls = JSON.parse(existingPhotos);
      } catch (e) {
        photoUrls = [];
      }
    } else {
      // If no existingPhotos provided, keep what's currently in the DB
      photoUrls = JSON.parse(listing.photos || "[]");
    }

    // Add new uploads
    if (files && files.length > 0) {
      for (const file of files) {
        const { url } = await uploadToCloudinary(file.buffer, "airbnb/listings");
        photoUrls.push(url);
      }
    }

    // Parse amenities
    let finalAmenities = amenities;
    if (typeof amenities === "string") {
      try {
        finalAmenities = JSON.parse(amenities);
      } catch (e) {
        finalAmenities = undefined;
      }
    }

    // Only update fields that were actually provided in the request body
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(price !== undefined && !isNaN(price) && { pricePerNight: price }),
        ...(guestCount !== undefined && !isNaN(guestCount) && { guests: guestCount }),
        ...(type !== undefined && { type }),
        ...(finalAmenities !== undefined && { amenities: JSON.stringify(finalAmenities) }),
        ...(photoUrls.length > 0 && { photos: JSON.stringify(photoUrls) }),
        ...(cancellationPolicy !== undefined && { cancellationPolicy }),
      },
      include: { host: true },
    });

    // Invalidate cached listings and stats since data has changed
    deleteCache("listings:");
    deleteCache("listing_stats");
    res.json({
      message: "Listing updated successfully",
      ...formatListing(updated)
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({ 
      message: "An internal server error occurred while updating the listing",
      error: "Error updating listing" 
    });
  }
}

/**
 * DELETE /api/v1/listings/:id
 * Permanently deletes a listing.
 * - Requires authentication
 * - Only the listing owner (host) or an admin can delete it
 * - Clears the listings cache and stats cache after deletion
 */
export async function deleteListing(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Only the host who owns this listing or an admin can delete it
    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own listings" });
    }

    await prisma.listing.delete({ where: { id } });

    // Invalidate cached listings and stats since data has changed
    deleteCache("listings:");
    deleteCache("listing_stats");
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting listing" });
  }
}

// Types for raw SQL query results used in getListingStats
type LocationStat = {
  location: string;
  total: number;
  avg_price: number;
  min_price: number;
  max_price: number;
};

type TypeStat = { type: string; _count: number };

/**
 * GET /api/v1/listings/stats
 * Returns aggregated statistics about all listings.
 * - Total listings count
 * - Average price per night
 * - Breakdown by location (with avg, min, max price per location)
 * - Breakdown by property type
 * - Results are cached for 5 minutes (300 seconds)
 * - Cache is cleared when a listing is created, updated, or deleted
 */
export async function getListingStats(req: Request, res: Response) {
  try {
    // Return cached stats if available
    const cached = getCache("listing_stats");
    if (cached) return res.json(cached);

    const [totalListings, avgResult, byType, byLocation] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
      prisma.listing.groupBy({ by: ["type"], _count: true }),
      prisma.listing.groupBy({ 
        by: ["location"], 
        _count: true,
        _avg: { pricePerNight: true },
        _min: { pricePerNight: true },
        _max: { pricePerNight: true }
      }),
    ]);

    const stats = {
      totalListings,
      averagePrice: avgResult._avg.pricePerNight ?? 0,
      byLocation: byLocation.map(i => ({
        location: i.location,
        total: i._count,
        avg_price: i._avg.pricePerNight ?? 0,
        min_price: i._min.pricePerNight ?? 0,
        max_price: i._max.pricePerNight ?? 0
      })),
      byType: (byType as TypeStat[]).map((i) => ({ type: i.type, count: i._count })),
    };

    // Cache stats for 5 minutes
    setCache("listing_stats", stats, 300);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching listing stats" });
  }
}

/**
 * PATCH /api/v1/listings/:id/publish
 * FR-021: Publishes (activates) a listing so it becomes discoverable by guests.
 * - Requires authentication; only the listing owner (host) or admin can publish.
 * - Changes status from "draft" → "active".
 * PATCH /api/v1/listings/:id/unpublish
 * - Changes status from "active" → "draft" (takes listing off-market).
 */
export async function publishListing(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;
    const action = req.path.endsWith("unpublish") ? "draft" : "active";

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "You can only publish your own listings" });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: action },
      include: { host: true },
    });

    deleteCache("listings:");
    deleteCache("listing_stats");
    res.json({ 
      message: action === "active" ? "Listing published successfully" : "Listing unpublished successfully",
      listing: formatListing(updated),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating listing status" });
  }
}

/**
 * FR-059: Recalculates the average rating for a listing based on all its reviews.
 * Called internally by the reviews controller after any review create/update/delete.
 * Updates the `rating` field on the listing record in the database.
 */
export async function recalculateListingRating(listingId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: { listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const newRating = result._count.rating > 0 ? result._avg.rating : null;

  await prisma.listing.update({
    where: { id: listingId },
    data: { rating: newRating },
  });
}

/**
 * POST /api/v1/listings/:id/blocked-dates
 * FR-018: Block a date range for a listing.
 * - Requires authentication; only the host or admin can block dates.
 */
export async function createBlockedDate(req: AuthRequest, res: Response) {
  try {
    const listingId = req.params["id"] as string;
    const { startDate, endDate, reason } = req.body as { startDate?: string; endDate?: string; reason?: string };

    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate are required" });

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: "Invalid dates. startDate must be before endDate." });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can block dates" });
    }

    // Check if the blocked dates overlap with any existing bookings
    const conflict = await prisma.booking.findFirst({
      where: {
        listingId,
        status: { in: ["confirmed", "pending"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: "Cannot block dates that overlap with an existing booking" });
    }

    const blockedDate = await prisma.blocked_date.create({
      data: { listingId, startDate: start, endDate: end, reason },
    });

    res.status(201).json({ message: "Dates blocked successfully", blockedDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error blocking dates" });
  }
}

/**
 * GET /api/v1/listings/:id/blocked-dates
 * FR-018: Get all blocked dates for a listing.
 */
export async function getBlockedDates(req: Request, res: Response) {
  try {
    const listingId = req.params["id"] as string;
    const blockedDates = await prisma.blocked_date.findMany({
      where: { listingId },
      orderBy: { startDate: "asc" },
    });
    res.json(blockedDates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching blocked dates" });
  }
}

/**
 * DELETE /api/v1/listings/:id/blocked-dates/:blockedDateId
 * FR-018: Remove a blocked date range.
 * - Requires authentication; only the host or admin can remove blocked dates.
 */
export async function deleteBlockedDate(req: AuthRequest, res: Response) {
  try {
    const { id, blockedDateId } = req.params as { id: string; blockedDateId: string };

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "Only the host can unblock dates" });
    }

    const blockedDate = await prisma.blocked_date.findUnique({ where: { id: blockedDateId } });
    if (!blockedDate || blockedDate.listingId !== id) {
      return res.status(404).json({ error: "Blocked date not found" });
    }

    await prisma.blocked_date.delete({ where: { id: blockedDateId } });
    res.json({ message: "Blocked dates removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error removing blocked dates" });
  }
}
