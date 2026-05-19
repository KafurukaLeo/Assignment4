import prisma from '../src/config/prisma';

async function checkSpecificUser() {
  const user1 = await prisma.user.findUnique({
    where: { email: 'admin@airbnb.local' }
  });
  console.log('admin@airbnb.local:', user1);

  const user2 = await prisma.user.findUnique({
    where: { email: 'samson@gmail.com' }
  });
  console.log('samson@gmail.com:', user2);
}

checkSpecificUser().then(() => process.exit(0));
