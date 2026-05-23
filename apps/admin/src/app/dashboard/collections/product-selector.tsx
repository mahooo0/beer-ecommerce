'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import type { Product } from '@repo/types';

interface ProductSelectorProps {
  collectionId: string;
  products: Product[];
}

export default function ProductSelector({ collectionId, products }: ProductSelectorProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [currentProducts, setCurrentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter products by search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    );
  });

  const handleAddProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      await api.collections.addProduct(collectionId, productId, token);

      router.refresh();
      setSearchQuery('');
      setShowResults(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      await api.collections.removeProduct(collectionId, productId, token);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Current products in collection */}
      <div>
        <h3 className="text-lg font-medium mb-3">Current Products</h3>
        {currentProducts.length === 0 ? (
          <p className="text-gray-500 text-sm">No products in this collection yet.</p>
        ) : (
          <div className="space-y-2">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  {product.images && product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveProduct(product.id)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add products section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Add Products</h3>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowResults(searchQuery.length > 0)}
            placeholder="Search products by name or SKU..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Search results dropdown */}
          {showResults && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
              {filteredProducts.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {product.images && product.images[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProduct(product.id)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {showResults && searchQuery && filteredProducts.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
              <p className="text-sm text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
