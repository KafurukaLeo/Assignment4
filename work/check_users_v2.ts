import prisma from './src/config/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: { role: 'admin' }
  });
  console.log('Last 20 users:', JSON.stringify(users.map(u => ({ email: u.email, username: u.username, role: u.role, status: u.status, loginAttempts: u.loginAttempts, lockUntil: u.lockUntil, createdAt: u.createdAt })), null, 2));
}

checkUsers().then(() => process.exit(0));
