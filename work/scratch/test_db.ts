import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function test() {
  const connectionString = (process.env["DATABASE_POOLER_URL"] ?? process.env["DATABASE_URL"]) as string;
  console.log("Connection string:", connectionString ? "Found" : "Missing");
  
  if (!connectionString) {
    console.log("No connection string found in .env");
    return;
  }

  try {
    const adapter = new PrismaPg({ connectionString });
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    console.log("Prisma connected successfully");
    const count = await prisma.listing.count();
    console.log("Listing count:", count);
  } catch (err) {
    console.error("Connection failed:", err);
  }
}

test();
