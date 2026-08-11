import { prisma } from '@repo/db';
import { clerkClient } from '@clerk/express';
import { AppError } from '../../common/middleware/error-handler.js';

/**
 * Normalize a phone number into a stable identifier key.
 * NOT full E.164 validation (that needs libphonenumber) — just enough to make
 * the same human-entered number collapse to one key: keep digits and a single
 * leading '+', turn a leading '00' into '+'. Returns undefined for empty input.
 */
export function normalizePhone(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  let s = raw.trim().replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  // collapse any stray '+' not at the start
  s = (s.startsWith('+') ? '+' : '') + s.replace(/\+/g, '');
  return s.length >= 6 ? s : undefined;
}

export class AuthService {
  /**
   * Upsert the CustomerPhone identity for a number and return its id.
   * Never overwrites the discount payload — that is admin-owned (Phase 2).
   */
  async upsertCustomerPhone(phone: string): Promise<string> {
    const record = await prisma.customerPhone.upsert({
      where: { phone },
      update: {},
      create: { phone },
      select: { id: true },
    });
    return record.id;
  }

  async syncUser(data: {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    role?: string;
    customerType?: string;
    companyName?: string;
    taxId?: string;
  }) {
    // Resolve the phone identity first so the discount can hang off it later.
    const normalizedPhone = normalizePhone(data.phone);
    const customerPhoneId = normalizedPhone
      ? await this.upsertCustomerPhone(normalizedPhone)
      : undefined;

    // Passing `undefined` leaves a column untouched on update — safe for
    // `user.updated` events that don't carry every field.
    return prisma.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        phone: normalizedPhone,
        role: data.role as any, // Role enum from Prisma schema
        customerType: data.customerType as any, // CustomerType enum
        companyName: data.companyName,
        taxId: data.taxId,
        customerPhoneId,
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        phone: normalizedPhone,
        role: (data.role as any) || 'CUSTOMER', // Default to CUSTOMER if not provided
        customerType: (data.customerType as any) || 'RETAIL',
        companyName: data.companyName,
        taxId: data.taxId,
        customerPhoneId,
      },
    });
  }

  async deleteUser(clerkId: string) {
    // Soft delete by setting isActive to false to preserve order history
    return prisma.user.update({
      where: { clerkId },
      data: { isActive: false },
    });
  }

  async getUserByClerkId(clerkId: string) {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  /**
   * Hybrid user listing: Clerk is the source of truth for who exists / who has
   * signed in on the storefront, enriched with local DB rows (isActive, and
   * anything else we track locally). This shows every user immediately, even
   * before the Clerk→DB webhook has synced them.
   */
  async getAllUsers(page = 1, limit = 20, query?: string) {
    const offset = (page - 1) * limit;

    const clerkRes = await clerkClient.users.getUserList({
      limit,
      offset,
      orderBy: '-created_at',
      ...(query ? { query } : {}),
    });

    const clerkUsers = clerkRes.data;
    const total = clerkRes.totalCount;

    // Enrich with local DB rows keyed by clerkId.
    const clerkIds = clerkUsers.map((u) => u.id);
    const dbUsers = clerkIds.length
      ? await prisma.user.findMany({ where: { clerkId: { in: clerkIds } } })
      : [];
    const dbByClerk = new Map(dbUsers.map((u) => [u.clerkId, u]));

    const data = clerkUsers.map((u) => {
      const db = dbByClerk.get(u.id);
      const primaryEmail =
        u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses[0]?.emailAddress ||
        '';
      return {
        id: u.id, // clerkId — stable key used across the users UI
        clerkId: u.id,
        email: primaryEmail,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        role: (u.publicMetadata?.role as string) || db?.role || 'CUSTOMER',
        avatar: u.imageUrl || db?.avatar || null,
        isActive: db ? db.isActive : !u.banned,
        banned: u.banned,
        inDb: !!db,
        createdAt: new Date(u.createdAt).toISOString(),
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const authService = new AuthService();
