import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

interface GetAllOptions {
  page?: number;
  limit?: number;
}

class BrandService {
  async getAll(options: GetAllOptions = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.count(),
    ]);

    return {
      data: brands,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new AppError(404, 'Brand not found');
    }

    return brand;
  }

  async getBySlug(slug: string) {
    const brand = await prisma.brand.findUnique({
      where: { slug },
    });

    if (!brand) {
      throw new AppError(404, 'Brand not found');
    }

    return brand;
  }

  async create(data: {
    name: string;
    description?: string;
    logo?: string;
    website?: string;
  }) {
    const slug = await this.generateUniqueSlug(data.name);

    return prisma.brand.create({
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
      logo?: string;
      website?: string;
      slug?: string;
    }
  ) {
    // Check if brand exists
    await this.getById(id);

    // If name changed but slug not provided, regenerate slug
    let slug = data.slug;
    if (data.name && !slug) {
      slug = await this.generateUniqueSlug(data.name, id);
    }

    return prisma.brand.update({
      where: { id },
      data: {
        ...data,
        slug,
      },
    });
  }

  async delete(id: string) {
    // Check if brand exists
    await this.getById(id);

    await prisma.brand.delete({
      where: { id },
    });
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.brand.findUnique({
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

export const brandService = new BrandService();
