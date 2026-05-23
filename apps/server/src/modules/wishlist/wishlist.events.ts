import { eventBus } from '../../common/events/event-bus.js';
import { prisma } from '@repo/db';

export function registerWishlistEventListeners(): void {
  // Price drop listener
  eventBus.on('product.updated', async ({ productId }) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { price: true },
      });

      if (!product) return;

      const items = await prisma.wishlistItem.findMany({
        where: {
          productId,
          notifyOnPriceDrop: true,
          priceAtAdd: { gt: product.price },
        },
        include: { wishlist: { select: { userId: true } } },
      });

      if (items.length > 0) {
        const affectedUserIds = [...new Set(items.map((i) => i.wishlist.userId))];

        eventBus.emit('wishlist.priceDrop', {
          productId,
          oldPrice: items[0]?.priceAtAdd ?? 0,
          newPrice: product.price,
          affectedUserIds,
        });

        await prisma.wishlistItem.updateMany({
          where: { id: { in: items.map((i) => i.id) } },
          data: { priceAtAdd: product.price },
        });
      }
    } catch (err) {
      console.error('[wishlist] Error in price drop listener:', err);
    }
  });

  // Restock listener
  eventBus.on('inventory.stockUpdated', async ({ variantId, available }) => {
    try {
      if (available <= 0) return;

      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { productId: true },
      });

      if (!variant) return;

      const items = await prisma.wishlistItem.findMany({
        where: {
          productId: variant.productId,
          notifyOnRestock: true,
        },
        include: { wishlist: { select: { userId: true } } },
      });

      if (items.length > 0) {
        const affectedUserIds = [...new Set(items.map((i) => i.wishlist.userId))];

        eventBus.emit('wishlist.restock', {
          productId: variant.productId,
          affectedUserIds,
        });
      }
    } catch (err) {
      console.error('[wishlist] Error in restock listener:', err);
    }
  });

  console.log('[wishlist] Event listeners registered for price drop and restock detection');
}
