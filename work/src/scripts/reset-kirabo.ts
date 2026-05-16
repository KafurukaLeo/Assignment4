import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'kirabo@gmail.com';
  const newPassword = 'Password123!';
  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      loginAttempts: 0,
      lockUntil: null,
      status: 'active'
    }
  });

  console.log(`User ${user.email} has been reset. Password is now: ${newPassword}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
