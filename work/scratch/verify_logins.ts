import prisma from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function verify() {
  const users = await prisma.user.findMany({
    where: {
      email: { in: ['admin@airbnb.local', 'sandrah@example.com', 'samson@gmail.com'] }
    }
  });

  for (const user of users) {
    const isPassAdmin123 = await bcrypt.compare('admin123', user.password);
    const isPassPassword123 = await bcrypt.compare('Password123!', user.password);
    const isPasspassword123 = await bcrypt.compare('password123', user.password);
    console.log(`User: ${user.email}`);
    console.log(`  Role: ${user.role}, Status: ${user.status}`);
    console.log(`  Matches 'admin123':`, isPassAdmin123);
    console.log(`  Matches 'Password123!':`, isPassPassword123);
    console.log(`  Matches 'password123':`, isPasspassword123);
  }
}

verify().then(() => process.exit(0));
