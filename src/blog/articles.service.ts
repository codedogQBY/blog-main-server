import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto, authorId: string) {
    const { title, content, excerpt, coverImage, categoryId, tags, ...rest } = createArticleDto;
    
    // 生成唯一的slug
    const slug = rest.slug || this.generateSlug(title);
    await this.ensureUniqueSlug(slug);

    // 创建或获取标签
    const tagData = await this.handleTags(tags || []);

    const article = await this.prisma.article.create({
      data: {
        title,
        content,
        excerpt: excerpt || this.generateExcerpt(content),
        coverImage,
        slug,
        authorId,
        categoryId,
        readTime: rest.readTime || this.calculateReadTime(content),
        published: rest.published || false,
        publishedAt: rest.published ? new Date() : null,
        tags: {
          create: tagData.map(tag => ({
            tag: {
              connectOrCreate: {
                where: { slug: tag.slug },
                create: tag,
              },
            },
          })),
        },
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

    return article;
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    tag?: string;
    published?: boolean;
  }) {
    const { page, limit, search, category, tag, published } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 只有管理员可以看到未发布的文章
    if (published !== undefined) {
      where.published = published;
    } else {
      where.published = true; // 默认只显示已发布的文章
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
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
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: articles,
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
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: { id: true, name: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return article;
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
      // 先创建或获取标签
      const createdTag = await this.prisma.tag.upsert({
        where: { slug: tag.slug },
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
} 