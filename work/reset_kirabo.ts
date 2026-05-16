import prisma from './src/config/prisma';
import bcrypt from 'bcryptjs';

async function resetKirabo() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  await prisma.user.update({
    where: { email: 'kirabo@gmail.com' },
    data: {
      password: hashedPassword,
      loginAttempts: 0,
      lockUntil: null,
      emailVerified: true // Also verify them to be safe
    }
  });
  console.log('Kirabo password reset to: Password123!');
}

resetKirabo().then(() => process.exit(0));
