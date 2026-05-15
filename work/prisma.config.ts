import "dotenv/config";

/**
 * Prisma config — schema and migration paths for the Prisma CLI.
 * Note: 'prisma/config' module is only available in Prisma v6+.
 * Using plain export for compatibility with Prisma v5.
 */
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
};
