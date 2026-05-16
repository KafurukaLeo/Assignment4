import prisma from './src/config/prisma';

async function makeKevinGuest() {
  const email = 'kevin@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      role: 'guest',
      hostStatus: 'pending' // Reset to pending instead of null
    }
  });
  
  console.log(`Successfully changed role for ${user.name} (${user.email}) to: ${user.role}`);
}

makeKevinGuest().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
