import prisma from './src/config/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Last 5 users:', JSON.stringify(users, null, 2));
}

checkUsers().then(() => process.exit(0));
