import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env["JWT_SECRET"] || "supersecret_key_123_abc";
const API_URL = "http://localhost:3001/api/v1";

// Helper to sign JWT tokens
function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1d" });
}

async function testEndpoint(name: string, fn: () => Promise<void>) {
  console.log(`\n=== Testing: ${name} ===`);
  try {
    await fn();
    console.log(`✅ Success: ${name}`);
  } catch (error) {
    console.error(`❌ Failed: ${name}`);
    console.error(error);
  }
}

async function run() {
  console.log("Starting AI feature end-to-end testing script...");

  // 1. Fetch a host and a guest
  const host = await prisma.user.findFirst({ where: { role: "host" } });
  const guest = await prisma.user.findFirst({ where: { role: "guest" } });
  
  if (!host || !guest) {
    console.error("No host or guest found in database. Please seed the database first.");
    process.exit(1);
  }

  const hostToken = signToken(host.id, host.role);
  const guestToken = signToken(guest.id, guest.role);

  console.log(`Found Host: ${host.name} (${host.email})`);
  console.log(`Found Guest: ${guest.name} (${guest.email})`);

  // 2. Fetch a listing owned by the host and one not owned by the host
  const hostListing = await prisma.listing.findFirst({ where: { hostId: host.id } });
  const otherListing = await prisma.listing.findFirst({ where: { hostId: { not: host.id } } });

  if (!hostListing || !otherListing) {
    console.error("Ensure database has enough listings with different hosts.");
    process.exit(1);
  }

  // --- PART 1: Smart Search ---
  await testEndpoint("Part 1 - Smart Search with Pagination & Meta", async () => {
    // A query that should match something
    const res = await fetch(`${API_URL}/ai/search?page=1&limit=2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `apartment in Kigali under 200 for 2 guests` }),
    });

    const json = await res.json();
    console.log("Search Status:", res.status);
    console.log("Extracted Filters:", json.filters);
    console.log("Pagination Meta:", json.meta);
    console.log("Data count:", json.data?.length);
    if (json.data && json.data.length > 0) {
      console.log("First listing host details included:", {
        id: json.data[0].id,
        host: json.data[0].host
      });
    }

    if (res.status !== 200) throw new Error("Search failed");
    if (!json.filters || !json.meta || !json.data) throw new Error("Missing search response properties");
  });

  await testEndpoint("Part 1 - Smart Search with Vague Query (400 check)", async () => {
    const res = await fetch(`${API_URL}/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "some nice place" }),
    });

    const json = await res.json();
    console.log("Vague search status:", res.status);
    console.log("Vague search response error message:", json.error);

    if (res.status !== 400) throw new Error("Should return 400 for vague queries");
    if (json.error !== "Could not extract any filters from your query, please be more specific") {
      throw new Error("Invalid error message for vague search");
    }
  });

  // --- PART 2: Listing Description Generator ---
  await testEndpoint("Part 2 - Description Generator Tone: Luxury (Success)", async () => {
    const res = await fetch(`${API_URL}/ai/listings/${hostListing.id}/generate-description`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hostToken}`
      },
      body: JSON.stringify({ tone: "luxury" }),
    });

    const json = await res.json();
    console.log("Generate status:", res.status);
    console.log("Generated Description (Luxury preview):", json.description?.substring(0, 100) + "...");
    
    // Check if listing is updated in the database
    const dbListing = await prisma.listing.findUnique({ where: { id: hostListing.id } });
    if (dbListing?.description !== json.description) {
      throw new Error("Listing description was not updated in the database!");
    }
    console.log("Database description updated successfully!");
  });

  await testEndpoint("Part 2 - Description Generator Tone: Casual (Success)", async () => {
    const res = await fetch(`${API_URL}/ai/listings/${hostListing.id}/generate-description`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hostToken}`
      },
      body: JSON.stringify({ tone: "casual" }),
    });

    const json = await res.json();
    console.log("Generate status:", res.status);
    console.log("Generated Description (Casual preview):", json.description?.substring(0, 100) + "...");
  });

  await testEndpoint("Part 2 - Description Generator (Unauthorized 403 check)", async () => {
    const res = await fetch(`${API_URL}/ai/listings/${otherListing.id}/generate-description`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hostToken}` // Host trying to edit someone else's listing
      },
      body: JSON.stringify({ tone: "luxury" }),
    });

    const json = await res.json();
    console.log("Status for unauthorized request:", res.status);
    console.log("Error message:", json.error);

    if (res.status !== 403) throw new Error("Should return 403 when updating someone else's listing");
  });

  // --- PART 3: Guest Support Chatbot ---
  await testEndpoint("Part 3 - Chatbot general assistant", async () => {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "test-session-123",
        message: "Hi, what platform is this?"
      }),
    });

    const json = await res.json();
    console.log("Chat status:", res.status);
    console.log("Response:", json.response);
    console.log("Session ID:", json.sessionId);
    console.log("Message Count:", json.messageCount);

    if (res.status !== 200) throw new Error("Chat failed");
  });

  await testEndpoint("Part 3 - Chatbot listing context details", async () => {
    const res = await fetch(`${API_URL}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "test-session-123",
        listingId: hostListing.id,
        message: `What amenities does this listing have? Name its title and price too.`
      }),
    });

    const json = await res.json();
    console.log("Chat with context status:", res.status);
    console.log("Response with context:", json.response);
    console.log("Message Count after switching context (should be 2 because history reset):", json.messageCount);

    if (json.messageCount !== 2) throw new Error("History did not reset when context switched");
  });

  await testEndpoint("Part 3 - Chatbot history trimming limit (20 messages)", async () => {
    // Send 22 messages in total to verify it stays truncated to max 20 messages
    const sessionId = "trimming-session-456";
    let messageCount = 0;

    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: `Exchange count number ${i}`
        }),
      });
      const json = await res.json();
      messageCount = json.messageCount;
    }

    console.log("Final message count after 11 user messages + 11 AI responses:", messageCount);
    if (messageCount > 20) throw new Error("History did not truncate to max 20 messages!");
    console.log("Chat history successfully limited to 20 messages.");
  });

  // --- PART 4: AI Booking Recommendation ---
  await testEndpoint("Part 4 - Booking Recommendation without History (400 check)", async () => {
    // Create a new fresh guest with no history
    const freshGuest = await prisma.user.create({
      data: {
        name: "Fresh Guest",
        email: `fresh.guest.${Date.now()}@example.com`,
        username: `fresh_${Date.now()}`.substring(0, 15),
        password: "password123",
        role: "guest",
      }
    });

    const freshToken = signToken(freshGuest.id, freshGuest.role);

    const res = await fetch(`${API_URL}/ai/recommend`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${freshToken}`
      },
    });

    const json = await res.json();
    console.log("Recommendation without history status:", res.status);
    console.log("Error message:", json.error);

    // Cleanup
    await prisma.user.delete({ where: { id: freshGuest.id } });

    if (res.status !== 400) throw new Error("Should return 400 when no bookings found");
  });

  await testEndpoint("Part 4 - Booking Recommendation with History", async () => {
    // Add 3 mock bookings for our guest
    const targetListing1 = await prisma.listing.findFirst({ where: { type: "apartment", location: { contains: "Kigali" } } });
    const targetListing2 = await prisma.listing.findFirst({ where: { type: "apartment", location: { contains: "Kigali" }, id: { not: targetListing1?.id } } });
    const targetListing3 = await prisma.listing.findFirst({ where: { type: "apartment", location: { contains: "Kigali" }, id: { notIn: [targetListing1?.id || "", targetListing2?.id || ""] } } });

    if (!targetListing1 || !targetListing2 || !targetListing3) {
      console.warn("Ensure database has listings in Kigali / apartment format to test recommendation history fully.");
    }

    const mockBookings = [];
    const listingsToBook = [targetListing1, targetListing2, targetListing3].filter(Boolean) as any[];

    for (const listing of listingsToBook) {
      const b = await prisma.booking.create({
        data: {
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 86400000),
          totalPrice: listing.pricePerNight,
          guestId: guest.id,
          listingId: listing.id,
        }
      });
      mockBookings.push(b);
    }

    console.log(`Created ${mockBookings.length} mock bookings for guest ${guest.name}`);

    // Call recommendation endpoint
    const res = await fetch(`${API_URL}/ai/recommend`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${guestToken}`
      },
    });

    const json = await res.json();
    console.log("Recommendation Status:", res.status);
    console.log("Preferences inferred:", json.preferences);
    console.log("Reasoning:", json.reason);
    console.log("Search filters used:", json.searchFilters);
    console.log("Recommendations count:", json.recommendations?.length);

    // Verify recommendations do not contain already booked listings
    const bookedIds = mockBookings.map(b => b.listingId);
    const hasBooked = json.recommendations?.some((rec: any) => bookedIds.includes(rec.id));
    
    // Cleanup bookings
    await prisma.booking.deleteMany({ where: { id: { in: mockBookings.map(b => b.id) } } });

    if (res.status !== 200) throw new Error("Recommendation failed");
    if (hasBooked) throw new Error("Recommendation includes already booked listings!");
    console.log("Recommendations correctly excluded already-booked listings.");
  });

  // --- PART 5: Review Summarizer ---
  await testEndpoint("Part 5 - Review Summarizer less than 3 reviews (400 check)", async () => {
    // Create a listing with 0 reviews
    const emptyListing = await prisma.listing.create({
      data: {
        title: "Empty Listing",
        description: "A nice listing with no reviews yet.",
        location: "Kigali, Rwanda",
        pricePerNight: 120.0,
        guests: 4,
        type: "apartment",
        amenities: JSON.stringify(["WiFi", "Kitchen"]),
        photos: JSON.stringify([]),
        hostId: host.id,
        status: "active",
      }
    });

    const res = await fetch(`${API_URL}/ai/listings/${emptyListing.id}/review-summary`);
    const json = await res.json();
    console.log("Summary status with 0 reviews:", res.status);
    console.log("Error message:", json.error);

    // Cleanup
    await prisma.listing.delete({ where: { id: emptyListing.id } });

    if (res.status !== 400) throw new Error("Should return 400 if listing has fewer than 3 reviews");
  });

  await testEndpoint("Part 5 - Review Summarizer caching & new review invalidation", async () => {
    // Create a listing and add 3 reviews
    const targetListing = await prisma.listing.create({
      data: {
        title: "Beautiful Penthouse",
        description: "A highly rated beautiful penthouse in the city center.",
        location: "Kigali, Rwanda",
        pricePerNight: 250.0,
        guests: 6,
        type: "apartment",
        amenities: JSON.stringify(["WiFi", "Kitchen", "Pool"]),
        photos: JSON.stringify([]),
        hostId: host.id,
        status: "active",
      }
    });

    const r1 = await prisma.review.create({
      data: { rating: 5, comment: "Absolutely marvelous experience!", userId: guest.id, listingId: targetListing.id }
    });
    const r2 = await prisma.review.create({
      data: { rating: 4, comment: "Very clean, but the street was a bit noisy.", userId: host.id, listingId: targetListing.id }
    });
    const r3 = await prisma.review.create({
      data: { rating: 5, comment: "Incredible host, gorgeous amenities and great service.", userId: guest.id, listingId: targetListing.id }
    });

    // 1. Fetch first time (generates summary, saves to cache)
    const t0 = Date.now();
    const res1 = await fetch(`${API_URL}/ai/listings/${targetListing.id}/review-summary`);
    const d1 = Date.now();
    const json1 = await res1.json();
    const time1 = d1 - t0;
    console.log(`Call 1 (Fresh summary) Time: ${time1}ms`);
    console.log("Summary 1:", json1.summary);
    console.log("Average Rating calculated:", json1.averageRating);
    console.log("Total Reviews:", json1.totalReviews);

    if (res1.status !== 200) throw new Error("Failed to get review summary");
    if (json1.totalReviews !== 3) throw new Error("Incorrect total reviews count");

    // 2. Fetch second time (should be extremely fast, retrieved from cache)
    const t1 = Date.now();
    const res2 = await fetch(`${API_URL}/ai/listings/${targetListing.id}/review-summary`);
    const d2 = Date.now();
    const json2 = await res2.json();
    const time2 = d2 - t1;
    console.log(`Call 2 (Cached summary) Time: ${time2}ms`);
    console.log("Summary 2:", json2.summary);

    if (time2 > 50) {
      console.warn(`Warning: Cache hit took ${time2}ms, which is a bit slow, but verify logic is correct.`);
    } else {
      console.log("Cache is working perfectly!");
    }

    // 3. Post a new review and verify cache is invalidated
    console.log("Posting a new review to invalidate cache...");
    const newReviewRes = await fetch(`${API_URL}/reviews/listings/${targetListing.id}/reviews`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${guestToken}`
      },
      body: JSON.stringify({
        userId: guest.id,
        listingId: targetListing.id,
        rating: 1,
        comment: "Worst service ever, AC broke!"
      })
    });
    
    const newReviewJson = await newReviewRes.json();
    console.log("New Review Post status:", newReviewRes.status);
    console.log("New Review JSON Response:", newReviewJson);

    // Wait 100ms for the server event loop to run the asynchronous cache invalidation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4. Fetch third time (should trigger fresh AI call because cache was invalidated)
    const t2 = Date.now();
    const res3 = await fetch(`${API_URL}/ai/listings/${targetListing.id}/review-summary`);
    const d3 = Date.now();
    const json3 = await res3.json();
    const time3 = d3 - t2;
    console.log(`Call 3 (Fresh summary after invalidation) Time: ${time3}ms`);
    console.log("Summary 3 (should mention negative check-in/AC):", json3.summary);
    console.log("New Average Rating calculated:", json3.averageRating);
    console.log("New Total Reviews:", json3.totalReviews);

    // Verify reviews directly in the database
    const dbReviews = await prisma.review.findMany({ where: { listingId: targetListing.id } });
    console.log("Reviews directly in DB:", dbReviews.length);

    // Cleanup reviews & listing
    await prisma.review.deleteMany({ where: { listingId: targetListing.id } });
    await prisma.listing.delete({ where: { id: targetListing.id } });

    if (json3.totalReviews !== 4) throw new Error("Cache was not invalidated correctly after review was posted!");
    console.log("Cache invalidation working perfectly!");
  });

  console.log("\nAll tests completed!");
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  prisma.$disconnect();
});
