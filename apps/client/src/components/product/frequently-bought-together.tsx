'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@repo/types';
import { useCartStore } from '../../stores/cart-store';

interface FBTProduct extends Product {
  brand?: { name: string };
}

interface CurrentProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sku: string;
}

interface FrequentlyBoughtTogetherProps {
  products: FBTProduct[];
  currentProduct: CurrentProduct;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function FrequentlyBoughtTogether({
  products,
  currentProduct,
}: FrequentlyBoughtTogetherProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    () => new Set(products.map((p) => p.id)),
  );
  const addItem = useCartStore((state) => state.addItem);

  if (products.length === 0) {
    return null;
  }

  const toggleProduct = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const checkedProducts = products.filter((p) => checkedIds.has(p.id));
  const totalPrice =
    currentProduct.price + checkedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalItems = 1 + checkedProducts.length;

  const handleAddAll = () => {
    // Add current product
    addItem({
      productId: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      quantity: 1,
      imageUrl: currentProduct.image,
      sku: currentProduct.sku,
    });

    // Add checked FBT products
    for (const product of checkedProducts) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.images[0] ?? '',
        sku: product.sku ?? '',
      });
    }
  };

  return (
    <section className="mt-8 border border-border-secondary rounded-lg p-6">
      <h2 className="text-xl font-semibold text-primary mb-4">Frequently Bought Together</h2>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Current product (always shown, not checkable) */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-16 h-16 bg-secondary_subtle rounded border border-border-secondary overflow-hidden">
            {currentProduct.image ? (
              <Image
                src={currentProduct.image}
                alt={currentProduct.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-fg-quaternary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-secondary text-center max-w-[80px] line-clamp-2">
            {currentProduct.name}
          </p>
          <p className="text-xs font-semibold text-primary">{formatPrice(currentProduct.price)}</p>
        </div>

        {/* FBT products with checkboxes and + separators */}
        {products.map((product) => {
          const isChecked = checkedIds.has(product.id);
          const productImage = product.images[0] ?? '';

          return (
            <React.Fragment key={product.id}>
              <span className="text-lg text-quaternary font-medium">+</span>
              <div className="flex flex-col items-center gap-1">
                <label className="cursor-pointer relative">
                  <div
                    className={`relative w-16 h-16 bg-secondary_subtle rounded border-2 overflow-hidden transition-colors ${
                      isChecked ? 'border-border-brand' : 'border-border-secondary'
                    }`}
                  >
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-fg-quaternary">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleProduct(product.id)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 accent-brand-solid"
                    aria-label={`Include ${product.name}`}
                  />
                </label>
                <p className="text-xs text-secondary text-center max-w-[80px] line-clamp-2">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-primary">{formatPrice(product.price)}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          onClick={handleAddAll}
          className="bg-brand-solid hover:bg-brand-solid_hover text-white font-medium py-2 px-5 rounded-lg transition-colors duration-100 ease-linear"
        >
          Add {totalItems} {totalItems === 1 ? 'item' : 'items'} &mdash; {formatPrice(totalPrice)}
        </button>
        <p className="text-sm text-tertiary">
          {checkedProducts.length > 0
            ? `Total price for ${totalItems} items`
            : 'Only current item will be added'}
        </p>
      </div>
    </section>
  );
}
