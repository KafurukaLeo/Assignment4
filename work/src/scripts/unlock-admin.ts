import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@airbnb.local";
  const newPassword = "Admin Password223!";
  const hashed = await bcrypt.hash(newPassword, 10);

  try {
    // We use upsert to either update the existing admin or create a new one if it doesn't exist
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        loginAttempts: 0,
        lockUntil: null,
        password: hashed,
        status: "active",
        role: "admin" // Ensure it's an admin
      },
      create: {
        email,
        name: "Admin User",
        username: "admin_system",
        password: hashed,
        role: "admin",
        status: "active"
      }
    });

    console.log(`Successfully ensured admin account for ${email}`);
    console.log(`Password is set to: ${newPassword}`);
  } catch (error) {
    console.error("Error updating admin account:", error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
