import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Roles } from '@repo/types/clerk';
import {
  hasAdminAccess,
  hasPermission,
  getPermissions,
  type Permission,
} from '@repo/types/rbac';

/** Read the current user's role from the session token claims. */
export async function getCurrentRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role;
}

export async function checkRole(role: Roles): Promise<boolean> {
  const { sessionClaims } = await auth();

  if (!sessionClaims) {
    return false;
  }

  const userRole = sessionClaims.metadata?.role;
  return userRole === role;
}

/**
 * Require that the current user can access the admin panel at all
 * (has at least one permission). Redirects to /unauthorized otherwise.
 */
export async function requireAdminAccess(): Promise<string> {
  const role = await getCurrentRole();
  if (!hasAdminAccess(role)) {
    redirect('/unauthorized');
  }
  return role as string;
}

/**
 * Require a specific permission for the current user.
 * Redirects to /unauthorized if the user lacks it.
 */
export async function requirePermission(permission: Permission): Promise<void> {
  const role = await getCurrentRole();
  if (!hasPermission(role, permission)) {
    redirect('/unauthorized');
  }
}

/** Get the permission list for the current user (for conditional UI). */
export async function getCurrentPermissions(): Promise<Permission[]> {
  return getPermissions(await getCurrentRole());
}

/**
 * Legacy helper: require ADMIN or SUPER_ADMIN. Prefer requirePermission()
 * for section-level checks. Kept for existing callers.
 */
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
