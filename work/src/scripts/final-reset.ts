import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function reset(email: string, pass: string) {
  const hashed = await bcrypt.hash(pass, 10);
  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      loginAttempts: 0,
      lockUntil: null,
      status: 'active'
    }
  });
  console.log(`Reset ${email} to password: ${pass}`);
}

async function main() {
  await reset('admin@airbnb.local', 'admin123');
  await reset('kirabo@gmail.com', 'kirabo123');
}

main().finally(() => prisma.$disconnect());
