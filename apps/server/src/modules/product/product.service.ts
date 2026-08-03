import { prisma, OrderModel } from '@repo/db';
import { eventBus } from '../../common/events/event-bus.js';
import { AppError } from '../../common/middleware/error-handler.js';
import { generateUniqueSlug } from '../../utils/slug.utils.js';
import type { ProductFormData, ProductUpdateData } from '@repo/types/product-schemas';
import { productSchema } from '@repo/types/product-schemas';
import type { ProductStatus } from '@repo/types';
import Papa from 'papaparse';

/**
 * Ceil a whole-currency price up to the next integer unit. Prices are stored as
 * integer cents but taranka pricing never carries fractions, so we strip float
 * noise (toFixed 2) then ceil. 136.45 → 137, 136.00 → 136. Non-finite → 0.
 * Ported from 4fr `@repo/types` ceilPrice.
 */
function ceilPrice(value: number | string): number {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.ceil(Number(n.toFixed(2)));
}

/**
 * `sku` is @unique + required in the DB, but the taranka admin form no longer
 * surfaces it. Generate a collision-free SKU server-side when the caller omits
 * one. Format: SKU-<base36 timestamp>-<random> uppercased, re-rolled on the
 * astronomically-rare collision.
 */
async function generateUniqueSku(): Promise<string> {
  // Bounded retry loop; the timestamp+random space makes >1 iteration virtually
  // impossible, but we still verify against the unique index.
  for (let i = 0; i < 10; i++) {
    const candidate = `SKU-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`.toUpperCase();
    const existing = await prisma.product.findUnique({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  // Fallback that cannot collide within a process lifetime.
  return `SKU-${Date.now().toString(36)}-${process.hrtime.bigint().toString(36)}`.toUpperCase();
}

interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  brands?: string;
  attributes?: string;
  attributeValues?: string;
  availability?: string;
  isAvailable?: boolean;
  categoryId?: string;
  categoryPath?: string;
  completenessFilter?: 'complete' | 'incomplete';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FacetCounts {
  brands: Array<{ id: string; name: string; count: number }>;
  attributes: Record<string, Array<{ value: string; count: number }>>;
  attributeValues: Array<{ attributeValueId: string; count: number }>;
  availability: Array<{ status: string; count: number }>;
  isAvailable: Array<{ value: boolean; count: number }>;
  priceRange: { min: number; max: number } | null;
}

// ── Completeness bucketing ───────────────────────────────────────────────
// Six product-level fields drive the admin "Заповнення" column and the
// /products/completeness-stats endpoint. Kept in one place so the stats
// endpoint and the in-memory completenessFilter agree exactly.
const COMPLETENESS_FIELDS = 6;

interface CompletenessRow {
  name: string | null;
  categoryId: string | null;
  description: string | null;
  images: unknown;
  searchKeywords: string[] | null;
  manufacturer: string | null;
}

function htmlIsEmpty(html: string | null): boolean {
  if (!html) return true;
  return !html.replace(/<[^>]*>/g, '').trim();
}

function countFilledCompletenessFields(p: CompletenessRow): number {
  let filled = 0;
  if (p.name && p.name.trim()) filled++;
  if (typeof p.categoryId === 'string' && p.categoryId.length > 0) filled++;
  if (!htmlIsEmpty(p.description)) filled++;
  if (Array.isArray(p.images) && p.images.length > 0) filled++;
  if (Array.isArray(p.searchKeywords) && p.searchKeywords.length > 0) filled++;
  if (p.manufacturer && p.manufacturer.trim()) filled++;
  return filled;
}

function computeCompletenessPercent(p: CompletenessRow): number {
  return Math.round((countFilledCompletenessFields(p) / COMPLETENESS_FIELDS) * 100);
}

interface GetAllOptions {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  productType?: string;
  search?: string;
  categoryId?: string;
  categoryPath?: string;
  sortBy?: 'createdAt' | 'name' | 'price' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field?: string; message: string }>;
}

export class ProductService {
  async getAll(options: GetAllOptions = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      productType,
      search,
      categoryId,
      categoryPath,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (productType) where.productType = productType;
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive' as const,
      };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (categoryPath) {
      where.category = {
        path: {
          startsWith: categoryPath,
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: { variants: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            options: {
              include: {
                option: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        digitalMeta: true,
        weightedMeta: true,
        bundleItems: {
          include: {
            product: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        collections: {
          include: {
            collection: true,
          },
        },
        // Normalized attribute selections so the admin edit form can hydrate.
        attributeValues: { include: { attribute: true, attributeValue: true } },
      },
    });

    if (!product) throw new AppError(404, 'Product not found');
    return product;
  }

  async getByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { include: { attributes: true } },
        brand: true,
        tags: { include: { tag: true } },
        variants: {
          select: { id: true, sku: true, price: true, stock: true, isActive: true },
        },
      },
    });
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE' as const,
        isActive: true,
      },
      include: {
        category: { include: { attributes: true } },
        brand: true,
        variants: {
          include: {
            options: {
              include: {
                option: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        digitalMeta: true,
        weightedMeta: true,
        bundleItems: {
          include: {
            product: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        collections: {
          include: {
            collection: true,
          },
        },
        // Normalized attribute selections for the storefront product page specs.
        attributeValues: { include: { attribute: true, attributeValue: true } },
      },
    });

    if (!product) throw new AppError(404, 'Product not found');
    return product;
  }

  async create(data: ProductFormData) {
    // Explicit slug override wins; otherwise derive a unique slug from the name.
    const slug = data.slug && data.slug.trim()
      ? await generateUniqueSlug(data.slug)
      : await generateUniqueSlug(data.name);

    // `sku` is @unique + required but hidden from the admin UI — auto-generate
    // one when the caller omits it.
    const sku = data.sku && data.sku.trim() ? data.sku.trim() : await generateUniqueSku();

    // Flat scalar mapping. No product-type nested creates (taranka has no
    // variants); the DB `productType` column keeps its SIMPLE default.
    const createData: any = {
      name: data.name,
      description: data.description,
      price: ceilPrice(data.price),
      salePrice: data.salePrice == null ? null : ceilPrice(data.salePrice),
      categoryId: data.categoryId,
      brandId: data.brandId,
      status: data.status || 'DRAFT',
      images: data.images || [],
      sku,
      slug,
      baseUnit: data.baseUnit || 'piece',
      manufacturer: data.manufacturer,
      composition: data.composition,
      searchKeywords: data.searchKeywords ?? [],
      attributes: data.attributes || {},
      trackQuantity: data.trackQuantity ?? false,
      quantity: data.quantity ?? 0,
      isAvailable: data.isAvailable ?? true,
      isActive: data.isActive ?? true,
    };

    // Handle tags and collections
    if (data.tagIds && data.tagIds.length > 0) {
      createData.tags = {
        create: data.tagIds.map((tagId) => ({ tagId })),
      };
    }

    if (data.collectionIds && data.collectionIds.length > 0) {
      createData.collections = {
        create: data.collectionIds.map((collectionId) => ({ collectionId })),
      };
    }

    const attributeValues = data.attributeValues ?? [];

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: createData,
        include: {
          category: true,
          brand: true,
          tags: true,
          collections: true,
        },
      });

      // Normalized attribute selections — junction createMany.
      if (attributeValues.length > 0) {
        await tx.productAttributeValue.createMany({
          data: attributeValues.map((av) => ({
            productId: created.id,
            attributeId: av.attributeId,
            attributeValueId: av.attributeValueId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: {
          category: true,
          brand: true,
          tags: true,
          collections: true,
          attributeValues: { include: { attribute: true, attributeValue: true } },
        },
      });
    });

    eventBus.emit('product.created', { productId: product!.id });
    return product;
  }

  async update(id: string, data: ProductUpdateData) {
    const oldProduct = await prisma.product.findUnique({
      where: { id },
      select: { categoryId: true, slug: true },
    });
    if (!oldProduct) throw new AppError(404, 'Product not found');

    // Slug policy: an explicit `slug` override wins; otherwise regenerate from
    // the name only when the name actually changed.
    let slug: string | undefined;
    if (data.slug !== undefined && data.slug.trim()) {
      slug = await generateUniqueSlug(data.slug, id);
    } else if (data.name) {
      slug = await generateUniqueSlug(data.name, id);
    }

    // Flat scalar mapping — only write keys the caller actually sent.
    const updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: ceilPrice(data.price) }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.brandId !== undefined && { brandId: data.brandId }),
      ...(data.status && { status: data.status }),
      ...(data.images && { images: data.images }),
      ...(data.sku !== undefined && data.sku.trim() && { sku: data.sku.trim() }),
      ...(data.baseUnit !== undefined && { baseUnit: data.baseUnit }),
      ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
      ...(data.composition !== undefined && { composition: data.composition }),
      ...(data.searchKeywords !== undefined && { searchKeywords: data.searchKeywords }),
      ...(data.attributes !== undefined && { attributes: data.attributes }),
      ...(data.trackQuantity !== undefined && { trackQuantity: data.trackQuantity }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(slug && { slug }),
    };
    // salePrice is nullable — a `null` clears it, a number is ceil'd.
    if (data.salePrice !== undefined) {
      updateData.salePrice = data.salePrice == null ? null : ceilPrice(data.salePrice);
    }

    const categoryChanged =
      data.categoryId !== undefined && data.categoryId !== oldProduct.categoryId;

    // Handle tags and collections
    if (data.tagIds) {
      await prisma.productTag.deleteMany({ where: { productId: id } });
      if (data.tagIds.length > 0) {
        updateData.tags = {
          create: data.tagIds.map((tagId) => ({ tagId })),
        };
      }
    }

    if (data.collectionIds) {
      await prisma.productCollection.deleteMany({ where: { productId: id } });
      if (data.collectionIds.length > 0) {
        updateData.collections = {
          create: data.collectionIds.map((collectionId) => ({ collectionId })),
        };
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      // On a category change the old category's attribute selections no longer
      // apply — wipe them.
      if (categoryChanged) {
        await tx.productAttributeValue.deleteMany({ where: { productId: id } });
      }

      // Explicit attributeValues array → delete-all-then-recreate. When the
      // category changed we already cleared them above, so this only re-seeds
      // whatever the caller sent (may be empty).
      if (data.attributeValues !== undefined) {
        if (!categoryChanged) {
          await tx.productAttributeValue.deleteMany({ where: { productId: id } });
        }
        if (data.attributeValues.length > 0) {
          await tx.productAttributeValue.createMany({
            data: data.attributeValues.map((av) => ({
              productId: id,
              attributeId: av.attributeId,
              attributeValueId: av.attributeValueId,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.product.update({ where: { id }, data: updateData });

      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          brand: true,
          tags: true,
          collections: true,
          attributeValues: { include: { attribute: true, attributeValue: true } },
        },
      });
    });

    eventBus.emit('product.updated', { productId: product!.id });
    return product;
  }

  async updateStatus(id: string, status: ProductStatus) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        status,
        isActive: status === 'ARCHIVED' ? false : true,
      },
      include: {
        category: true,
        brand: true,
        variants: true,
        digitalMeta: true,
        weightedMeta: true,
        bundleItems: true,
      },
    });

    eventBus.emit('product.updated', { productId: product.id });
    return product;
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus) {
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        isActive: status === 'ACTIVE',
      },
    });

    // Emit events for each product
    ids.forEach((id) => {
      eventBus.emit('product.updated', { productId: id });
    });

    return result;
  }

  async bulkDelete(ids: string[]) {
    const result = await prisma.product.deleteMany({
      where: { id: { in: ids } },
    });

    // Emit events for each product
    ids.forEach((id) => {
      eventBus.emit('product.deleted', { productId: id });
    });

    return result;
  }

  async delete(id: string) {
    await prisma.product.delete({ where: { id } });
    eventBus.emit('product.deleted', { productId: id });
  }

  /** Build the shared Prisma WHERE from the filter params (no pagination). */
  private buildFilterWhere(filters: FilterOptions): any {
    const {
      minPrice,
      maxPrice,
      brands,
      attributes,
      attributeValues,
      availability,
      isAvailable,
      categoryId,
      categoryPath,
    } = filters;

    const where: any = { status: 'ACTIVE' };
    const andClauses: any[] = [];

    // Direct category id filter.
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Category path filter (startsWith for materialized path)
    if (categoryPath) {
      where.category = { path: { startsWith: categoryPath } };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Brand filter (OR logic - brandId in [...brandIds])
    if (brands) {
      const brandIds = brands.split(',').map((b) => b.trim()).filter(Boolean);
      if (brandIds.length > 0) {
        where.brandId = { in: brandIds };
      }
    }

    // Manual in/out-of-stock flag filter (independent of quantity).
    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    // Legacy JSONB attribute filter: OR within same key, AND across keys.
    if (attributes) {
      const pairs = attributes.split(',').map((p) => p.trim()).filter(Boolean);
      const grouped: Record<string, string[]> = {};
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) continue;
        const key = pair.slice(0, colonIdx).trim();
        const value = pair.slice(colonIdx + 1).trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(value);
      }
      for (const [key, values] of Object.entries(grouped)) {
        andClauses.push({
          OR: values.map((value) => ({
            attributes: { path: [key], equals: value },
          })),
        });
      }
    }

    // Normalized attribute-value junction filter: any product carrying at least
    // one of the requested AttributeValue ids.
    if (attributeValues) {
      const valueIds = attributeValues.split(',').map((v) => v.trim()).filter(Boolean);
      if (valueIds.length > 0) {
        andClauses.push({
          attributeValues: { some: { attributeValueId: { in: valueIds } } },
        });
      }
    }

    // Availability filter (variant-stock based; legacy).
    if (availability) {
      const statuses = availability.split(',').map((s) => s.trim()).filter(Boolean);
      const orClauses: any[] = [];
      if (statuses.includes('in_stock')) {
        orClauses.push({ variants: { some: { stock: { gt: 0 } } } });
      }
      if (statuses.includes('out_of_stock')) {
        orClauses.push({ variants: { every: { stock: { equals: 0 } } }, allowPreorder: false });
      }
      if (statuses.includes('pre_order')) {
        orClauses.push({
          AND: [
            { allowPreorder: true },
            { variants: { every: { stock: { equals: 0 } } } },
          ],
        });
      }
      if (orClauses.length > 0) {
        where.OR = orClauses;
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    return where;
  }

  async filterProducts(filters: FilterOptions) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      completenessFilter,
    } = filters;

    const where = this.buildFilterWhere(filters);
    const include = {
      category: true,
      brand: true,
      variants: { select: { stock: true } },
      _count: { select: { variants: true } },
    } as const;

    // completenessFilter is computed in-memory (it depends on 6 product-level
    // fields), so when it's active we fetch the full matching set, bucket, then
    // paginate the filtered result.
    if (completenessFilter) {
      const all = await prisma.product.findMany({
        where,
        include,
        orderBy: { [sortBy]: sortOrder },
      });
      const matching = all.filter((p: any) => {
        const pct = computeCompletenessPercent({
          name: p.name,
          categoryId: p.categoryId,
          description: p.description,
          images: p.images,
          searchKeywords: p.searchKeywords,
          manufacturer: p.manufacturer,
        });
        if (completenessFilter === 'complete') return pct === 100;
        return pct !== 100; // incomplete
      });
      const total = matching.length;
      const skip = (page - 1) * limit;
      const products = matching.slice(skip, skip + limit);
      return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where,
        include,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFacetCounts(categoryPath: string, currentFilters: Omit<FilterOptions, 'categoryPath'>): Promise<FacetCounts> {
    // Build base where clause: active + category path/id
    const baseWhere: any = { status: 'ACTIVE' };
    if (categoryPath) {
      baseWhere.category = { path: { startsWith: categoryPath } };
    }
    if (currentFilters.categoryId) {
      baseWhere.categoryId = currentFilters.categoryId;
    }

    // Brand facets: groupBy brandId (exclude brand filter from where)
    const brandWhereWithoutBrands = { ...baseWhere };
    if (currentFilters.attributes) {
      // Apply attribute filters for brand counting
      const pairs = currentFilters.attributes.split(',').map((p) => p.trim()).filter(Boolean);
      const grouped: Record<string, string[]> = {};
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) continue;
        const key = pair.slice(0, colonIdx).trim();
        const value = pair.slice(colonIdx + 1).trim();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(value);
      }
      const andClauses = Object.entries(grouped).map(([key, values]) => ({
        OR: values.map((value) => ({ attributes: { path: [key], equals: value } })),
      }));
      if (andClauses.length > 0) {
        brandWhereWithoutBrands.AND = andClauses;
      }
    }

    // Get brand counts via groupBy
    const brandGroups = await (prisma.product as any).groupBy({
      by: ['brandId'],
      where: { ...brandWhereWithoutBrands, brandId: { not: null } },
      _count: { id: true },
    });

    // Look up brand names
    const brandIds = brandGroups.map((g: any) => g.brandId).filter(Boolean);
    const brands = brandIds.length > 0
      ? await prisma.brand.findMany({ where: { id: { in: brandIds } } })
      : [];

    const brandMap = new Map(brands.map((b: any) => [b.id, b.name]));
    const brandFacets = brandGroups
      .filter((g: any) => g.brandId)
      .map((g: any) => ({
        id: g.brandId as string,
        name: brandMap.get(g.brandId) as string || g.brandId,
        count: g._count.id,
      }));

    // Attribute facets: fetch products and aggregate in application code
    const attrWhere = { ...baseWhere };
    const productsForAttr = await prisma.product.findMany({
      where: attrWhere,
      select: { attributes: true },
    });

    const attributeCounts: Record<string, Record<string, number>> = {};
    for (const product of productsForAttr) {
      if (product.attributes && typeof product.attributes === 'object') {
        for (const [key, value] of Object.entries(product.attributes as Record<string, any>)) {
          if (value === null || value === undefined) continue;
          if (!attributeCounts[key]) attributeCounts[key] = {};
          const strVal = String(value);
          attributeCounts[key][strVal] = (attributeCounts[key][strVal] || 0) + 1;
        }
      }
    }

    const attributeFacets: Record<string, Array<{ value: string; count: number }>> = {};
    for (const [key, values] of Object.entries(attributeCounts)) {
      attributeFacets[key] = Object.entries(values)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    }

    // Normalized attribute-value facets: how many products carry each
    // AttributeValue, via the ProductAttributeValue junction. groupBy over the
    // junction, scoped to the same base product set.
    const attrValueGroups = await prisma.productAttributeValue.groupBy({
      by: ['attributeValueId'],
      where: { product: baseWhere },
      _count: { productId: true },
    });
    const attributeValueFacets = attrValueGroups
      .map((g: any) => ({
        attributeValueId: g.attributeValueId as string,
        count: g._count.productId as number,
      }))
      .sort((a, b) => b.count - a.count);

    // Availability counts
    const [inStockCount, outOfStockCount, preOrderCount] = await Promise.all([
      prisma.product.count({ where: { ...baseWhere, variants: { some: { stock: { gt: 0 } } } } }),
      prisma.product.count({ where: { ...baseWhere, variants: { every: { stock: { equals: 0 } } }, allowPreorder: false } }),
      prisma.product.count({ where: { ...baseWhere, variants: { every: { stock: { equals: 0 } } }, allowPreorder: true } }),
    ]);

    const availabilityFacets = [
      { status: 'in_stock', count: inStockCount },
      { status: 'out_of_stock', count: outOfStockCount },
      { status: 'pre_order', count: preOrderCount },
    ];

    // Manual in/out-of-stock flag counts (the taranka dual-mode isAvailable).
    const [availTrue, availFalse] = await Promise.all([
      prisma.product.count({ where: { ...baseWhere, isAvailable: true } }),
      prisma.product.count({ where: { ...baseWhere, isAvailable: false } }),
    ]);
    const isAvailableFacets = [
      { value: true, count: availTrue },
      { value: false, count: availFalse },
    ];

    // Dynamic price range
    const priceAgg = await prisma.product.aggregate({
      where: baseWhere,
      _min: { price: true },
      _max: { price: true },
    });
    const priceRange = priceAgg._min.price !== null && priceAgg._max.price !== null
      ? { min: priceAgg._min.price, max: priceAgg._max.price }
      : null;

    return {
      brands: brandFacets,
      attributes: attributeFacets,
      attributeValues: attributeValueFacets,
      availability: availabilityFacets,
      isAvailable: isAvailableFacets,
      priceRange,
    };
  }

  /**
   * Completeness analytics for the admin /products page. Buckets every matching
   * product by the same six product-level fields the catalog "Заповнення"
   * column uses (name / category / description / images / searchKeywords /
   * manufacturer). Accepts the same filter params as the list so the numbers
   * agree with the visible table.
   */
  async getCompletenessStats(filters: FilterOptions = {}) {
    // Reuse the list WHERE builder but ignore completenessFilter itself (stats
    // describe the whole matching set, not one bucket).
    const where = this.buildFilterWhere({ ...filters, completenessFilter: undefined });
    const products = await prisma.product.findMany({
      where,
      select: {
        name: true,
        categoryId: true,
        description: true,
        images: true,
        searchKeywords: true,
        manufacturer: true,
      },
    });

    let complete = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let empty = 0;
    for (const p of products) {
      const pct = computeCompletenessPercent(p as CompletenessRow);
      if (pct === 100) complete++;
      else if (pct >= 60) high++;
      else if (pct >= 30) medium++;
      else if (pct > 0) low++;
      else empty++;
    }

    return {
      total: products.length,
      complete,
      high,
      medium,
      low,
      empty,
      // Anything not 100% — used by the page header subtitle.
      incomplete: products.length - complete,
      fields: COMPLETENESS_FIELDS,
    };
  }

  async importFromCsv(fileBuffer: Buffer): Promise<ImportResult> {
    const csvString = fileBuffer.toString('utf-8');

    // Parse CSV with Papa Parse
    const parseResult = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const rows = parseResult.data as any[];
    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    // Helper to parse price strings ($12.99 -> 1299 cents, or direct integer)
    const parsePrice = (priceStr: string): number => {
      if (!priceStr) return 0;
      const cleaned = priceStr.replace(/[$,]/g, '').trim();
      const num = parseFloat(cleaned);
      // If it has decimal places, assume it's dollars and convert to cents
      if (cleaned.includes('.')) {
        return Math.round(num * 100);
      }
      // Otherwise, assume it's already in cents
      return parseInt(cleaned, 10);
    };

    // Helper to split pipe-separated values
    const splitPipes = (value: string): string[] => {
      if (!value || !value.trim()) return [];
      return value.split('|').map((v) => v.trim()).filter((v) => v);
    };

    // Process each row sequentially
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and arrays are 0-indexed

      try {
        // Flat product only — variant/weighted/digital/bundled types were
        // dropped in taranka, so the CSV importer maps the base catalog fields.
        const images = splitPipes(row.images);
        const price = parsePrice(row.price);
        const salePrice = row.saleprice ? parsePrice(row.saleprice) : undefined;
        const searchKeywords = splitPipes(row.searchkeywords || row.keywords || '');

        const productData: any = {
          name: row.name,
          description: row.description,
          price,
          ...(salePrice ? { salePrice } : {}),
          sku: row.sku || undefined,
          categoryId: row.categoryid,
          brandId: row.brandid || undefined,
          status: row.status?.toUpperCase() || 'DRAFT',
          images,
          baseUnit: row.baseunit || 'piece',
          manufacturer: row.manufacturer || undefined,
          composition: row.composition || undefined,
          searchKeywords,
          attributes: {},
          trackQuantity: row.trackquantity === 'true',
          quantity: row.quantity ? parseInt(row.quantity, 10) : 0,
          isAvailable: row.isavailable !== undefined ? row.isavailable !== 'false' : true,
          isActive: true,
        };

        // Validate with Zod schema
        const validated = productSchema.safeParse(productData);

        if (!validated.success) {
          result.failed++;
          const firstError = validated.error.errors[0];
          result.errors.push({
            row: rowNumber,
            field: firstError?.path.join('.'),
            message: firstError?.message || 'Validation error',
          });
          continue;
        }

        // Create product
        try {
          await this.create(validated.data as ProductFormData);
          result.imported++;
        } catch (dbError: any) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            message: dbError.message || 'Database error while creating product',
          });
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          message: error.message || 'Unexpected error processing row',
        });
      }
    }

    return result;
  }

  async getRelated(productId: string, limit = 5) {
    // Fetch the current product to get categoryId and tag IDs
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        categoryId: true,
        tags: { select: { tagId: true } },
      },
    });

    if (!product) return [];

    const tagIds = product.tags.map((t) => t.tagId);

    const related = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'ACTIVE' as const,
        isActive: true,
        OR: [
          { categoryId: product.categoryId },
          ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ],
      },
      take: limit,
      include: {
        brand: true,
        category: true,
      },
    });

    return related;
  }

  async getFrequentlyBoughtTogether(productId: string, limit = 3) {
    try {
      // MongoDB aggregation to find co-purchased products
      const pipeline = [
        { $match: { 'items.productId': productId } },
        { $unwind: '$items' },
        { $match: { 'items.productId': { $ne: productId } } },
        { $group: { _id: '$items.productId', count: { $sum: 1 } } },
        { $match: { count: { $gte: 2 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ];

      const results = await OrderModel.aggregate(pipeline);
      const ids = results.map((r: { _id: string }) => r._id);

      if (ids.length === 0) return [];

      const products = await prisma.product.findMany({
        where: {
          id: { in: ids },
          status: 'ACTIVE' as const,
          isActive: true,
        },
        include: { brand: true },
      });

      return products;
    } catch {
      return [];
    }
  }
}

export const productService = new ProductService();
