import cron from 'node-cron';
import { inventoryService } from './inventory.service.js';

export function startReservationCleanup(): void {
  // Run every minute to release expired reservations (15-min TTL)
  cron.schedule('* * * * *', async () => {
    try {
      const released = await inventoryService.releaseExpiredReservations();
      if (released > 0) {
        console.log(`[Inventory] Released ${released} expired reservation(s)`);
      }
    } catch (error) {
      console.error('[Inventory] Reservation cleanup error:', error);
    }
  });

  console.log('[Inventory] Reservation cleanup cron started (every 1 min, 15-min TTL)');
}
