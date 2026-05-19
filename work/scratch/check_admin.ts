import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: "admin" }
  });
  console.log("Admin accounts found:", admins.map(a => ({ id: a.id, email: a.email, username: a.username, role: a.role })));
  
  if (admins.length === 0) {
    console.log("No admins found, checking first 5 users:");
    const firstUsers = await prisma.user.findMany({
      take: 5
    });
    console.log(firstUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
