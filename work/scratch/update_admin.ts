import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "super@admin.com";
  const hashedPassword = await bcrypt.hash("SuperSecret123!", 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "admin",
      status: "active",
      emailVerified: true
    },
    create: {
      name: "Super Admin",
      email,
      username: "superadmin",
      password: hashedPassword,
      role: "admin",
      status: "active",
      emailVerified: true
    }
  });
  
  console.log("Admin account successfully upserted:", {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
