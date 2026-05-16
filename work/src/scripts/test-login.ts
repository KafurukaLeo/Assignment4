import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_key_123_abc';

async function testLogin(email: string, pass: string) {
  console.log(`Testing login for ${email}...`);
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }] }
  });

  if (!user) {
    console.log('User not found in DB');
    return;
  }

  const valid = await bcrypt.compare(pass, user.password);
  console.log(`Password valid: ${valid}`);

  if (valid) {
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login logic SUCCESS. Token generated.');
    console.log(`User role in DB: ${user.role}`);
  }
}

async function main() {
  await testLogin('admin@airbnb.local', 'kirabo123');
}

main().finally(() => prisma.$disconnect());
