/**
 * One-off script to promote a user to ADMIN role.
 * Usage: npx tsx scripts/promote-admin.ts <email>
 */
import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/promote-admin.ts <email>');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const prisma = new PrismaClient();

async function main() {
  // Find user in Clerk by email
  const users = await clerk.users.getUserList({ emailAddress: [email] });

  if (users.totalCount === 0) {
    // List all users to help debug
    const allUsers = await clerk.users.getUserList({ limit: 50 });
    console.log('All Clerk users:');
    for (const u of allUsers.data) {
      console.log(`  - ${u.id}: ${u.emailAddresses.map(e => e.emailAddress).join(', ')} (${u.firstName} ${u.lastName})`);
    }
    console.error(`\nNo Clerk user found with email: ${email}`);
    process.exit(1);
  }

  const clerkUser = users.data[0];
  console.log(`Found Clerk user: ${clerkUser.id} (${clerkUser.firstName} ${clerkUser.lastName})`);

  // Update Clerk publicMetadata
  await clerk.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: { role: 'ADMIN' },
  });
  console.log('Updated Clerk publicMetadata: role = ADMIN');

  // Update local database
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (dbUser) {
    await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: { role: 'ADMIN' },
    });
    console.log('Updated database role: ADMIN');
  } else {
    // Create user in DB if not exists
    await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        role: 'ADMIN',
      },
    });
    console.log('Created database user with role: ADMIN');
  }

  console.log(`\nDone! ${email} is now an ADMIN.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
