import { prisma } from '@repo/db';
import type { Prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

// Only the target's slug/name is needed by the storefront to build the CTA link.
const targetSelect = {
  product: { select: { id: true, slug: true, name: true } },
  category: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.PromoBannerInclude;

interface PromoBannerInput {
  title?: Prisma.InputJsonValue;
  subtitle?: Prisma.InputJsonValue;
  ctaLabel?: Prisma.InputJsonValue;
  image?: string;
  productId?: string | null;
  categoryId?: string | null;
  href?: string | null;
  isActive?: boolean;
  position?: number;
}

class PromoBannerService {
  /** All banners, active and inactive — for the admin list. */
  async list() {
    return prisma.promoBanner.findMany({
      include: targetSelect,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** Active banners only, lowest position first — for the storefront. */
  async getActive() {
    return prisma.promoBanner.findMany({
      where: { isActive: true },
      include: targetSelect,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getById(id: string) {
    const banner = await prisma.promoBanner.findUnique({
      where: { id },
      include: targetSelect,
    });
    if (!banner) throw new AppError(404, 'Promo banner not found');
    return banner;
  }

  async create(data: PromoBannerInput) {
    if (!data.image) throw new AppError(400, 'Image is required');
    return prisma.promoBanner.create({
      data: {
        title: data.title ?? {},
        subtitle: data.subtitle ?? {},
        ctaLabel: data.ctaLabel ?? {},
        image: data.image,
        productId: data.productId ?? null,
        categoryId: data.categoryId ?? null,
        href: data.href ?? null,
        isActive: data.isActive ?? true,
        position: data.position ?? 0,
      },
      include: targetSelect,
    });
  }

  async update(id: string, data: PromoBannerInput) {
    await this.getById(id);
    return prisma.promoBanner.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.productId !== undefined && { productId: data.productId }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.href !== undefined && { href: data.href }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.position !== undefined && { position: data.position }),
      },
      include: targetSelect,
    });
  }

  async delete(id: string) {
    await this.getById(id);
    await prisma.promoBanner.delete({ where: { id } });
  }
}

export const promoBannerService = new PromoBannerService();
