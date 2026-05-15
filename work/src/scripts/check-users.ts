import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { role: "admin" },
        { email: "pending_host@example.com" }
      ]
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      hostStatus: true,
      loginAttempts: true,
      lockUntil: true,
    },
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
