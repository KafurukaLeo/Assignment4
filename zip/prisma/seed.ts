import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] as string });
const prisma = new PrismaClient({ adapter });

const LISTING_TYPES = ["apartment", "house", "villa", "cabin"] as const;
const BOOKING_STATUSES = ["pending", "confirmed", "cancelled"] as const;
const AMENITIES_POOL = [
  "WiFi", "Pool", "AC", "Heating", "Parking", "Kitchen", "Gym",
  "Spa", "Pet-friendly", "Washer", "Dryer", "TV", "Balcony", "BBQ",
];

async function main() {
  console.log("Seeding started...");

  // 1. Cleanup in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  console.log("Existing data cleared");

  // 2. Hash password once — reused for all seed users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create 100 users (30 hosts, 70 guests) using upsert
  //    Deterministic emails ensure running the seed twice never creates duplicates
  const users = [];
  for (let i = 0; i < 100; i++) {
    const role: "host" | "guest" = i < 30 ? "host" : "guest";
    const user = await prisma.user.upsert({
      where: { email: `seed.user${i}@example.com` },
      update: {},
      create: {
        name: faker.person.fullName(),
        email: `seed.user${i}@example.com`,
        username: `user_${i}_${faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15)}`,
        password: hashedPassword,
        role,
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatarGitHub(),
      },
    });
    users.push(user);
  }
  const hosts = users.slice(0, 30);
  const guests = users.slice(30);
  console.log(`Created ${users.length} users (${hosts.length} hosts, ${guests.length} guests)`);

  // 4. Create 100 listings — individual creates so we capture IDs for bookings
  const listings = [];
  for (let i = 0; i < 100; i++) {
    const listing = await prisma.listing.create({
      data: {
        title: `${faker.word.adjective()} ${faker.word.noun()} in ${faker.location.city()}`,
        description: faker.lorem.paragraphs(2),
        location: faker.location.city() + ", " + faker.location.country(),
        pricePerNight: parseFloat(faker.commerce.price({ min: 30, max: 600 })),
        guests: faker.number.int({ min: 1, max: 12 }),
        type: LISTING_TYPES[i % LISTING_TYPES.length]!,
        amenities: faker.helpers.arrayElements(AMENITIES_POOL, faker.number.int({ min: 3, max: 7 })),
        photos: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
          faker.image.urlLoremFlickr({ category: "house" }),
        ),
        rating: parseFloat(faker.number.float({ min: 3, max: 5, fractionDigits: 1 }).toFixed(1)),
        hostId: hosts[i % hosts.length]!.id,
      },
    });
    listings.push(listing);
  }
  console.log(`Created ${listings.length} listings`);

  // 5. Create 100 bookings — each links a guest to a listing with calculated totalPrice
  for (let i = 0; i < 100; i++) {
    const listing = listings[i % listings.length]!;
    const guest = guests[i % guests.length]!;

    const checkIn = faker.date.soon({ days: 365, refDate: new Date() });
    const checkOut = new Date(checkIn.getTime() + faker.number.int({ min: 1, max: 14 }) * 86_400_000);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
    const totalPrice = parseFloat((nights * listing.pricePerNight).toFixed(2));

    await prisma.booking.create({
      data: {
        checkIn,
        checkOut,
        totalPrice,
        status: BOOKING_STATUSES[i % BOOKING_STATUSES.length]!,
        guestId: guest.id,
        listingId: listing.id,
      },
    });
  }
  console.log("Created 100 bookings");

  // 6. Create 100 reviews — spread across listings and users
  for (let i = 0; i < 100; i++) {
    const listing = listings[i % listings.length]!;
    const user = users[i % users.length]!;

    await prisma.review.create({
      data: {
        rating: parseFloat(faker.number.float({ min: 1, max: 5, fractionDigits: 1 }).toFixed(1)),
        comment: faker.lorem.sentences({ min: 1, max: 3 }),
        userId: user.id,
        listingId: listing.id,
      },
    });
  }
  console.log("Created 100 reviews");

  console.log("Seeding complete!");
  console.log("All seed passwords: password123");
  console.log("Host example:  seed.user0@example.com");
  console.log("Guest example: seed.user30@example.com");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
