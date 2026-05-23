import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@repo/types';

interface BundleItemEntry {
  product: Product;
  quantity: number;
}

interface BundleItemsListProps {
  bundleItems: BundleItemEntry[];
  bundlePrice: number;
}

export function BundleItemsList({ bundleItems, bundlePrice }: BundleItemsListProps) {
  if (!bundleItems || bundleItems.length === 0) {
    return null;
  }

  const individualTotal = bundleItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const savings = Math.max(0, individualTotal - bundlePrice);
  const savingsPercent =
    individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">What&apos;s Included</h3>

      <ul className="space-y-3">
        {bundleItems.map((item) => {
          const thumbnail = item.product.images?.[0] ?? null;
          return (
            <li
              key={item.product.id}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{item.product.name}</p>
                <p className="text-sm text-gray-500">{formatPrice(item.product.price)}</p>
              </div>

              {item.quantity > 1 && (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  x{item.quantity}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>If bought separately:</span>
          <span className="line-through">{formatPrice(individualTotal)}</span>
        </div>

        <div className="flex items-center justify-between font-bold text-gray-900">
          <span className="text-base">Bundle price:</span>
          <span className="text-xl">{formatPrice(bundlePrice)}</span>
        </div>

        {savings > 0 && (
          <div className="flex items-center justify-between text-sm font-semibold text-green-700">
            <span>You save:</span>
            <span>
              {formatPrice(savings)} ({savingsPercent}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
