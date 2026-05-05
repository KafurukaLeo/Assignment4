import type { Response } from "express";
import prisma from "../config/prisma";
import { model } from "../config/ai";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { getCache, setCache } from "../config/catche";

// Session interface for the chatbot — stores listing context and conversation history
interface Session {
  listingId: string | null;
  listing: any | null;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

// In-memory store for chat sessions — each session is identified by a unique sessionId
const chatSessions = new Map<string, Session>();

/**
 * Extracts a JSON object from AI response text.
 * The AI sometimes wraps JSON in markdown code blocks (```json ... ```)
 * so we use a regex to find the first { ... } block and parse it.
 */
const parseAiJson = (content: unknown): any => {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
};

/**
 * Handles errors thrown by the Groq AI service.
 * - 429: Rate limit exceeded → return 429 with a friendly message
 * - 401: Invalid API key → return 500 with a config error message
 * Returns true if the error was handled, false if it should be handled elsewhere.
 */
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

/**
 * POST /api/v1/ai/search
 * Smart Search — allows users to search listings using natural language.
 * The AI extracts structured filters (location, type, maxPrice, guests) from the query,
 * then those filters are used to query the database with pagination.
 * Returns 400 if query is missing or AI cannot extract any filters.
 */
export const smartSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    // Parse pagination params from query string, default to page=1, limit=10
    const page = parseInt(Array.isArray(req.query["page"]) ? req.query["page"][0] as string : req.query["page"] as string) || 1;
    const limit = parseInt(Array.isArray(req.query["limit"]) ? req.query["limit"][0] as string : req.query["limit"] as string) || 10;
    const skip = (page - 1) * limit;

    // Ask AI to extract filters from the natural language query
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

    // Parse the AI response into a usable filters object
    let filters;
    try {
      filters = parseAiJson(aiResponse.content);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    // If all filters are null, the query was too vague — ask user to be more specific
    const allNull = Object.values(filters).every((v) => v === null);
    if (allNull) return res.status(400).json({ error: "Could not extract any filters from your query, please be more specific" });

    // Build Prisma where clause from extracted filters
    const where: any = {};
    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type;
    if (filters.maxPrice) where.pricePerNight = { lte: filters.maxPrice };
    if (filters.guests) where.guests = { gte: filters.guests };

    // Run both queries in parallel for performance
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

/**
 * POST /api/v1/ai/listings/:id/generate-description
 * Description Generator — generates an AI-written description for a listing.
 * Requires authentication. Only the listing owner (host) can generate a description.
 * Accepts a "tone" field: "professional", "casual", or "luxury".
 * The generated description is saved to the database and returned in the response.
 */
export const generateDescription = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params["id"]);
    const { tone = "professional" } = req.body;

    // Validate tone — only these three values are accepted
    const validTones = ["professional", "casual", "luxury"];
    if (!validTones.includes(tone)) return res.status(400).json({ error: "Invalid tone. Must be one of: professional, casual, luxury" });

    // Fetch the listing and verify it exists
    const listing = await prisma.listing.findUnique({ where: { id: String(id) }, include: { host: true } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Only the host who owns this listing can generate a description
    if (listing.hostId !== req.userId) return res.status(403).json({ error: "Not authorized to modify this listing" });

    // Different prompt prefixes based on the requested tone
    const prefixes: Record<string, string> = {
      professional: "Write a professional, clear, and business-like description for the following listing:",
      casual: "Write a friendly, relaxed, and conversational description for the following listing:",
      luxury: "Write an elegant, premium, and aspirational description for the following listing:",
    };

    // Call the AI model with the tone-specific prompt
    let aiResponse;
    try {
      aiResponse = await model.invoke(`${prefixes[tone]}\n\nTitle: ${listing.title}\n\nPlease generate a compelling description that highlights the key features and appeal of this property.`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    const generatedDescription = typeof aiResponse.content === "string" ? aiResponse.content : JSON.stringify(aiResponse.content);

    // Save the generated description to the database
    const updatedListing = await prisma.listing.update({
      where: { id: String(id) },
      data: { description: generatedDescription },
      include: { host: { select: { name: true, email: true } } },
    });

    res.status(200).json({ description: generatedDescription, listing: updatedListing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * POST /api/v1/ai/chat
 * Chatbot — a guest support assistant that can answer questions about a specific listing
 * or general platform questions.
 * - sessionId: required, identifies the conversation (use any unique string)
 * - listingId: optional, if provided the AI answers based on that listing's details
 * - message: required, the user's question
 * Conversation history is kept per session (max 10 exchanges = 20 messages).
 * Switching to a different listingId resets the conversation history.
 */
export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, listingId, message } = req.body;

    // Both sessionId and message are required
    if (!sessionId || !message) return res.status(400).json({ error: "sessionId and message are required" });

    // Get existing session or create a new one
    let session = chatSessions.get(sessionId);
    if (!session) {
      session = { listingId: null, listing: null, history: [] };
      chatSessions.set(sessionId, session);
    }

    // If a new listingId is provided, fetch that listing and reset history
    if (listingId && session.listingId !== listingId) {
      session.listingId = listingId;
      session.history = [];
      session.listing = await prisma.listing.findUnique({ where: { id: listingId } }) || null;
    } else if (listingId && !session.listing) {
      // Listing ID is the same but listing data wasn't fetched yet
      session.listing = await prisma.listing.findUnique({ where: { id: listingId } }) || null;
    }

    // Build system prompt — if listing context exists, include its details
    let systemPrompt = "You are a helpful guest support assistant for an Airbnb-like platform.\nAnswer general questions about the platform and help with common inquiries.";
    if (session.listing) {
      const amenities = Array.isArray(session.listing.amenities) ? session.listing.amenities.join(", ") : session.listing.amenities || "None";
      systemPrompt = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:
Title: ${session.listing.title} | Location: ${session.listing.location} | Price: $${session.listing.pricePerNight}/night | Guests: ${session.listing.guests} | Type: ${session.listing.type} | Amenities: ${amenities}
Answer questions accurately based on the details above. If asked something not in the listing details, say you don't have that information.`;
    }

    // Add the user's message to history before calling AI
    session.history.push({ role: "user", content: message });

    // Build the full prompt from system prompt + last 20 messages of history
    const historyText = session.history.slice(-20).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    let aiResponse;
    try {
      aiResponse = await model.invoke(`${systemPrompt}\n\n${historyText}\nAssistant:`);
    } catch (aiError) {
      if (handleAiError(aiError, res)) return;
      return res.status(500).json({ error: "AI service unavailable" });
    }

    const aiText = typeof aiResponse.content === "string" ? aiResponse.content : JSON.stringify(aiResponse.content);

    // Add AI response to history and enforce the 20-message limit
    session.history.push({ role: "assistant", content: aiText });
    if (session.history.length > 20) session.history = session.history.slice(-20);
    chatSessions.set(sessionId, session);

    res.status(200).json({ response: aiText, sessionId, messageCount: session.history.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * GET /api/v1/ai/listings/:id/review-summary
 * Review Summarizer — reads all reviews for a listing and generates an AI summary.
 * Returns 404 if the listing doesn't exist.
 * Returns 400 if the listing has fewer than 3 reviews.
 * averageRating and totalReviews are calculated from the database (not by AI).
 * The response is cached for 10 minutes. Cache is cleared when a new review is posted.
 */
export const reviewSummary = async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params["id"]);
    const cacheKey = `review-summary:${id}`;

    // Return cached response if available (cache TTL = 10 minutes)
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    // Verify the listing exists
    const listing = await prisma.listing.findUnique({ where: { id: String(id) } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    // Fetch all reviews with reviewer name
    const reviews = await prisma.review.findMany({
      where: { listingId: String(id) },
      include: { user: { select: { name: true } } },
    });

    // Minimum 3 reviews required to generate a meaningful summary
    if (reviews.length < 3) {
      return res.status(400).json({ error: "Not enough reviews to generate a summary (minimum 3 required)" });
    }

    // Calculate average rating ourselves — do not ask AI to do math
    const averageRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
    const totalReviews = reviews.length;

    // Format reviews into readable text for the AI prompt
    const reviewsText = reviews.map(r => `- ${(r as any).user.name} (${r.rating}/5): ${r.comment || "No comment"}`).join("\n");

    // Ask AI to analyze the reviews and return structured JSON
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
      averageRating,   // calculated from DB, not AI
      totalReviews,    // total number of reviews in DB
    };

    // Cache the response for 10 minutes (600 seconds)
    setCache(cacheKey, response, 600);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

/**
 * POST /api/v1/ai/recommend
 * Booking Recommendation — recommends listings based on the user's booking history.
 * Requires authentication.
 * Fetches the last 5 bookings, sends them to AI to infer preferences,
 * then queries the database for matching listings.
 * Already-booked listings are excluded from recommendations.
 * Returns 400 if the user has no booking history.
 */
export const recommend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // userId comes from the JWT token via authenticate middleware
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Fetch the user's last 5 bookings with listing details
    const recentBookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Cannot generate recommendations without booking history
    if (recentBookings.length === 0) {
      return res.status(400).json({ error: "No booking history found. Make some bookings first to get recommendations." });
    }

    // Collect IDs of already-booked listings to exclude from results
    const bookedListingIds = recentBookings.map(b => b.listingId);

    // Format booking history as readable text for the AI prompt
    const bookingHistorySummary = recentBookings.map(b => {
      const l = (b as any).listing;
      return `- Title: "${l.title}" | Location: "${l.location}" | Type: ${l.type} | Price: $${l.pricePerNight}/night | Guests: ${l.guests}`;
    }).join("\n");

    // Ask AI to analyze booking history and suggest search filters
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

    // Parse AI response — fall back to empty filters if parsing fails
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

    // Build Prisma where clause — always exclude already-booked listings
    const where: any = { id: { notIn: bookedListingIds } };
    const filters = aiAnalysis.searchFilters ?? {};

    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type;
    if (filters.maxPrice != null) where.pricePerNight = { lte: filters.maxPrice };
    if (filters.guests != null) where.guests = { gte: filters.guests };

    // Fetch up to 10 recommended listings
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
