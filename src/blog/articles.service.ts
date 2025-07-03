import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

interface TrendData {
  date: string;
  count: number;
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto, authorId: string) {
    const { title, content, excerpt, coverImage, categoryId, tags, ...rest } = createArticleDto;
    
    // 生成唯一的slug
    const slug = rest.slug || this.generateSlug(title);
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    const article = await this.prisma.article.create({
      data: {
        title,
        content,
        excerpt: excerpt || this.generateExcerpt(content),
        coverImage,
        slug: uniqueSlug,
        authorId,
        categoryId,
        readTime: rest.readTime || this.calculateReadTime(content),
        published: rest.published || false,
        publishedAt: rest.published ? new Date() : null,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    // 处理标签关联
    if (tags && tags.length > 0) {
      await this.updateArticleTags(article.id, tags);
    }

    // 重新获取文章以包含标签信息
    return this.prisma.article.findUnique({
      where: { id: article.id },
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    categoryId?: string;
    tag?: string;
    published?: boolean;
  }) {
    const { page, limit, search, category, categoryId, tag, published } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 前台展示：只有管理员可以看到未发布的文章
    if (published !== undefined) {
      where.published = published;
    } else {
      where.published = true; // 默认只显示已发布的文章
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true },
          },
          category: true,
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { 
              likes: true 
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    // 为每篇文章单独统计评论数量（从interaction_comments表）
    const articlesWithCommentCount = await Promise.all(
      articles.map(async (article) => {
        const commentCount = await this.prisma.interactionComment.count({
          where: {
            targetType: 'article',
            targetId: article.id,
            isDeleted: false,
          },
        });

        return {
          ...article,
          _count: {
            ...article._count,
            comments: commentCount,
          },
        };
      })
    );

    return {
      data: articlesWithCommentCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    categoryId?: string;
    tag?: string;
    published?: boolean;
  }) {
    const { page, limit, search, category, categoryId, tag, published } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 管理后台：只有明确指定published时才过滤，否则显示所有文章
    if (published !== undefined) {
      where.published = published;
    }
    // 注意：管理后台不设置默认的published过滤条件

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true },
          },
          category: true,
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { 
              likes: true 
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    // 为每篇文章单独统计评论数量（从interaction_comments表）
    const articlesWithCommentCount = await Promise.all(
      articles.map(async (article) => {
        const commentCount = await this.prisma.interactionComment.count({
          where: {
            targetType: 'article',
            targetId: article.id,
            isDeleted: false,
          },
        });

        return {
          ...article,
          _count: {
            ...article._count,
            comments: commentCount,
          },
        };
      })
    );

    return {
      data: articlesWithCommentCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 获取文章的评论
    const comments = await this.prisma.interactionComment.findMany({
      where: {
        targetType: 'article',
        targetId: article.id,
        parentId: null,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        author: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        replies: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            content: true,
            author: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...article,
      comments,
    };
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 获取文章的评论
    const comments = await this.prisma.interactionComment.findMany({
      where: {
        targetType: 'article',
        targetId: article.id,
        parentId: null,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        author: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        replies: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            content: true,
            author: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...article,
      comments,
    };
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    const { tags, ...updateData } = updateArticleDto;

    // 处理标签更新
    if (tags) {
      await this.updateArticleTags(id, tags);
    }

    // 处理发布状态
    if (updateData.published !== undefined && updateData.published !== article.published) {
      updateData.publishedAt = updateData.published ? new Date().toISOString() : undefined;
    }

    return this.prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true },
        },
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async remove(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return this.prisma.article.delete({ where: { id } });
  }

  async incrementViews(id: string) {
    return this.prisma.article.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
      .replace(/\-+/g, '-')
      .trim()
      .substring(0, 100); // 限制长度
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.article.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private generateExcerpt(content: string, maxLength: number = 200): string {
    const plainText = content.replace(/<[^>]*>/g, ''); // 移除HTML标签
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200; // 平均阅读速度
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async handleTags(tagNames: string[]) {
    return tagNames.map(name => ({
      name,
      slug: this.generateSlug(name),
    }));
  }

  private async updateArticleTags(articleId: string, tagNames: string[]) {
    // 删除现有的标签关联
    await this.prisma.articleTag.deleteMany({
      where: { articleId },
    });

    // 创建新的标签关联
    const tagData = await this.handleTags(tagNames);
    
    for (const tag of tagData) {
      // 先创建或获取标签 - 使用name作为唯一标识符
      const createdTag = await this.prisma.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: tag,
      });

      // 然后创建文章标签关联
      await this.prisma.articleTag.create({
        data: {
          articleId,
          tagId: createdTag.id,
        },
      });
    }
  }

  async getStats() {
    const [total, published, draft] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { published: true } }),
      this.prisma.article.count({ where: { published: false } }),
    ]);

    return { total, published, draft };
  }

  async getRecent() {
    const articles = await this.prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return articles.map(article => ({
      ...article,
      status: article.published ? 'PUBLISHED' : 'DRAFT',
    }));
  }

  async getTrend() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const articles = await this.prisma.article.findMany({
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
    const trend: Record<string, number> = articles.reduce((acc, article) => {
      const date = article.createdAt.toISOString().split('T')[0];
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