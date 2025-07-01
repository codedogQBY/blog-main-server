import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    const { name, slug, description, color, sort } = createTagDto;
    const finalSlug = slug || this.generateSlug(name);

    const tag = await this.prisma.tag.upsert({
      where: { name },
      update: {},
      create: {
        name,
        slug: finalSlug,
        description,
        color,
        sort: sort || 0,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return {
      ...tag,
      articleCount: tag._count.articles,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    color?: string;
  }) {
    const { page, limit, search, color } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (color) {
      where.color = color;
    }

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { articles: true },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      data: tags.map(tag => ({
        ...tag,
        articleCount: tag._count.articles,
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
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return {
      ...tag,
      articleCount: tag._count.articles,
    };
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    const { name, slug, description, color, sort } = updateTagDto;
    const updateData: any = {};

    if (name && name !== tag.name) {
      updateData.name = name;
      updateData.slug = slug || this.generateSlug(name);
    } else if (slug && slug !== tag.slug) {
      updateData.slug = slug;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (sort !== undefined) {
      updateData.sort = sort;
    }

    const updatedTag = await this.prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return {
      ...updatedTag,
      articleCount: updatedTag._count.articles,
    };
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return this.prisma.tag.delete({
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