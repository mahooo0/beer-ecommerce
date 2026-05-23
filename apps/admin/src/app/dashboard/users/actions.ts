'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Verify that the current user has admin privileges
 * @returns The user's role
 * @throws Redirects to /unauthorized if user is not an admin
 */
async function verifyAdmin() {
  const { sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/unauthorized');
  }
  return role;
}

/**
 * Create a new user via Clerk Backend API and sync to local DB
 */
export async function createUser(formData: FormData) {
  await verifyAdmin();

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

  // Sync to local database
  await prisma.user.create({
    data: {
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
  await verifyAdmin();

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
 * Get detailed information about a specific user
 */
export async function getUserDetail(userId: string) {
  await verifyAdmin();

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!dbUser) {
    return null;
  }

  // Get Clerk user for status info
  const clerkUser = await (await clerkClient()).users.getUser(dbUser.clerkId);

  return {
    ...dbUser,
    banned: clerkUser.banned,
  };
}

/**
 * Update a user's role
 */
export async function setUserRole(
  userId: string,
  newRole: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
) {
  await verifyAdmin();

  // Get database user to get clerkId
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkId: true },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Update Clerk metadata
  await (await clerkClient()).users.updateUserMetadata(dbUser.clerkId, {
    publicMetadata: { role: newRole },
  });

  // Update local database for immediate consistency
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Revalidate pages
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);

  return { success: true };
}

/**
 * Toggle user account status (ban/unban)
 */
export async function toggleUserStatus(userId: string, shouldBan: boolean) {
  await verifyAdmin();

  // Get database user to get clerkId
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkId: true },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Ban or unban in Clerk
  if (shouldBan) {
    await (await clerkClient()).users.banUser(dbUser.clerkId);
  } else {
    await (await clerkClient()).users.unbanUser(dbUser.clerkId);
  }

  // Update local database
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !shouldBan },
  });

  // Revalidate pages
  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);

  return { success: true };
}
