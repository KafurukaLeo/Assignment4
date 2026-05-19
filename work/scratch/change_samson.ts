import prisma from '../src/config/prisma';

async function changeSamson() {
  console.log('Searching for users named "samson"...');
  const allUsers = await prisma.user.findMany();
  
  const users = allUsers.filter(u => 
    u.email.toLowerCase().includes('samson') ||
    u.name.toLowerCase().includes('samson') ||
    u.username.toLowerCase().includes('samson')
  );

  if (users.length === 0) {
    console.log('No user found containing "samson" in their email, name, or username.');
    // Let's print the last few registered users to help find who it is
    const lastUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    console.log('Last 10 users in database:', lastUsers.map(u => ({ email: u.email, name: u.name, username: u.username, role: u.role })));
    return;
  }

  console.log(`Found ${users.length} matching user(s):`);
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, name: u.name, username: u.username, role: u.role, hostStatus: u.hostStatus })), null, 2));

  for (const user of users) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'guest',
        hostStatus: 'pending' // reset to guest settings
      }
    });
    console.log(`Updated user ${updated.name} (${updated.email}) role to: ${updated.role}, hostStatus to: ${updated.hostStatus}`);
  }
}

changeSamson()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
