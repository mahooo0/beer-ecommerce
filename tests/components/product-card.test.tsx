// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../../apps/client/src/components/product/product-card';
import type { Product } from '@repo/types';

// Mock Next.js modules
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockProduct: Product & { averageRating?: number; reviewCount?: number; brand?: { name: string } } = {
  id: 'prod_1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  price: 1999, // $19.99
  images: ['https://res.cloudinary.com/test/image.jpg'],
  sku: 'SKU-001',
  productType: 'SIMPLE',
  status: 'ACTIVE',
  attributes: {},
  isActive: true,
  categoryId: 'cat_1',
  createdAt: new Date(),
  updatedAt: new Date(),
  averageRating: 4.5,
  reviewCount: 10,
  brand: { name: 'Test Brand' },
};

describe('ProductCard Component', () => {
  it('renders product name and formatted price', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('renders product image or placeholder', () => {
    const { rerender } = render(<ProductCard product={mockProduct} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    // Next.js Image component transforms the URL, so check it contains the original
    expect(image.getAttribute('src')).toContain('https%3A%2F%2Fres.cloudinary.com%2Ftest%2Fimage.jpg');

    // Test placeholder when no images
    const productNoImage = { ...mockProduct, images: [] };
    rerender(<ProductCard product={productNoImage} />);
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('renders star rating with average', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByTestId('star-rating')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument(); // review count
  });

  it('renders sale price with strikethrough on original', () => {
    const saleProduct = { ...mockProduct, compareAtPrice: 2999 }; // $29.99 original
    render(<ProductCard product={saleProduct} />);
    expect(screen.getByText('$29.99')).toHaveClass('line-through');
    expect(screen.getByText('$19.99')).toHaveClass('text-red-600');
  });

  it('links to product detail page by slug', () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/test-product');
  });

  it('renders add-to-cart button', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });
});
