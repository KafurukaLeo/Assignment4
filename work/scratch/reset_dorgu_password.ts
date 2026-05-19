import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function resetDorguPassword() {
  console.log('Resetting password for Dorgu (dorgu@gmail.com)...');
  const hashed = await bcrypt.hash('Password123!', 10);
  const updated = await prisma.user.update({
    where: { email: 'dorgu@gmail.com' },
    data: {
      password: hashed,
      loginAttempts: 0,
      lockUntil: null,
      status: 'active'
    }
  });
  console.log('Successfully reset password for Dorgu:', updated.email);
}

resetDorguPassword().then(() => process.exit(0)).catch(console.error);
