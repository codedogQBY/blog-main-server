import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description } = createCategoryDto;
    const slug = this.generateSlug(name);

    // 检查分类名是否已存在
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (existingCategory) {
      throw new ConflictException('分类名称或标识符已存在');
    }

    return this.prisma.category.create({
      data: {
        name,
        description,
        slug,
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }) {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const { name, description } = updateCategoryDto;

    const updateData: any = {};
    if (name && name !== category.name) {
      // 检查新名称是否已存在
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { name },
          ],
        },
      });

      if (existingCategory) {
        throw new ConflictException('分类名称已存在');
      }

      updateData.name = name;
      updateData.slug = this.generateSlug(name);
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    // 检查分类下是否有文章
    const articlesCount = await this.prisma.article.count({
      where: { categoryId: id },
    });

    if (articlesCount > 0) {
      throw new ConflictException('该分类下还有文章，无法删除');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
      .replace(/\-+/g, '-')
      .trim();
  }
} 