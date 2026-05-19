import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function resetObedPassword() {
  console.log('Resetting password for Obed (obed@gmail.com)...');
  const hashed = await bcrypt.hash('Password123!', 10);
  const updated = await prisma.user.update({
    where: { email: 'obed@gmail.com' },
    data: {
      password: hashed,
      loginAttempts: 0,
      lockUntil: null,
      status: 'active'
    }
  });
  console.log('Successfully reset password for Obed:', updated.email);
}

resetObedPassword().then(() => process.exit(0)).catch(console.error);
