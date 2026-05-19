import prisma from './src/config/prisma';
import bcrypt from 'bcryptjs';

async function resetAdmin() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.update({
    where: { email: 'admin@airbnb.local' },
    data: {
      password: hashedPassword,
      loginAttempts: 0,
      lockUntil: null,
      status: 'active'
    }
  });
  console.log('Admin password reset to: Admin123!');
}

resetAdmin().then(() => process.exit(0));
