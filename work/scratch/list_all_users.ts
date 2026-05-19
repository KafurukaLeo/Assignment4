import prisma from '../src/config/prisma';

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log('All Users in DB:', JSON.stringify(users.map(u => ({
    email: u.email,
    username: u.username,
    name: u.name,
    role: u.role,
    status: u.status,
    hostStatus: u.hostStatus
  })), null, 2));
}

listUsers().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
