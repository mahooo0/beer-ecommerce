import { prisma } from '@repo/db';
import slugifyFn from 'slugify';
import { AppError } from '../../common/middleware/error-handler.js';

// Base slug from a (possibly Cyrillic) name. Transliterates RU/UA → Latin via
// the `slugify` package (e.g. "Пиво Світле" → "pivo-svitle") so Cyrillic names
// don't collapse to an empty slug.
function baseSlugify(name: string): string {
  return (slugifyFn as any)(name, { lower: true, strict: true, trim: true }) || 'category';
}

// Helper: Generate unique slug from name (collision-checked against categories)
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = baseSlugify(name);

  let slug = baseSlug;
  let counter = 2;

  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Helper: Build nested tree from flat category array
function buildTreeFromFlat(categories: any[]): any[] {
  const categoryMap = new Map();
  const roots: any[] = [];

  // First pass: create map
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id);
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Helper: Get ancestor paths from materialized path
function getAncestorPathsFromPath(path: string): string[] {
  const segments = path.split('/').filter(s => s);
  const paths: string[] = [];

  for (let i = 1; i <= segments.length; i++) {
    paths.push('/' + segments.slice(0, i).join('/'));
  }

  return paths;
}

export class CategoryService {
  async getAll() {
    const categories = await prisma.category.findMany({
      orderBy: [
        { depth: 'asc' },
        { position: 'asc' }
      ],
      include: {
        _count: {
          select: { children: true }
        }
      }
    });

    return categories;
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { position: 'asc' }
        },
        children: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    return category;
  }

  async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        attributes: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    return category;
  }

  async getTree() {
    const categories = await prisma.category.findMany({
      orderBy: [
        { depth: 'asc' },
        { position: 'asc' }
      ]
    });

    return buildTreeFromFlat(categories);
  }

  async create(data: {
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
    metaTitle?: string;
    metaDescription?: string;
    position?: number;
  }) {
    // Generate slug
    const slug = await generateUniqueSlug(data.name);

    // Calculate path and depth
    let path = `/${slug}`;
    let depth = 0;

    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new AppError(404, 'Parent category not found');
      }

      // Check max depth
      if (parent.depth >= 5) {
        throw new AppError(400, 'Maximum category depth (5) exceeded');
      }

      path = `${parent.path}/${slug}`;
      depth = parent.depth + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        path,
        depth,
        position: data.position ?? 0,
        parentId: data.parentId,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      include: {
        attributes: true,
        children: true
      }
    });

    return category;
  }

  async update(id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    image?: string;
    metaTitle?: string;
    metaDescription?: string;
    position?: number;
  }) {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    let slug = data.slug;
    let shouldUpdatePaths = false;

    // Handle slug regeneration
    if (data.name && !data.slug) {
      // If name changed and slug wasn't explicitly provided
      const oldSlugFromName = baseSlugify(category.name);

      if (category.slug === oldSlugFromName || category.slug.startsWith(oldSlugFromName + '-')) {
        // Auto-generated slug, regenerate it
        slug = await generateUniqueSlug(data.name);
        shouldUpdatePaths = true;
      }
    } else if (data.slug && data.slug !== category.slug) {
      // Slug explicitly changed
      shouldUpdatePaths = true;
    }

    if (shouldUpdatePaths && slug) {
      // Update paths in transaction
      const newPath = category.path.replace(/\/[^/]+$/, `/${slug}`);

      await prisma.$transaction(async (tx) => {
        // Update the category
        await tx.category.update({
          where: { id },
          data: {
            name: data.name,
            slug,
            description: data.description,
            image: data.image,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            position: data.position,
            path: newPath,
          }
        });

        // Update all descendant paths
        const descendants = await tx.category.findMany({
          where: {
            path: {
              startsWith: category.path + '/'
            }
          }
        });

        for (const descendant of descendants) {
          const updatedPath = descendant.path.replace(category.path, newPath);
          await tx.category.update({
            where: { id: descendant.id },
            data: { path: updatedPath }
          });
        }
      });
    } else {
      // Simple update without path changes
      await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          image: data.image,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          position: data.position,
        }
      });
    }

    return this.getById(id);
  }

  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true
      }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    if (category.children.length > 0) {
      throw new AppError(400, 'Cannot delete category with children');
    }

    if (category.products.length > 0) {
      throw new AppError(400, 'Cannot delete category with products');
    }

    await prisma.category.delete({
      where: { id }
    });
  }

  async move(id: string, newParentId: string | null, position: number) {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    // Check circular reference
    if (newParentId) {
      const descendantIds = await this.getDescendantIds(id);
      if (descendantIds.includes(newParentId)) {
        throw new AppError(400, 'Cannot move category into its own descendant');
      }
    }

    // Calculate new path and depth
    let newPath = `/${category.slug}`;
    let newDepth = 0;

    if (newParentId) {
      const newParent = await prisma.category.findUnique({
        where: { id: newParentId }
      });

      if (!newParent) {
        throw new AppError(404, 'New parent category not found');
      }

      if (newParent.depth >= 5) {
        throw new AppError(400, 'Maximum category depth (5) exceeded');
      }

      newPath = `${newParent.path}/${category.slug}`;
      newDepth = newParent.depth + 1;
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update the category
      await tx.category.update({
        where: { id },
        data: {
          parentId: newParentId,
          path: newPath,
          depth: newDepth,
          position,
        }
      });

      // Update all descendants
      const descendants = await tx.category.findMany({
        where: {
          path: {
            startsWith: category.path + '/'
          }
        }
      });

      const depthDiff = newDepth - category.depth;

      for (const descendant of descendants) {
        const updatedPath = descendant.path.replace(category.path, newPath);
        const updatedDepth = descendant.depth + depthDiff;

        await tx.category.update({
          where: { id: descendant.id },
          data: {
            path: updatedPath,
            depth: updatedDepth,
          }
        });
      }
    });

    return this.getById(id);
  }

  async reorderSiblings(parentId: string | null, orderedIds: string[]) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.category.update({
          where: { id: orderedIds[i] },
          data: { position: i }
        });
      }
    });
  }

  async getDescendantIds(id: string): Promise<string[]> {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      return [];
    }

    const descendants = await prisma.category.findMany({
      where: {
        path: {
          startsWith: category.path + '/'
        }
      },
      select: { id: true }
    });

    return descendants.map(d => d.id);
  }

  async getAncestors(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const ancestorPaths = getAncestorPathsFromPath(category.path);

    // Remove the category's own path
    ancestorPaths.pop();

    if (ancestorPaths.length === 0) {
      return [];
    }

    const ancestors = await prisma.category.findMany({
      where: {
        path: {
          in: ancestorPaths
        }
      },
      orderBy: { depth: 'asc' }
    });

    return ancestors;
  }

  // Category attribute methods
  async getAttributes(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const attributes = await prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { position: 'asc' }
    });

    return attributes;
  }

  async createAttribute(categoryId: string, data: {
    name: string;
    key: string;
    type: 'SELECT' | 'RANGE' | 'BOOLEAN' | 'TEXT';
    values?: string[];
    unit?: string;
    isFilterable?: boolean;
    isRequired?: boolean;
    position?: number;
  }) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    // Check for duplicate key
    const existing = await prisma.categoryAttribute.findUnique({
      where: {
        categoryId_key: {
          categoryId,
          key: data.key
        }
      }
    });

    if (existing) {
      throw new AppError(400, 'Attribute key already exists for this category');
    }

    const attribute = await prisma.categoryAttribute.create({
      data: {
        name: data.name,
        key: data.key,
        type: data.type,
        values: data.values ?? [],
        unit: data.unit,
        isFilterable: data.isFilterable ?? true,
        isRequired: data.isRequired ?? false,
        position: data.position ?? 0,
        categoryId,
      }
    });

    return attribute;
  }

  async updateAttribute(id: string, data: {
    name?: string;
    key?: string;
    type?: 'SELECT' | 'RANGE' | 'BOOLEAN' | 'TEXT';
    values?: string[];
    unit?: string;
    isFilterable?: boolean;
    isRequired?: boolean;
    position?: number;
  }) {
    const attribute = await prisma.categoryAttribute.findUnique({
      where: { id }
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    const updated = await prisma.categoryAttribute.update({
      where: { id },
      data: {
        name: data.name,
        key: data.key,
        type: data.type,
        values: data.values,
        unit: data.unit,
        isFilterable: data.isFilterable,
        isRequired: data.isRequired,
        position: data.position,
      }
    });

    return updated;
  }

  async deleteAttribute(id: string) {
    const attribute = await prisma.categoryAttribute.findUnique({
      where: { id }
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    await prisma.categoryAttribute.delete({
      where: { id }
    });
  }

  // ==========================================================================
  // CATEGORY FILTER methods (manual "добавить фильтр для категории")
  // ==========================================================================

  // Build a unique machine `name` slug for a filter within its category,
  // honouring the @@unique([categoryId, name]) constraint. Transliterates
  // Cyrillic display names (e.g. "Виробник" → "virobnik").
  private async generateUniqueFilterName(
    categoryId: string,
    displayName: string,
    excludeId?: string
  ): Promise<string> {
    const base =
      (slugifyFn as any)(displayName, { lower: true, strict: true, trim: true }).replace(/-/g, '_') ||
      'filter';

    let name = base;
    let counter = 2;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await prisma.categoryFilter.findUnique({
        where: { categoryId_name: { categoryId, name } }
      });

      if (!existing || existing.id === excludeId) {
        return name;
      }

      name = `${base}_${counter}`;
      counter++;
    }
  }

  async getFilters(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const filters = await prisma.categoryFilter.findMany({
      where: { categoryId },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    return filters;
  }

  async createFilter(categoryId: string, data: {
    name?: string;
    displayName: string;
    type?: string;
    source?: string;
    required?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const name = await this.generateUniqueFilterName(
      categoryId,
      data.name ?? data.displayName
    );

    const filter = await prisma.categoryFilter.create({
      data: {
        categoryId,
        name,
        displayName: data.displayName,
        type: data.type ?? 'select',
        source: data.source ?? 'manual',
        required: data.required ?? false,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return filter;
  }

  async updateFilter(id: string, data: {
    name?: string;
    displayName?: string;
    type?: string;
    source?: string;
    required?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const filter = await prisma.categoryFilter.findUnique({
      where: { id }
    });

    if (!filter) {
      throw new AppError(404, 'Filter not found');
    }

    // Regenerate the unique machine name only when explicitly provided.
    let name = data.name;
    if (name !== undefined) {
      name = await this.generateUniqueFilterName(filter.categoryId, name, id);
    }

    const updated = await prisma.categoryFilter.update({
      where: { id },
      data: {
        name,
        displayName: data.displayName,
        type: data.type,
        source: data.source,
        required: data.required,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return updated;
  }

  async deleteFilter(id: string) {
    const filter = await prisma.categoryFilter.findUnique({
      where: { id }
    });

    if (!filter) {
      throw new AppError(404, 'Filter not found');
    }

    // Options cascade via onDelete: Cascade on CategoryFilterOption.filter
    await prisma.categoryFilter.delete({
      where: { id }
    });
  }

  // Filter option methods

  async createFilterOption(data: {
    filterId: string;
    value: string;
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const filter = await prisma.categoryFilter.findUnique({
      where: { id: data.filterId }
    });

    if (!filter) {
      throw new AppError(404, 'Filter not found');
    }

    const option = await prisma.categoryFilterOption.create({
      data: {
        filterId: data.filterId,
        value: data.value,
        label: data.label,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      }
    });

    return option;
  }

  async deleteFilterOption(id: string) {
    const option = await prisma.categoryFilterOption.findUnique({
      where: { id }
    });

    if (!option) {
      throw new AppError(404, 'Filter option not found');
    }

    await prisma.categoryFilterOption.delete({
      where: { id }
    });
  }

  // Auto-populate a manufacturer-source filter from the distinct
  // Product.manufacturer values within the filter's category. Returns the
  // number of newly-created options (existing values are skipped).
  async autoPopulateFilter(filterId: string): Promise<{ count: number }> {
    const filter = await prisma.categoryFilter.findUnique({
      where: { id: filterId },
      include: { options: true }
    });

    if (!filter) {
      throw new AppError(404, 'Filter not found');
    }

    const isManufacturer =
      filter.source === 'manufacturer' || filter.name === 'manufacturer';

    if (!isManufacturer) {
      throw new AppError(
        400,
        'Auto-populate is only supported for manufacturer-source filters'
      );
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: filter.categoryId,
        manufacturer: { not: null },
      },
      select: { manufacturer: true },
      distinct: ['manufacturer'],
    });

    const values = products
      .map((p) => p.manufacturer)
      .filter((m): m is string => Boolean(m));

    const existingValues = new Set(filter.options.map((o) => o.value));
    let created = 0;

    for (const value of values) {
      if (existingValues.has(value)) {
        continue;
      }

      await prisma.categoryFilterOption.create({
        data: {
          filterId,
          value,
          label: value,
          sortOrder: filter.options.length + created,
        }
      });

      existingValues.add(value);
      created++;
    }

    return { count: created };
  }
}

export const categoryService = new CategoryService();
