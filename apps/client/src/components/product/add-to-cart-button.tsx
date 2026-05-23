'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  productName: string;
  price: number;
  imageUrl: string;
  sku?: string;
  stock: number;
  productType: string;
  weight?: number;
}

export function AddToCartButton({
  productId,
  variantId,
  productName,
  price,
  imageUrl,
  sku = '',
  stock,
  productType,
  weight,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = stock <= 0;
  const isWeighted = productType === 'WEIGHTED';
  const maxQuantity = stock > 99 ? 99 : stock;

  function handleDecrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function handleIncrement() {
    setQuantity((q) => Math.min(maxQuantity, q + 1));
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    setQuantity(Math.max(1, Math.min(maxQuantity, val)));
  }

  function handleAddToCart() {
    if (isOutOfStock) return;

    const effectiveQuantity = isWeighted ? (weight ?? 1) : quantity;

    addItem({
      productId,
      variantId: variantId ?? '',
      name: productName,
      price,
      quantity: effectiveQuantity,
      imageUrl,
      sku,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-3">
      {/* Quantity selector */}
      {!isWeighted && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-wider text-neutral-500 uppercase">Quantity</span>
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isOutOfStock}
              className="px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min={1}
              max={maxQuantity}
              disabled={isOutOfStock}
              className="w-12 border-x border-neutral-300 bg-transparent py-2 text-center text-sm focus:outline-none disabled:bg-neutral-50 disabled:text-neutral-300"
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity || isOutOfStock}
              className="px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full py-3.5 text-xs font-medium tracking-[0.2em] uppercase transition ${
          isOutOfStock
            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            : added
              ? 'bg-neutral-700 text-white'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
        }`}
      >
        {isOutOfStock ? 'Out of Stock' : added ? 'Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
}
