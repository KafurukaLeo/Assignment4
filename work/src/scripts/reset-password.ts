import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3] || 'Password123!';

  if (!email) {
    console.log('Usage: npx tsx src/scripts/reset-password.ts <email> [newPassword]');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword,
      loginAttempts: 0,
      lockUntil: null
    }
  });

  console.log(`Password for ${email} has been reset to: ${newPassword}`);
  console.log('Account has also been unlocked if it was locked.');
}

resetPassword()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
