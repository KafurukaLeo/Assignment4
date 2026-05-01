import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (non-pooler) URL so Prisma CLI can run DDL / migrations against Neon
    url: process.env["DATABASE_URL"] as string,
  },
});
