import { auth } from '@clerk/nextjs/server';
import type { Roles } from '@repo/types/clerk';

export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    return false;
  }

  const userRole = sessionClaims.metadata?.role;
  return userRole === role;
}
