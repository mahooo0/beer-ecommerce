import { prisma } from '@repo/db';
import { AppError } from '../../common/middleware/error-handler.js';

interface GetAllOptions {
  page?: number;
  limit?: number;
  type?: string;
}

class TagService {
  async getAll(options: GetAllOptions = {}) {
    const { page = 1, limit = 50, type } = options;
    const skip = (page - 1) * limit;
    const where = type ? { type: type as any } : {};

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.tag.count({ where }),
    ]);

    return {
      data: tags,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: { name: string; type?: string }) {
    const slug = await this.generateUniqueSlug(data.name);

    return prisma.tag.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async update(id: string, data: { name?: string; type?: string }) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(404, 'Tag not found');
    }

    const updateData: any = { ...data };
    if (data.name && data.name !== tag.name) {
      updateData.slug = await this.generateUniqueSlug(data.name);
    }

    return prisma.tag.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const tag = await prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new AppError(404, 'Tag not found');
    }

    await prisma.tag.delete({
      where: { id },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await prisma.tag.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}

export const tagService = new TagService();
