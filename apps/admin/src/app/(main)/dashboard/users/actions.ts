'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { hasPermission, PERMISSIONS, type Permission } from '@repo/types/rbac';

/**
 * Verify that the current user holds a specific permission.
 * @returns The user's role
 * @throws Error if the user lacks the permission
 */
async function verifyPermission(permission: Permission) {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role as string | undefined;
  if (!hasPermission(role, permission)) {
    throw new Error('Forbidden: you do not have permission to perform this action');
  }
  return role;
}

/**
 * Create a new user via Clerk Backend API and sync to local DB
 */
export async function createUser(formData: FormData) {
  await verifyPermission(PERMISSIONS.USERS_MANAGE);

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = (formData.get('role') as string) || 'CUSTOMER';

  if (!firstName || !lastName || !email || !password) {
    throw new Error('All fields are required');
  }

  const clerk = await clerkClient();

  // Create user in Clerk
  const clerkUser = await clerk.users.createUser({
    firstName,
    lastName,
    emailAddress: [email],
    password,
    publicMetadata: { role },
  });

  // Sync to local database (upsert to tolerate a racing Clerk webhook)
  await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: { email, firstName, lastName, role: role as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName,
      lastName,
      role: role as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    },
  });

  revalidatePath('/dashboard/users');
  return { success: true, userId: clerkUser.id };
}

/**
 * Get paginated list of all users
 */
export async function getUsers(page = 1, limit = 20) {
  await verifyPermission(PERMISSIONS.USERS_VIEW);

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            addresses: true,
            reviews: true,
            wishlists: true,
          },
        },
      },
    }),
    prisma.user.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get detailed information about a specific user (keyed by clerkId).
 * Clerk is the source of truth; local DB rows are joined when present so this
 * works even for users who haven't been synced to the DB yet.
 */
export async function getUserDetail(clerkId: string) {
  await verifyPermission(PERMISSIONS.USERS_VIEW);

  const clerk = await clerkClient();
  let clerkUser;
  try {
    clerkUser = await clerk.users.getUser(clerkId);
  } catch {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
    include: {
      addresses: true,
      _count: {
        select: {
          reviews: true,
          wishlists: true,
        },
      },
    },
  });

  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    '';

  return {
    id: clerkUser.id, // clerkId
    clerkId: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName || dbUser?.firstName || '',
    lastName: clerkUser.lastName || dbUser?.lastName || '',
    role:
      ((clerkUser.publicMetadata?.role as string) ||
        dbUser?.role ||
        'CUSTOMER') as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    avatar: clerkUser.imageUrl || dbUser?.avatar || undefined,
    phone: dbUser?.phone || clerkUser.phoneNumbers?.[0]?.phoneNumber || undefined,
    isActive: dbUser ? dbUser.isActive : !clerkUser.banned,
    banned: clerkUser.banned,
    createdAt: new Date(clerkUser.createdAt),
    lastLoginAt: clerkUser.lastActiveAt
      ? new Date(clerkUser.lastActiveAt)
      : dbUser?.lastLoginAt ?? null,
    addresses: dbUser?.addresses ?? [],
    _count: dbUser?._count ?? { reviews: 0, wishlists: 0 },
    inDb: !!dbUser,
  };
}

/**
 * Update a user's role
 */
export async function setUserRole(
  clerkId: string,
  newRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
) {
  await verifyPermission(PERMISSIONS.ROLES_MANAGE);

  const clerk = await clerkClient();

  // Update Clerk metadata (the source of truth for the session-claim role)
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { role: newRole },
  });

  // Upsert the local DB row so the list/detail stay consistent even if the
  // user hasn't been synced by the webhook yet.
  const clerkUser = await clerk.users.getUser(clerkId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    '';
  await prisma.user.upsert({
    where: { clerkId },
    update: { role: newRole },
    create: {
      clerkId,
      email,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      role: newRole,
    },
  });

  // Revalidate pages
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${clerkId}`);

  return { success: true };
}

/**
 * Toggle user account status (ban/unban)
 */
export async function toggleUserStatus(clerkId: string, shouldBan: boolean) {
  await verifyPermission(PERMISSIONS.USERS_MANAGE);

  const clerk = await clerkClient();

  // Ban or unban in Clerk
  if (shouldBan) {
    await clerk.users.banUser(clerkId);
  } else {
    await clerk.users.unbanUser(clerkId);
  }

  // Mirror to the local DB if the user exists there (no-op otherwise).
  await prisma.user.updateMany({
    where: { clerkId },
    data: { isActive: !shouldBan },
  });

  // Revalidate pages
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${clerkId}`);

  return { success: true };
}
