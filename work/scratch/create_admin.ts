import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("AdminPassword123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@airbnb.local" },
    update: {
      password: hashedPassword,
      role: "admin",
      emailVerified: true,
    },
    create: {
      name: "System Admin",
      email: "admin@airbnb.local",
      username: "sysadmin",
      password: hashedPassword,
      role: "admin",
      emailVerified: true,
      bio: "Platform Administrator",
    },
  });

  console.log("Admin account created successfully!");
  console.log("Email: admin@airbnb.local");
  console.log("Password: AdminPassword123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
