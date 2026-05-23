import 'dotenv/config';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

async function main() {
  const users = await clerk.users.getUserList({ limit: 50 });
  console.log('Total users:', users.totalCount);
  for (const u of users.data) {
    const emails = u.emailAddresses.map(e => e.emailAddress).join(', ');
    console.log(`  ${u.id} | ${emails} | ${u.firstName} ${u.lastName} | meta: ${JSON.stringify(u.publicMetadata)}`);
  }
}

main().catch(console.error);
