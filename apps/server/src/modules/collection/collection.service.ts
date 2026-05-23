import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

interface GetAllOptions {
  page?: number;
  limit?: number;
}

class CollectionService {
  async getAll(options: GetAllOptions = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.collection.count(),
    ]);

    return {
      data: collections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!collection) {
      throw new AppError(404, 'Collection not found');
    }

    return collection;
  }

  async getBySlug(slug: string) {
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!collection) {
      throw new AppError(404, 'Collection not found');
    }

    return collection;
  }

  async create(data: {
    name: string;
    description?: string;
    image?: string;
    isActive?: boolean;
  }) {
    const slug = await this.generateUniqueSlug(data.name);

    return prisma.collection.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      isActive?: boolean;
      slug?: string;
    }
  ) {
    // Check if collection exists
    await this.getById(id);

    // If name changed but slug not provided, regenerate slug
    let slug = data.slug;
    if (data.name && !slug) {
      slug = await this.generateUniqueSlug(data.name, id);
    }

    return prisma.collection.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
    });
  }

  async delete(id: string) {
    // Check if collection exists
    await this.getById(id);

    await prisma.collection.delete({
      where: { id },
    });
  }

  async addProduct(collectionId: string, productId: string, position: number = 0) {
    // Check if collection exists
    await this.getById(collectionId);

    try {
      await prisma.productCollection.create({
        data: {
          collectionId,
          productId,
          position,
        },
      });
    } catch (error: any) {
      // Handle unique constraint error
      if (error.code === 'P2002') {
        throw new AppError(400, 'Product already in collection');
      }
      throw error;
    }
  }

  async removeProduct(collectionId: string, productId: string) {
    const productCollection = await prisma.productCollection.findFirst({
      where: {
        collectionId,
        productId,
      },
    });

    if (!productCollection) {
      throw new AppError(404, 'Product not found in collection');
    }

    await prisma.productCollection.delete({
      where: { id: productCollection.id },
    });
  }

  async reorderProducts(collectionId: string, orderedProductIds: string[]) {
    // Check if collection exists
    await this.getById(collectionId);

    // Update position for each product
    await Promise.all(
      orderedProductIds.map((productId, index) =>
        prisma.productCollection.updateMany({
          where: {
            collectionId,
            productId,
          },
          data: {
            position: index,
          },
        })
      )
    );
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.collection.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}

export const collectionService = new CollectionService();
