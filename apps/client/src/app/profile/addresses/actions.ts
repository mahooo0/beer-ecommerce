'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@repo/db/prisma';
import { revalidatePath } from 'next/cache';

export async function getAddresses() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Find database user by clerkId
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Return addresses sorted by default first
  return prisma.address.findMany({
    where: { userId: dbUser.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createAddress(formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Find database user
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Extract fields from formData
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const street = formData.get('street') as string;
  const street2 = (formData.get('street2') as string) || null;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const country = formData.get('country') as string;
  const phone = (formData.get('phone') as string) || null;
  const label = (formData.get('label') as string) || null;
  const isDefault = formData.get('isDefault') === 'true';

  // Validate required fields
  if (!firstName || firstName.trim().length === 0) {
    throw new Error('First name is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    throw new Error('Last name is required');
  }
  if (!street || street.trim().length === 0) {
    throw new Error('Street address is required');
  }
  if (!city || city.trim().length === 0) {
    throw new Error('City is required');
  }
  if (!state || state.trim().length === 0) {
    throw new Error('State is required');
  }
  if (!zipCode || zipCode.trim().length === 0) {
    throw new Error('Zip code is required');
  }
  if (!country || country.trim().length === 0) {
    throw new Error('Country is required');
  }

  // If isDefault is true, unset all other defaults first
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: dbUser.id },
      data: { isDefault: false },
    });
  }

  // Create address
  await prisma.address.create({
    data: {
      userId: dbUser.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      street: street.trim(),
      street2: street2 ? street2.trim() : null,
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      phone: phone ? phone.trim() : null,
      label: label ? label.trim() : null,
      isDefault,
    },
  });

  revalidatePath('/profile/addresses');
  return { success: true };
}

export async function updateAddress(addressId: string, formData: FormData) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Find database user
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Verify ownership
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: dbUser.id },
  });

  if (!address) {
    throw new Error('Address not found');
  }

  // Extract and validate fields
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const street = formData.get('street') as string;
  const street2 = (formData.get('street2') as string) || null;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zipCode = formData.get('zipCode') as string;
  const country = formData.get('country') as string;
  const phone = (formData.get('phone') as string) || null;
  const label = (formData.get('label') as string) || null;
  const isDefault = formData.get('isDefault') === 'true';

  // Validate required fields
  if (!firstName || firstName.trim().length === 0) {
    throw new Error('First name is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    throw new Error('Last name is required');
  }
  if (!street || street.trim().length === 0) {
    throw new Error('Street address is required');
  }
  if (!city || city.trim().length === 0) {
    throw new Error('City is required');
  }
  if (!state || state.trim().length === 0) {
    throw new Error('State is required');
  }
  if (!zipCode || zipCode.trim().length === 0) {
    throw new Error('Zip code is required');
  }
  if (!country || country.trim().length === 0) {
    throw new Error('Country is required');
  }

  // If isDefault is true, unset all other defaults first
  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: dbUser.id },
      data: { isDefault: false },
    });
  }

  // Update address
  await prisma.address.update({
    where: { id: addressId },
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      street: street.trim(),
      street2: street2 ? street2.trim() : null,
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      country: country.trim(),
      phone: phone ? phone.trim() : null,
      label: label ? label.trim() : null,
      isDefault,
    },
  });

  revalidatePath('/profile/addresses');
  return { success: true };
}

export async function deleteAddress(addressId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Find database user
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Verify ownership and delete
  await prisma.address.deleteMany({
    where: { id: addressId, userId: dbUser.id },
  });

  revalidatePath('/profile/addresses');
  return { success: true };
}

export async function setDefaultAddress(addressId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error('Unauthorized');
  }

  // Find database user
  const dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    throw new Error('User not found');
  }

  // Verify ownership
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: dbUser.id },
  });

  if (!address) {
    throw new Error('Address not found');
  }

  // Transaction: unset all defaults, set this one as default
  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: dbUser.id },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath('/profile/addresses');
  return { success: true };
}
