import type { Request, Response } from "express";
import prisma from "../config/prisma";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache, deleteCache } from "../config/catche";

export async function getAllListings(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    const cacheKey = `listings:page=${page}:limit=${limit}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip,
        take: limit,
        include: { host: { select: { id: true, name: true, email: true, avatar: true } }, reviews: true },
      }),
      prisma.listing.count(),
    ]);

    const result = { data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    setCache(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching listings" });
  }
}

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
    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching listing" });
  }
}

export async function searchListings(req: Request, res: Response) {
  try {
    const { location, type, minPrice, maxPrice, guests } = req.query;
    const page = Math.max(1, parseInt((req.query["page"] as string) ?? "1", 10));
    const limit = Math.max(1, parseInt((req.query["limit"] as string) ?? "10", 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (location) where["location"] = { contains: location as string, mode: "insensitive" };
    if (type) where["type"] = type;
    if (minPrice || maxPrice) {
      where["pricePerNight"] = {
        ...(minPrice ? { gte: parseFloat(minPrice as string) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice as string) } : {}),
      };
    }
    if (guests) where["guests"] = { gte: parseInt(guests as string, 10) };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: { host: { select: { id: true, name: true, email: true } } },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({ data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error searching listings" });
  }
}

export async function createListing(req: AuthRequest, res: Response) {
  try {
    const { title, description, location, pricePerNight, guests, type, amenities } = req.body as {
      title?: string;
      description?: string;
      location?: string;
      pricePerNight?: number;
      guests?: number;
      type?: string;
      amenities?: string[];
    };

    if (!title || !description || !location || !pricePerNight || !guests || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        pricePerNight,
        guests,
        type: type as "apartment" | "house" | "villa" | "cabin",
        amenities: amenities ?? [],
        hostId: req.userId!,
      },
      include: { host: true },
    });

    deleteCache("listings:");
    deleteCache("listing_stats");
    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating listing" });
  }
}

export async function updateListing(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "You can only edit your own listings" });
    }

    const { title, description, location, pricePerNight, guests, type, amenities } = req.body as {
      title?: string;
      description?: string;
      location?: string;
      pricePerNight?: number;
      guests?: number;
      type?: string;
      amenities?: string[];
    };

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(pricePerNight !== undefined && { pricePerNight }),
        ...(guests !== undefined && { guests }),
        ...(type !== undefined && { type: type as "apartment" | "house" | "villa" | "cabin" }),
        ...(amenities !== undefined && { amenities }),
      },
      include: { host: true },
    });

    deleteCache("listings:");
    deleteCache("listing_stats");
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating listing" });
  }
}

export async function deleteListing(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    if (listing.hostId !== req.userId && req.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own listings" });
    }

    await prisma.listing.delete({ where: { id } });
    deleteCache("listings:");
    deleteCache("listing_stats");
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting listing" });
  }
}

type LocationStat = {
  location: string;
  total: number;
  avg_price: number;
  min_price: number;
  max_price: number;
};

type TypeStat = { type: string; _count: number };

export async function getListingStats(req: Request, res: Response) {
  try {
    const cached = getCache("listing_stats");
    if (cached) return res.json(cached);

    const [totalListings, avgResult, byLocation, byType] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
      // $queryRaw gives richer per-location stats than groupBy
      prisma.$queryRaw<LocationStat[]>`
        SELECT
          location,
          COUNT(*)::int                                AS total,
          ROUND(AVG("pricePerNight")::numeric, 2)::float AS avg_price,
          MIN("pricePerNight")                         AS min_price,
          MAX("pricePerNight")                         AS max_price
        FROM listing
        GROUP BY location
        ORDER BY total DESC
      `,
      prisma.listing.groupBy({ by: ["type"], _count: true }),
    ]);

    const stats = {
      totalListings,
      averagePrice: avgResult._avg.pricePerNight ?? 0,
      byLocation,
      byType: (byType as TypeStat[]).map((i) => ({ type: i.type, count: i._count })),
    };

    setCache("listing_stats", stats, 300);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching listing stats" });
  }
}
