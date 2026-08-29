import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

interface LoyaltyTierInput {
  minSpendCents?: number;
  percent?: number;
  active?: boolean;
  position?: number;
}

function clampPercent(p: number): number {
  const n = Math.round(Number(p) || 0);
  return Math.min(100, Math.max(0, n));
}

class LoyaltyTierService {
  /** All tiers, active and inactive — for the admin list. */
  async list() {
    return prisma.loyaltyTier.findMany({
      orderBy: [{ minSpendCents: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Active tiers only, cheapest threshold first — for the storefront/cabinet. */
  async getActive() {
    return prisma.loyaltyTier.findMany({
      where: { active: true },
      orderBy: [{ minSpendCents: 'asc' }],
    });
  }

  async getById(id: string) {
    const tier = await prisma.loyaltyTier.findUnique({ where: { id } });
    if (!tier) throw new AppError(404, 'Loyalty tier not found');
    return tier;
  }

  async create(data: LoyaltyTierInput) {
    return prisma.loyaltyTier.create({
      data: {
        minSpendCents: Math.max(0, Math.round(data.minSpendCents ?? 0)),
        percent: clampPercent(data.percent ?? 0),
        active: data.active ?? true,
        position: data.position ?? 0,
      },
    });
  }

  async update(id: string, data: LoyaltyTierInput) {
    await this.getById(id);
    return prisma.loyaltyTier.update({
      where: { id },
      data: {
        ...(data.minSpendCents !== undefined && {
          minSpendCents: Math.max(0, Math.round(data.minSpendCents)),
        }),
        ...(data.percent !== undefined && { percent: clampPercent(data.percent) }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await prisma.loyaltyTier.delete({ where: { id } });
  }

  /**
   * Discount percent for a given lifetime cumulative spend (cents): the highest
   * active tier whose threshold the spend reaches. Returns 0 when none apply.
   */
  async resolvePercent(spendCents: number): Promise<number> {
    const tier = await prisma.loyaltyTier.findFirst({
      where: { active: true, minSpendCents: { lte: spendCents } },
      orderBy: [{ minSpendCents: 'desc' }],
    });
    return tier?.percent ?? 0;
  }
}

export const loyaltyTierService = new LoyaltyTierService();
