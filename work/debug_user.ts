import prisma from './src/config/prisma';

async function checkKirabo() {
  const user = await prisma.user.findUnique({
    where: { email: 'kirabo@gmail.com' }
  });
  console.log('User Status:', JSON.stringify(user, null, 2));
}

checkKirabo().then(() => process.exit(0));
