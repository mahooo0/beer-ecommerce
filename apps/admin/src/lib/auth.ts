import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Roles } from '@repo/types/clerk';

export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    return false;
  }

  const userRole = sessionClaims.metadata?.role;
  return userRole === role;
}

export async function requireAdmin(): Promise<void> {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    redirect('/unauthorized');
  }

  const userRole = sessionClaims.metadata?.role;

  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }
}
