'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@repo/db/prisma';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  // Manual validation
  if (!firstName || firstName.trim().length === 0) {
    throw new Error('First name is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    throw new Error('Last name is required');
  }
  if (firstName.length > 50) {
    throw new Error('First name must be 50 characters or less');
  }
  if (lastName.length > 50) {
    throw new Error('Last name must be 50 characters or less');
  }

  // Update Clerk user (this will trigger webhook to sync to DB)
  const client = await clerkClient();
  await client.users.updateUser(userId, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });

  revalidatePath('/profile');
  return { success: true };
}

export async function getProfile() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Get user from Clerk
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  // Get database user for additional info (like phone)
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  return {
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    avatar: clerkUser.imageUrl || '',
    phone: dbUser?.phone || '',
  };
}
