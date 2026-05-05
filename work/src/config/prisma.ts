import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Use the pooler URL when available — better for serverless and high-concurrency environments
// Fall back to the direct DATABASE_URL used by Prisma CLI (migrate, seed, studio)
const connectionString =
  (process.env["DATABASE_POOLER_URL"] ?? process.env["DATABASE_URL"]) as string;

// Use the PostgreSQL adapter for Prisma (required for Neon and other pg-compatible databases)
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * connectDB — connects Prisma to the database.
 * Called once at server startup in index.ts before app.listen().
 */
export async function connectDB(): Promise<void> {
  await prisma.$connect();
  console.log("Database connected");
}

// Export the Prisma client instance to be used across all controllers
export default prisma;
