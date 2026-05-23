import React from 'react';
import type { Category } from '@repo/types';
import { api } from '@/lib/api';

interface BreadcrumbsProps {
  categorySlug: string;
}

export async function Breadcrumbs({ categorySlug }: BreadcrumbsProps) {
  let category: Category | null = null;
  let ancestors: Category[] = [];

  try {
    const result = await api.categories.getBySlug(categorySlug);
    category = result.data || null;

    if (!category) {
      return null;
    }

    // Parse the materialized path to get ancestor paths
    // Path format: /electronics/phones/smartphones
    const pathSegments = category.path.split('/').filter(Boolean);

    // Build ancestor paths: ['/electronics', '/electronics/phones']
    const ancestorPaths: string[] = [];
    for (let i = 1; i <= pathSegments.length - 1; i++) {
      ancestorPaths.push('/' + pathSegments.slice(0, i).join('/'));
    }

    // Fetch all categories to find ancestors
    if (ancestorPaths.length > 0) {
      const allCategoriesResult = await api.categories.getAll();
      const allCategories = allCategoriesResult.data || [];

      // Filter for ancestors
      ancestors = allCategories.filter((cat) => ancestorPaths.includes(cat.path));
      // Sort by depth to ensure correct order
      ancestors.sort((a, b) => a.depth - b.depth);
    }
  } catch (error) {
    console.error('Failed to fetch category for breadcrumbs:', error);
    return null;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';

  // Build breadcrumb list items
  const breadcrumbItems = [
    { position: 1, name: 'Home', url: siteUrl, isLink: true },
    ...ancestors.map((ancestor, index) => ({
      position: index + 2,
      name: ancestor.name,
      url: `${siteUrl}/categories/${ancestor.slug}`,
      isLink: true,
    })),
    {
      position: ancestors.length + 2,
      name: category.name,
      url: `${siteUrl}/categories/${category.slug}`,
      isLink: false,
    },
  ];

  // Build JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbItems.map((item, index) => (
            <li key={item.position} className="flex items-center">
              {index > 0 && <span className="mr-2 text-gray-300">/</span>}
              {item.isLink ? (
                <a href={item.url.replace(siteUrl, '')} className="hover:text-gray-900">
                  {item.name}
                </a>
              ) : (
                <span className="font-medium text-gray-900" aria-current="page">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
