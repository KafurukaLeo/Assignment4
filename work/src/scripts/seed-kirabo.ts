import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hostId = "453670ba-7358-4ac4-ae59-ea687385c72f"; // Kirabo
  const guestId = "01315a63-1d41-4c9d-833e-f39a61cc8a38"; // Rae Marks

  console.log("Seeding data for Kirabo...");

  // 1. Create Listings
  const listing1 = await prisma.listing.create({
    data: {
      title: "Luxury Apartment in Kigali Heights",
      description: "A stunning luxury apartment with a view of the city. Perfect for business travelers.",
      location: "Kigali, Rwanda",
      pricePerNight: 120,
      guests: 2,
      type: "apartment",
      amenities: JSON.stringify(["wifi", "parking", "kitchen", "ac"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"]),
      status: "active",
      hostId: hostId,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "Cozy Garden Cottage",
      description: "Quiet and peaceful cottage surrounded by greenery. Great for couples.",
      location: "Musanze, Rwanda",
      pricePerNight: 85,
      guests: 3,
      type: "house",
      amenities: JSON.stringify(["wifi", "parking", "kitchen"]),
      photos: JSON.stringify(["https://images.unsplash.com/photo-1449156001433-3d07399478f6"]),
      status: "active",
      hostId: hostId,
    },
  });

  console.log("Listings created.");

  // 2. Create Bookings
  const today = new Date();
  
  // Pending Booking
  await prisma.booking.create({
    data: {
      listingId: listing1.id,
      guestId: guestId,
      checkIn: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // In 1 week
      checkOut: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      totalPrice: 360,
      status: "pending",
    },
  });

  // Confirmed Booking
  await prisma.booking.create({
    data: {
      listingId: listing2.id,
      guestId: guestId,
      checkIn: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // In 2 days
      checkOut: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      totalPrice: 255,
      status: "confirmed",
    },
  });

  // Past Booking (Completed)
  await prisma.booking.create({
    data: {
      listingId: listing1.id,
      guestId: guestId,
      checkIn: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      checkOut: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      totalPrice: 360,
      status: "confirmed",
    },
  });

  console.log("Bookings created.");
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
