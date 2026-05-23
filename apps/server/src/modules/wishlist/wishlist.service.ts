import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

export class WishlistService {
  async getOrCreateWishlist(userId: string) {
    const existing = await prisma.wishlist.findFirst({
      where: { userId },
    });
    if (existing) return existing;

    return prisma.wishlist.create({
      data: {
        userId,
        name: 'My Wishlist',
      },
    });
  }

  async getWishlistItems(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addItem(userId: string, productId: string, priceAtAdd: number) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
      update: {},
      create: {
        wishlistId: wishlist.id,
        productId,
        priceAtAdd,
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
    });
  }

  async removeItem(userId: string, productId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    try {
      await prisma.wishlistItem.delete({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
      });
    } catch {
      throw new AppError(404, 'Wishlist item not found');
    }
  }

  async syncItems(userId: string, items: { productId: string; priceAtAdd: number }[]) {
    const wishlist = await this.getOrCreateWishlist(userId);
    await Promise.all(
      items.map((item) =>
        prisma.wishlistItem.upsert({
          where: {
            wishlistId_productId: {
              wishlistId: wishlist.id,
              productId: item.productId,
            },
          },
          update: {},
          create: {
            wishlistId: wishlist.id,
            productId: item.productId,
            priceAtAdd: item.priceAtAdd,
          },
        })
      )
    );
    return items.length;
  }

  async updateNotifyPrefs(
    userId: string,
    productId: string,
    prefs: { notifyOnPriceDrop?: boolean; notifyOnRestock?: boolean }
  ) {
    const wishlist = await this.getOrCreateWishlist(userId);
    try {
      return await prisma.wishlistItem.update({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
        data: prefs,
        include: {
          product: {
            include: {
              brand: true,
              category: true,
            },
          },
        },
      });
    } catch {
      throw new AppError(404, 'Wishlist item not found');
    }
  }

  async getItemCount(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    return prisma.wishlistItem.count({
      where: { wishlistId: wishlist.id },
    });
  }
}

export const wishlistService = new WishlistService();
