import type { Response } from "express";
import prisma from "../config/prisma";
import { model } from "../config/ai";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache } from "../config/catche";

interface Session {
  listingId: string | null;
  listing: any | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

const chatSessions = new Map<string, Session>();

const parseAiJson = (content: unknown): any => {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
};

const handleAiError = (error: any, res: Response): boolean => {
  const status = error?.response?.status ?? error?.status;
  const message = error?.message ?? "";

  if (status === 429 || message.includes("429") || message.toLowerCase().includes("rate limit")) {
    res.status(429).json({ error: "AI service is busy, please try again in a moment" });
    return true;
  }
  if (status === 401 || message.includes("401") || message.toLowerCase().includes("invalid api key")) {
    res.status(500).json({ error: "AI service configuration error" });
    return true;
  }
  return false;
};

export const smartSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    const page = parseInt(req.query["page"] as string) || 1;
    const limit = parseInt(req.query["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    let aiResponse;
    try {
      aiResponse = await model.invoke(`
        Extract filters from the following text and return ONLY JSON.
        Text: "${query}"
        Format: { "location": string | null, "type": "apartment" | "house" | "villa" | "cabin" | null, "maxPrice": number | null, "guests": number | null }
      `);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    let filters;
    try {
      filters = parseAiJson(aiResponse.content);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    const allNull = Object.values(filters).every((v) => v === null);
    if (allNull) return res.status(400).json({ error: "Could not extract any filters from your query, please be more specific" });

    const where: any = {};
    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type;
    if (filters.maxPrice) where.pricePerNight = { lte: filters.maxPrice };
    if (filters.guests) where.guests = { gte: filters.guests };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, skip, take: limit, include: { host: { select: { name: true, email: true } } } }),
      prisma.listing.count({ where }),
    ]);

    res.status(200).json({ filters, data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const generateDescription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tone = "professional" } = req.body;

    const validTones = ["professional", "casual", "luxury"];
    if (!validTones.includes(tone)) return res.status(400).json({ error: "Invalid tone. Must be one of: professional, casual, luxury" });

    const listing = await prisma.listing.findUnique({ where: { id }, include: { host: true } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.hostId !== req.userId) return res.status(403).json({ error: "Not authorized to modify this listing" });

    const prefixes: Record<string, string> = {
      professional: "Write a professional, clear, and business-like description for the following listing:",
      casual: "Write a friendly, relaxed, and conversational description for the following listing:",
      luxury: "Write an elegant, premium, and aspirational description for the following listing:",
    };

    let aiResponse;
    try {
      aiResponse = await model.invoke(`${prefixes[tone]}\n\nTitle: ${listing.title}\n\nPlease generate a compelling description that highlights the key features and appeal of this property.`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    const generatedDescription = typeof aiResponse.content === "string" ? aiResponse.content : JSON.stringify(aiResponse.content);

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: { description: generatedDescription },
      include: { host: { select: { name: true, email: true } } },
    });

    res.status(200).json({ description: generatedDescription, listing: updatedListing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, listingId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "sessionId and message are required" });

    let session = chatSessions.get(sessionId);
    if (!session) {
      session = { listingId: null, listing: null, history: [] };
      chatSessions.set(sessionId, session);
    }

    if (listingId && session.listingId !== listingId) {
      session.listingId = listingId;
      session.history = [];
      session.listing = await prisma.listing.findUnique({ where: { id: listingId } }) || null;
    } else if (listingId && !session.listing) {
      session.listing = await prisma.listing.findUnique({ where: { id: listingId } }) || null;
    }

    let systemPrompt = "You are a helpful guest support assistant for an Airbnb-like platform.\nAnswer general questions about the platform and help with common inquiries.";
    if (session.listing) {
      const amenities = Array.isArray(session.listing.amenities) ? session.listing.amenities.join(", ") : session.listing.amenities || "None";
      systemPrompt = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:
Title: ${session.listing.title} | Location: ${session.listing.location} | Price: $${session.listing.pricePerNight}/night | Guests: ${session.listing.guests} | Type: ${session.listing.type} | Amenities: ${amenities}
Answer questions accurately based on the details above. If asked something not in the listing details, say you don't have that information.`;
    }

    session.history.push({ role: "user", content: message });

    const historyText = session.history.slice(-20).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    let aiResponse;
    try {
      aiResponse = await model.invoke(`${systemPrompt}\n\n${historyText}\nAssistant:`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    const aiText = typeof aiResponse.content === "string" ? aiResponse.content : JSON.stringify(aiResponse.content);

    session.history.push({ role: "assistant", content: aiText });
    if (session.history.length > 20) session.history = session.history.slice(-20);
    chatSessions.set(sessionId, session);

    res.status(200).json({ response: aiText, sessionId, messageCount: session.history.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const reviewSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = `review-summary:${id}`;

    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const reviews = await prisma.review.findMany({
      where: { listingId: id },
      include: { user: { select: { name: true } } },
    });

    if (reviews.length < 3) {
      return res.status(400).json({ error: "Not enough reviews to generate a summary (minimum 3 required)" });
    }

    const averageRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
    const totalReviews = reviews.length;
    const reviewsText = reviews.map(r => `- ${r.user.name} (${r.rating}/5): ${r.comment || "No comment"}`).join("\n");

    let aiResponse;
    try {
      aiResponse = await model.invoke(`You are a review analyst. Analyze the following guest reviews and return ONLY a JSON object.

Reviews:
${reviewsText}

Return ONLY JSON in this exact format:
{
  "summary": "2-3 sentence overall summary of guest experience",
  "positives": ["thing 1", "thing 2", "thing 3"],
  "negatives": ["complaint 1"]
}`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    let aiResult;
    try {
      aiResult = parseAiJson(aiResponse.content);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    const response = {
      summary: aiResult.summary,
      positives: aiResult.positives ?? [],
      negatives: aiResult.negatives ?? [],
      averageRating,
      totalReviews,
    };

    setCache(cacheKey, response, 600);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const recommend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const recentBookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (recentBookings.length === 0) {
      return res.status(400).json({ error: "No booking history found. Make some bookings first to get recommendations." });
    }

    const bookedListingIds = recentBookings.map(b => b.listingId);
    const bookingHistorySummary = recentBookings.map(b =>
      `- Title: "${b.listing.title}" | Location: "${b.listing.location}" | Type: ${b.listing.type} | Price: $${b.listing.pricePerNight}/night | Guests: ${b.listing.guests}`
    ).join("\n");

    let aiResponse;
    try {
      aiResponse = await model.invoke(`Analyze the following booking history and return ONLY a JSON object.

Booking History (most recent first):
${bookingHistorySummary}

Return ONLY JSON in this exact format:
{
  "preferences": "string describing what the user likes",
  "searchFilters": {
    "location": "string or null",
    "type": "apartment" | "house" | "villa" | "cabin" | null,
    "maxPrice": number | null,
    "guests": number | null
  },
  "reason": "string explaining why these filters were chosen"
}`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    let aiAnalysis;
    try {
      aiAnalysis = parseAiJson(aiResponse.content);
    } catch {
      aiAnalysis = {
        preferences: "User shows diverse booking patterns",
        searchFilters: { location: null, type: null, maxPrice: null, guests: null },
        reason: "Unable to analyze booking history - showing popular listings",
      };
    }

    const where: any = { id: { notIn: bookedListingIds } };
    const filters = aiAnalysis.searchFilters ?? {};

    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type;
    if (filters.maxPrice != null) where.pricePerNight = { lte: filters.maxPrice };
    if (filters.guests != null) where.guests = { gte: filters.guests };

    const recommendations = await prisma.listing.findMany({
      where,
      take: 10,
      include: { host: { select: { name: true, email: true } } },
    });

    res.status(200).json({
      preferences: aiAnalysis.preferences,
      reason: aiAnalysis.reason,
      searchFilters: aiAnalysis.searchFilters,
      recommendations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while generating recommendations" });
  }
};
