import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "pending_host@example.com";
  const password = "Password123!";
  const hashed = await bcrypt.hash(password, 10);
  
  try {
    // Using upsert to avoid unique constraint errors on email or username
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashed,
        role: "host",
        hostStatus: "pending",
        status: "active"
      },
      create: {
        email,
        name: "Pending Host User",
        username: "pending_host_" + Date.now().toString().slice(-4), // Unique username
        password: hashed,
        role: "host",
        hostStatus: "pending",
        status: "active"
      }
    });

    console.log(`Successfully prepared pending host: ${email}`);
  } catch (error) {
    console.error("Error preparing test host:", error);
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
