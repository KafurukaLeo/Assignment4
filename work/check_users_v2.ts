import prisma from './src/config/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Last 20 users:', JSON.stringify(users.map(u => ({ email: u.email, username: u.username, createdAt: u.createdAt })), null, 2));
}

checkUsers().then(() => process.exit(0));
