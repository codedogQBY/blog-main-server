import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGalleryDto,
  UpdateGalleryDto,
  GetGalleriesDto,
  BatchGalleryOperationDto,
  CreateGalleryFromFilesDto,
} from './dto/gallery.dto';

interface TrendData {
  date: string;
  count: number;
}

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  // 创建图集
  async create(createGalleryDto: CreateGalleryDto) {
    const { images, tags, ...galleryData } = createGalleryDto;
    
    return this.prisma.gallery.create({
      data: {
        ...galleryData,
        tags: tags ? JSON.stringify(tags) : null,
        images: {
          create: images.map((image, index) => ({
            ...image,
            sort: image.sort ?? index,
          })),
        },
      },
      include: {
        images: {
          orderBy: { sort: 'asc' },
        },
        _count: {
          select: {
            images: true,
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  // 获取图集列表（前台）
  async findAll(query: GetGalleriesDto) {
    const { page = 1, limit = 12, category, search, tag, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    
    const where: any = {
      status: 'published', // 前台只显示已发布的
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    const [items, total] = await Promise.all([
      this.prisma.gallery.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            orderBy: { sort: 'asc' },
            // 返回所有图片以支持轮播功能
          },
          _count: {
            select: {
              images: true,
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.gallery.count({ where }),
    ]);

    // 处理返回数据
    const processedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      coverImage: item.coverImage || (item.images[0]?.imageUrl || null),
      stats: {
        likes: item._count.likes,
        comments: item._count.comments,
        imageCount: item._count.images,
      },
    }));

    return {
      items: processedItems,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  // 获取图集列表（管理员）
  async findAllForAdmin(query: GetGalleriesDto) {
    const { page = 1, limit = 20, category, search, tag, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { contains: tag };
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.gallery.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            orderBy: { sort: 'asc' },
          },
          _count: {
            select: {
              images: true,
              likes: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.gallery.count({ where }),
    ]);

    // 处理返回数据
    const processedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
      coverImage: item.coverImage || (item.images[0]?.imageUrl || null),
      stats: {
        likes: item._count.likes,
        comments: item._count.comments,
        imageCount: item._count.images,
      },
    }));

    return {
      items: processedItems,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  // 获取单个图集详情
  async findOne(id: string) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sort: 'asc' },
        },
        _count: {
          select: {
            images: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!gallery) {
      throw new Error('图集不存在');
    }

    return {
      ...gallery,
      tags: gallery.tags ? JSON.parse(gallery.tags) : [],
      stats: {
        likes: gallery._count.likes,
        comments: gallery._count.comments,
        imageCount: gallery._count.images,
      },
    };
  }

  // 更新图集
  async update(id: string, updateGalleryDto: UpdateGalleryDto) {
    const { images, tags, ...galleryData } = updateGalleryDto;
    
    // 检查图集是否存在
    const existingGallery = await this.prisma.gallery.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingGallery) {
      throw new Error('图集不存在');
    }

    // 开启事务更新
    return this.prisma.$transaction(async (tx) => {
      // 更新图集基本信息
      const updatedGallery = await tx.gallery.update({
        where: { id },
        data: {
          ...galleryData,
          tags: tags ? JSON.stringify(tags) : undefined,
        },
      });

      // 如果提供了images，更新图片
      if (images) {
        // 删除所有现有图片
        await tx.galleryImage.deleteMany({
          where: { galleryId: id },
        });

        // 创建新图片
        await tx.galleryImage.createMany({
          data: images.map((image, index) => ({
            ...image,
            galleryId: id,
            sort: image.sort ?? index,
          })),
        });
      }

      // 返回完整的图集信息
      return tx.gallery.findUnique({
        where: { id },
        include: {
          images: {
            orderBy: { sort: 'asc' },
          },
          _count: {
            select: {
              images: true,
              likes: true,
              comments: true,
            },
          },
        },
      });
    });
  }

  // 删除图集
  async remove(id: string) {
    const existingGallery = await this.prisma.gallery.findUnique({
      where: { id },
    });

    if (!existingGallery) {
      throw new Error('图集不存在');
    }

    // 级联删除会自动删除相关的图片和交互数据
    return this.prisma.gallery.delete({
      where: { id },
    });
  }

  // 批量操作
  async batchOperation(dto: BatchGalleryOperationDto) {
    const { ids, operation, category, status } = dto;

    switch (operation) {
      case 'delete':
        return this.prisma.gallery.deleteMany({
          where: { id: { in: ids } },
        });

      case 'updateCategory':
        if (!category) {
          throw new Error('批量更新分类时必须提供分类名称');
        }
        return this.prisma.gallery.updateMany({
          where: { id: { in: ids } },
          data: { category },
        });

      case 'updateStatus':
        if (!status) {
          throw new Error('批量更新状态时必须提供状态');
        }
        return this.prisma.gallery.updateMany({
          where: { id: { in: ids } },
          data: { status },
        });

      default:
        throw new Error('不支持的批量操作类型');
    }
  }

  // 从文件创建图集
  async createFromFiles(dto: CreateGalleryFromFilesDto) {
    const { fileIds, tags, ...galleryData } = dto;

    // 获取文件信息
    const files = await this.prisma.file.findMany({
      where: { id: { in: fileIds } },
    });

    if (files.length === 0) {
      throw new Error('未找到指定的文件');
    }

    // 创建图集和图片
    return this.prisma.gallery.create({
      data: {
        ...galleryData,
        tags: tags ? JSON.stringify(tags) : null,
        coverImage: files[0]?.url || null,
        images: {
          create: files.map((file, index) => ({
            title: file.name,
            imageUrl: file.url,
            sort: index,
          })),
        },
      },
      include: {
        images: {
          orderBy: { sort: 'asc' },
        },
        _count: {
          select: {
            images: true,
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  // 获取所有标签
  async getAllTags() {
    const galleries = await this.prisma.gallery.findMany({
      where: { 
        tags: { not: null },
        status: 'published',
      },
      select: { tags: true },
    });

    const allTags = new Set<string>();
    galleries.forEach(gallery => {
      if (gallery.tags) {
        try {
          const tags = JSON.parse(gallery.tags);
          tags.forEach((tag: string) => allTags.add(tag));
        } catch (e) {
          // 忽略解析错误
        }
      }
    });

    return Array.from(allTags).sort();
  }

  async getStats() {
    const [total, published, draft] = await Promise.all([
      this.prisma.gallery.count(),
      this.prisma.gallery.count({ where: { status: 'published' } }),
      this.prisma.gallery.count({ where: { status: 'draft' } }),
    ]);

    return { total, published, draft };
  }

  async getTrend() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const galleries = await this.prisma.gallery.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 按日期分组统计
    const trend: Record<string, number> = galleries.reduce((acc, gallery) => {
      const date = gallery.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 填充没有数据的日期
    const result: TrendData[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.unshift({
        date: dateStr,
        count: trend[dateStr] || 0,
      });
    }

    return result;
  }
} 