import React from 'react';
import type { Category } from '@repo/types';
import { api } from '@/lib/api';
import { CategoryNav } from './category-nav';

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export function buildTree(categories: Category[]): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>();
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));

  const roots: CategoryWithChildren[] = [];
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else if (!c.parentId) {
      roots.push(node);
    }
  });

  // Sort children by position at each level
  const sortChildren = (nodes: CategoryWithChildren[]) => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);
  roots.sort((a, b) => a.position - b.position);

  return roots;
}

export async function MegaMenu() {
  let categories: Category[] = [];

  try {
    const result = await api.categories.getAll();
    categories = result.data || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return null;
  }

  const tree = buildTree(categories);
  const topLevel = tree.filter((cat) => cat.depth === 0);

  if (topLevel.length === 0) {
    return null;
  }

  return <CategoryNav categories={topLevel} />;
}
