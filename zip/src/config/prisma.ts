import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Use pooler URL when available (better for serverless/concurrent requests),
// fall back to the direct URL used by Prisma CLI
const connectionString =
  (process.env["DATABASE_POOLER_URL"] ?? process.env["DATABASE_URL"]) as string;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function connectDB(): Promise<void> {
  await prisma.$connect();
  console.log("Database connected");
}

export default prisma;
