import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description, slug, parentId, status, sort } = createCategoryDto;
    const finalSlug = slug || this.generateSlug(name);

    // 检查分类名是否已存在
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug: finalSlug }],
      },
    });

    if (existingCategory) {
      throw new ConflictException('分类名称或标识符已存在');
    }

    return this.prisma.category.create({
      data: {
        name,
        description,
        slug: finalSlug,
        parentId,
        status: status || 'enabled',
        sort: sort || 0,
      },
      include: {
        parentCategory: true,
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        include: {
          parentCategory: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories.map(cat => ({
        ...cat,
        articleCount: cat._count.articles,
      })),
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
        parentCategory: true,
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return {
      ...category,
      articleCount: category._count.articles,
    };
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    const { name, description, slug, parentId, status, sort } = updateCategoryDto;

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
      updateData.slug = slug || this.generateSlug(name);
    } else if (slug && slug !== category.slug) {
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (parentId !== undefined) {
      updateData.parentId = parentId || null;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (sort !== undefined) {
      updateData.sort = sort;
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parentCategory: true,
        _count: {
          select: { articles: true },
        },
      },
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

    // 检查是否有子分类
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new ConflictException('该分类下还有子分类，无法删除');
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