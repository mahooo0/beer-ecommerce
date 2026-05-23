import slugifyFn from 'slugify';
import { prisma } from '@repo/db';

/**
 * Generates a unique slug from a product name
 * Handles collision detection by appending -1, -2, etc.
 * @param name - The product name to slugify
 * @param existingId - Optional product ID for updates (allows reusing same slug)
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  name: string,
  existingId?: string
): Promise<string> {
  // Handle empty string
  if (!name || name.trim() === '') {
    name = 'product';
  }

  // Generate base slug
  const baseSlug = (slugifyFn as any)(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 0;

  // Keep checking until we find a unique slug
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });

    // Slug doesn't exist - we can use it
    if (!existing) {
      return slug;
    }

    // Slug exists but it's for the same product (update case) - we can use it
    if (existingId && existing.id === existingId) {
      return slug;
    }

    // Slug exists for a different product - try next counter
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
