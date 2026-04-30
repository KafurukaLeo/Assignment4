import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
const adapter = new PrismaPg({
    connectionString: process.env["DATABASE_URL"],
});
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log("seed started.....");
    // Clean existing data
    await prisma.booking.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
    console.log("old data cleared");
    // Create users
    const password = await bcrypt.hash("password123", 10);
    const user1 = await prisma.user.create({
        data: {
            email: "kafurukaleo66@gmail.com",
            username: "kafuruka leo",
            name: "Kafuruka Leo",
            role: "host",
            password,
            avatar: "https://example.com/avatar1.jpg",
        },
    });
    console.log("User 1 created");
    const user2 = await prisma.user.create({
        data: {
            email: "musa@gmail.com",
            username: "musa",
            name: "Musa",
            role: "guest",
            password,
            avatar: "https://example.com/avatar2.jpg",
        },
    });
    console.log("User 2 created");
    // Create listings
    const listing1 = await prisma.listing.create({
        data: {
            title: "Modern Apartment in Kigali",
            description: "A beautiful cozy apartment located in the heart of downtown.",
            location: "Kigali, Rwanda",
            pricePerNight: 1200,
            guests: 4,
            type: "apartment",
            amenities: ["WiFi", "Kitchen", "Air Conditioning"],
            photos: ["https://example.com/listing1.jpg"],
            hostId: user1.id,
        },
    });
    console.log("Listing 1 created");
    // Create booking
    await prisma.booking.create({
        data: {
            checkIn: new Date("2025-08-01"),
            checkOut: new Date("2025-08-07"),
            totalPrice: 8400,
            status: "pending",
            guestId: user2.id,
            listingId: listing1.id,
        },
    });
    console.log("Booking created");
    console.log("Seed completed!");
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map