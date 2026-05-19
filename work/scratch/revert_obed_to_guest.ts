import prisma from '../src/config/prisma';

async function revertObed() {
  console.log('Reverting Obed to guest...');
  const updated = await prisma.user.update({
    where: { email: 'obed@gmail.com' },
    data: {
      role: 'guest',
      hostStatus: 'pending'
    }
  });
  console.log('Successfully reverted Obed:', updated);
}

revertObed().then(() => process.exit(0)).catch(console.error);
