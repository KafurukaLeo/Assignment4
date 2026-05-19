import prisma from './src/config/prisma';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  const email = 'super@admin.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      loginAttempts: 0,
      lockUntil: null
    },
    create: {
      name: 'Super Admin',
      email,
      username: 'superadmin',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      emailVerified: true
    }
  });
  console.log('Super Admin created!');
  console.log('Email: ' + email);
  console.log('Password: ' + password);
}

createSuperAdmin().then(() => process.exit(0));
