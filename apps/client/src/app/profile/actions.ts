'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@repo/db/prisma';
import { revalidatePath } from 'next/cache';
import { getServerT } from '@/lib/i18n/server';

export type CustomerType = 'RETAIL' | 'WHOLESALE';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  phone: string;
  customerType: CustomerType;
  companyName: string;
  taxId: string;
}

/**
 * Normalize a phone number into a stable identifier key (mirrors the server's
 * normalizePhone). Keep digits + a single leading '+', turn '00' prefix into
 * '+'. Returns '' for empty/too-short input.
 */
function normalizePhone(raw?: string | null): string {
  if (!raw) return '';
  let s = raw.trim().replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  s = (s.startsWith('+') ? '+' : '') + s.replace(/\+/g, '');
  return s.length >= 6 ? s : '';
}

/** Ensure a local DB user row exists for the Clerk user; returns its id. */
async function ensureDbUser(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const created = await prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.local`,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
    },
    select: { id: true },
  });
  return created.id;
}

export async function getProfile(): Promise<ProfileData | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  const customerType =
    (dbUser?.customerType as CustomerType | undefined) ||
    (clerkUser.publicMetadata?.customerType as CustomerType | undefined) ||
    'RETAIL';

  return {
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    avatar: clerkUser.imageUrl || '',
    phone: dbUser?.phone || '',
    customerType,
    companyName: dbUser?.companyName || '',
    taxId: dbUser?.taxId || '',
  };
}

export async function updateName(firstName: string, lastName: string) {
  const t = await getServerT('profile');
  const { userId } = await auth();
  if (!userId) throw new Error(t('actions.unauthorized'));
  if (!firstName.trim()) throw new Error(t('actions.firstNameRequired'));

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });
  // Clerk webhook syncs to DB, but write through for immediacy.
  await prisma.user.updateMany({
    where: { clerkId: userId },
    data: { firstName: firstName.trim(), lastName: lastName.trim() },
  });

  revalidatePath('/profile');
  return { success: true };
}

/**
 * Save the phone number. The number is the customer identifier: it upserts a
 * CustomerPhone (which carries the discount in Phase 2) and links the account
 * to it, so the same number always resolves to the same discount.
 */
export async function updatePhone(phone: string) {
  const t = await getServerT('profile');
  const { userId } = await auth();
  if (!userId) throw new Error(t('actions.unauthorized'));

  const normalized = normalizePhone(phone);
  if (phone.trim() && !normalized) {
    throw new Error(t('actions.invalidPhone'));
  }

  const dbUserId = await ensureDbUser(userId);

  let customerPhoneId: string | null = null;
  if (normalized) {
    const cp = await prisma.customerPhone.upsert({
      where: { phone: normalized },
      update: {},
      create: { phone: normalized },
      select: { id: true },
    });
    customerPhoneId = cp.id;
  }

  await prisma.user.update({
    where: { id: dbUserId },
    data: { phone: normalized || null, customerPhoneId },
  });

  revalidatePath('/profile');
  return { success: true, phone: normalized };
}

/**
 * Switch the account between retail and wholesale and save company details.
 * customerType goes to Clerk publicMetadata (drives the account badge + session
 * claim) and is written through to the DB. Wholesale is applied immediately
 * (auto-approve, no moderation).
 */
export async function updateAccountType(input: {
  customerType: CustomerType;
  companyName?: string;
  taxId?: string;
}) {
  const t = await getServerT('profile');
  const { userId } = await auth();
  if (!userId) throw new Error(t('actions.unauthorized'));

  const customerType: CustomerType =
    input.customerType === 'WHOLESALE' ? 'WHOLESALE' : 'RETAIL';
  const companyName =
    customerType === 'WHOLESALE' ? input.companyName?.trim() || null : null;
  const taxId = customerType === 'WHOLESALE' ? input.taxId?.trim() || null : null;

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      customerType,
      companyName: companyName ?? undefined,
      taxId: taxId ?? undefined,
    },
  });

  await ensureDbUser(userId);
  await prisma.user.updateMany({
    where: { clerkId: userId },
    data: { customerType, companyName, taxId },
  });

  revalidatePath('/profile');
  return { success: true, customerType };
}
