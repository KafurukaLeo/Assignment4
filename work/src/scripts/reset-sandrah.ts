import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'sandrah@example.com';
  const newPassword = 'Password123!';
  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      loginAttempts: 0,
      lockUntil: null,
      role: 'admin',
      status: 'active'
    }
  });

  console.log(`Successfully reset admin account for ${email}`);
  console.log(`Password is set to: ${newPassword}`);
}

main().finally(() => prisma.$disconnect());
