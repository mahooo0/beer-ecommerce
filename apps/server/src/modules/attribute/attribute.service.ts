import { prisma } from '@repo/db';
import slugifyFn from 'slugify';
import { AppError } from '../../common/middleware/error-handler.js';

// Machine slug (snake_case) from a possibly-Cyrillic displayName. Transliterates
// RU/UA → Latin via `slugify` (same package category slugs use), then swaps the
// hyphen separator for underscore so the result matches the snake_case machine
// convention (e.g. "Об'єм пляшки" → "obem_plyashki").
function machineName(displayName: string): string {
  const base = (slugifyFn as any)(displayName, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '_',
  });
  return base || 'attribute';
}

// Normalized duplicate guard for attribute values (trim + collapse whitespace +
// case-insensitive). The DB @@unique([attributeId, value]) only blocks
// byte-identical values, so "1кг" vs "1 кг" would slip past it.
function normValue(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

const valueOrder = { orderBy: { sortOrder: 'asc' as const } };

export class AttributeService {
  // ========================================
  // ATTRIBUTE CRUD
  // ========================================

  async getByCategory(categoryId: string) {
    return prisma.attribute.findMany({
      where: { categoryId },
      include: {
        values: valueOrder,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getById(id: string) {
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        values: valueOrder,
      },
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    return attribute;
  }

  async create(data: {
    categoryId: string;
    name?: string;
    displayName: string;
    isFilterable?: boolean;
    isVisibleOnProductPage?: boolean;
    usedForVariations?: boolean;
    showValueIcons?: boolean;
    displayType?: 'checkbox' | 'select' | 'button' | 'color' | 'range';
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(404, 'Category not found');
    }

    const name = data.name?.trim() || machineName(data.displayName);

    // Enforce @@unique([categoryId, name]) with a friendly error.
    const existing = await prisma.attribute.findUnique({
      where: {
        categoryId_name: {
          categoryId: data.categoryId,
          name,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new AppError(409, 'Attribute with this name already exists for this category');
    }

    return prisma.attribute.create({
      data: {
        categoryId: data.categoryId,
        name,
        displayName: data.displayName,
        isFilterable: data.isFilterable ?? true,
        isVisibleOnProductPage: data.isVisibleOnProductPage ?? true,
        usedForVariations: data.usedForVariations ?? false,
        showValueIcons: data.showValueIcons ?? false,
        displayType: data.displayType ?? 'checkbox',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        values: valueOrder,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      isFilterable?: boolean;
      isVisibleOnProductPage?: boolean;
      usedForVariations?: boolean;
      showValueIcons?: boolean;
      displayType?: 'checkbox' | 'select' | 'button' | 'color' | 'range';
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      select: { id: true, categoryId: true, name: true },
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    // If the machine name changes, keep @@unique([categoryId, name]) intact.
    if (data.name && data.name !== attribute.name) {
      const clash = await prisma.attribute.findUnique({
        where: {
          categoryId_name: {
            categoryId: attribute.categoryId,
            name: data.name,
          },
        },
        select: { id: true },
      });

      if (clash && clash.id !== id) {
        throw new AppError(409, 'Attribute with this name already exists for this category');
      }
    }

    return prisma.attribute.update({
      where: { id },
      data: {
        name: data.name,
        displayName: data.displayName,
        isFilterable: data.isFilterable,
        isVisibleOnProductPage: data.isVisibleOnProductPage,
        usedForVariations: data.usedForVariations,
        showValueIcons: data.showValueIcons,
        displayType: data.displayType,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
      include: {
        values: valueOrder,
      },
    });
  }

  async delete(id: string) {
    const attribute = await prisma.attribute.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    // AttributeValue + ProductAttributeValue rows cascade via the schema.
    await prisma.attribute.delete({ where: { id } });
  }

  // Bulk drag-and-drop reorder: persist a new sortOrder for a set of attributes
  // in one transaction (all-or-nothing, so a dropped request can't leave a
  // half-applied order). getByCategory returns rows ordered by sortOrder, so the
  // storefront filter facets pick this up directly.
  async reorder(items: { id: string; sortOrder: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.attribute.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
  }

  // ========================================
  // ATTRIBUTE VALUE CRUD (the "common option / общая опция")
  // ========================================

  async createValue(data: {
    attributeId: string;
    value: string;
    displayValue?: string;
    colorCode?: string;
    iconUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const attribute = await prisma.attribute.findUnique({
      where: { id: data.attributeId },
      select: { id: true },
    });

    if (!attribute) {
      throw new AppError(404, 'Attribute not found');
    }

    // Normalized duplicate guard before insert (see normValue).
    const existing = await prisma.attributeValue.findMany({
      where: { attributeId: data.attributeId },
      select: { value: true },
    });

    if (existing.some((e) => normValue(e.value) === normValue(data.value))) {
      throw new AppError(409, 'Значення вже існує');
    }

    try {
      return await prisma.attributeValue.create({
        data: {
          attributeId: data.attributeId,
          value: data.value,
          displayValue: data.displayValue,
          colorCode: data.colorCode,
          iconUrl: data.iconUrl,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      // Unique-constraint race fallback: another request inserted the same value
      // between our check and this insert.
      if (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new AppError(409, 'Значення вже існує');
      }
      throw error;
    }
  }

  async updateValue(
    id: string,
    data: {
      value?: string;
      displayValue?: string | null;
      colorCode?: string | null;
      iconUrl?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const before = await prisma.attributeValue.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!before) {
      throw new AppError(404, 'Attribute value not found');
    }

    // 4fr cascaded a label rename into already-generated ProductVariant rows and
    // recomputed variationHash. Taranka has no variants, so that whole lane is
    // dropped — a plain update is all that's needed.
    return prisma.attributeValue.update({
      where: { id },
      data: {
        value: data.value,
        displayValue: data.displayValue,
        colorCode: data.colorCode,
        iconUrl: data.iconUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  async deleteValue(id: string) {
    const value = await prisma.attributeValue.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!value) {
      throw new AppError(404, 'Attribute value not found');
    }

    await prisma.attributeValue.delete({ where: { id } });
  }

  // Same bulk reorder, for the values within a single attribute.
  async reorderValues(items: { id: string; sortOrder: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.attributeValue.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
  }

  // ========================================
  // PRODUCT ATTRIBUTE VALUES
  // ========================================

  async getProductValues(productId: string) {
    return prisma.productAttributeValue.findMany({
      where: { productId },
      include: {
        attribute: true,
        attributeValue: true,
      },
    });
  }

  // Bulk set: delete-all-then-createMany inside a single transaction so the
  // product's attribute selection is replaced atomically.
  async setProductValues(
    productId: string,
    values: { attributeId: string; attributeValueId: string }[]
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.productAttributeValue.deleteMany({ where: { productId } });

      if (values.length > 0) {
        await tx.productAttributeValue.createMany({
          data: values.map((v) => ({
            productId,
            attributeId: v.attributeId,
            attributeValueId: v.attributeValueId,
          })),
        });
      }
    });

    return prisma.productAttributeValue.findMany({
      where: { productId },
      include: {
        attribute: true,
        attributeValue: true,
      },
    });
  }
}

export const attributeService = new AttributeService();
