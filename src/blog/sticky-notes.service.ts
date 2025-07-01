import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStickyNoteDto, UpdateStickyNoteDto, GetStickyNotesDto } from './dto/sticky-note.dto';

@Injectable()
export class StickyNotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStickyNoteDto: CreateStickyNoteDto) {
    const { content, author, category, color, status } = createStickyNoteDto;

    // 默认颜色、分类和状态
    const noteColor = color || this.getRandomColor();
    const noteCategory = category || '留言';
    const noteStatus = status || 'public';

    const stickyNote = await this.prisma.stickyNote.create({
      data: {
        content,
        author,
        category: noteCategory,
        color: noteColor,
        status: noteStatus,
      },
    });

    // 返回格式化的数据
    return this.formatStickyNote(stickyNote);
  }

  async findAll(params: GetStickyNotesDto) {
    const { page = '1', limit = '12', category, search } = params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      // 前台只显示公开的留言
      status: 'public'
    };

    // 分类筛选
    if (category && category !== '全部') {
      where.category = category;
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { author: { contains: search } },
      ];
    }

    const [stickyNotes, total] = await Promise.all([
      this.prisma.stickyNote.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          likes: true,
          comments: {
            where: { isDeleted: false },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stickyNote.count({ where }),
    ]);

    // 格式化数据
    const formattedNotes = stickyNotes.map(note => this.formatStickyNote(note));

    return {
      data: formattedNotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    };
  }

  async findOne(id: string) {
    const stickyNote = await this.prisma.stickyNote.findUnique({
      where: { id },
      include: {
        likes: true,
        comments: {
          where: { isDeleted: false },
          include: {
            userInfo: true,
            replies: {
              where: { isDeleted: false },
              include: {
                userInfo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!stickyNote) {
      throw new NotFoundException('留言不存在');
    }

    return this.formatStickyNote(stickyNote);
  }

  async update(id: string, updateStickyNoteDto: UpdateStickyNoteDto) {
    const existingNote = await this.prisma.stickyNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('留言不存在');
    }

    const updatedNote = await this.prisma.stickyNote.update({
      where: { id },
      data: updateStickyNoteDto,
      include: {
        likes: true,
        comments: {
          where: { isDeleted: false },
        },
      },
    });

    return this.formatStickyNote(updatedNote);
  }

  // 管理员获取所有留言（包括私有的）
  async findAllForAdmin(params: GetStickyNotesDto) {
    const { page = '1', limit = '12', category, search } = params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // 分类筛选
    if (category && category !== '全部') {
      where.category = category;
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { author: { contains: search } },
      ];
    }

    const [stickyNotes, total] = await Promise.all([
      this.prisma.stickyNote.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          likes: true,
          comments: {
            where: { isDeleted: false },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stickyNote.count({ where }),
    ]);

    // 格式化数据
    const formattedNotes = stickyNotes.map(note => this.formatStickyNote(note));

    return {
      data: formattedNotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: pageNum * limitNum < total,
      },
    };
  }

  async remove(id: string) {
    const existingNote = await this.prisma.stickyNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('留言不存在');
    }

    // 删除留言及其相关的点赞和评论
    await this.prisma.stickyNote.delete({
      where: { id },
    });

    return { message: '留言删除成功' };
  }

  async getCategories() {
    const categories = await this.prisma.stickyNote.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
    }));

    // 添加"全部"选项
    const total = formattedCategories.reduce((sum, cat) => sum + cat.count, 0);
    return [
      { name: '全部', count: total },
      ...formattedCategories,
    ];
  }

  async getStats() {
    const [totalNotes, totalLikes, totalComments, recentNotes] = await Promise.all([
      this.prisma.stickyNote.count(),
      this.prisma.like.count({ where: { targetType: 'sticky_note' } }),
      this.prisma.interactionComment.count({ 
        where: { targetType: 'sticky_note', isDeleted: false } 
      }),
      this.prisma.stickyNote.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
    ]);

    return {
      totalNotes,
      totalLikes,
      totalComments,
      recentNotes,
    };
  }

  // 管理员统计（包括私有留言）
  async getAdminStats() {
    const [totalNotes, publicNotes, privateNotes, totalLikes, totalComments, recentNotes] = await Promise.all([
      this.prisma.stickyNote.count(),
      this.prisma.stickyNote.count({ where: { status: 'public' } }),
      this.prisma.stickyNote.count({ where: { status: 'private' } }),
      this.prisma.like.count({ where: { targetType: 'sticky_note' } }),
      this.prisma.interactionComment.count({ 
        where: { targetType: 'sticky_note', isDeleted: false } 
      }),
      this.prisma.stickyNote.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
    ]);

    return {
      totalNotes,
      publicNotes,
      privateNotes,
      totalLikes,
      totalComments,
      recentNotes,
    };
  }

  private formatStickyNote(note: any) {
    return {
      id: note.id,
      content: note.content,
      author: note.author,
      category: note.category,
      color: this.mapColorToTheme(note.color),
      status: note.status || 'public',
      date: this.formatDate(note.createdAt),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      likes: note.likes ? note.likes.length : 0,
      comments: note.comments ? note.comments.length : 0,
      isLiked: false, // 这个会在后续通过interactions API设置
    };
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    // 格式化为 MM/dd HH:mm
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}/${day} ${hour}:${minute}`;
  }

  private mapColorToTheme(colorCode: string): string {
    // 如果已经是颜色名称，直接返回
    const validColors = ['pink', 'yellow', 'blue', 'green', 'purple'];
    if (validColors.includes(colorCode)) {
      return colorCode;
    }

    // 将数据库中的十六进制颜色代码映射到前端主题
    const colorMap: { [key: string]: string } = {
      '#f472b6': 'pink',
      '#fbbf24': 'yellow', 
      '#60a5fa': 'blue',
      '#34d399': 'green',
      '#a78bfa': 'purple',
    };

    return colorMap[colorCode] || 'yellow';
  }

  private getRandomColor(): string {
    const colors = ['pink', 'yellow', 'blue', 'green', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
} 