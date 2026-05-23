'use client';

interface PriceDropBadgeProps {
  priceAtAdd: number; // cents
  currentPrice: number; // cents
}

export function PriceDropBadge({ priceAtAdd, currentPrice }: PriceDropBadgeProps) {
  if (currentPrice >= priceAtAdd) return null;

  const savingsCents = priceAtAdd - currentPrice;
  const savingsDollars = (savingsCents / 100).toFixed(2);

  return (
    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
      Price dropped! Save ${savingsDollars}
    </span>
  );
}
