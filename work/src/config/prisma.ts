import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
