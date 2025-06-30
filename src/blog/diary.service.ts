import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateDiaryNoteDto, 
  UpdateDiaryNoteDto, 
  GetDiaryNotesDto,
  CreateDiarySignatureDto,
  UpdateDiarySignatureDto,
  CreateDiaryWeatherConfigDto,
  UpdateDiaryWeatherConfigDto
} from './dto/diary.dto';

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  // ======= 随记管理 =======
  async createNote(createDiaryNoteDto: CreateDiaryNoteDto) {
    const { title, content, excerpt, images, weather, mood, status } = createDiaryNoteDto;

    // 如果没有提供摘要，自动生成
    const noteExcerpt = excerpt || this.generateExcerpt(content);

    const diaryNote = await this.prisma.diaryNote.create({
      data: {
        title,
        content,
        excerpt: noteExcerpt,
        images: images ? JSON.stringify(images) : null,
        weather: weather || 'sunny',
        mood: mood || 0,
        status: status || 'public',
      },
    });

    return this.formatDiaryNote(diaryNote);
  }

  async findAllNotes(params: GetDiaryNotesDto) {
    const { page = '1', limit = '8', weather, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // 状态筛选 - 前台只显示公开的随记
    if (status) {
      where.status = status;
    } else {
      where.status = 'public';
    }

    // 天气筛选
    if (weather && weather !== '全部') {
      where.weather = weather;
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 排序
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [diaryNotes, total] = await Promise.all([
      this.prisma.diaryNote.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      this.prisma.diaryNote.count({ where }),
    ]);

    // 格式化数据
    const formattedNotes = diaryNotes.map(note => this.formatDiaryNote(note));

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

  // 管理员获取所有随记（包括私有的）
  async findAllNotesForAdmin(params: GetDiaryNotesDto) {
    const { page = '1', limit = '12', weather, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // 状态筛选 - 管理员可以查看所有状态
    if (status && status !== '全部') {
      where.status = status;
    }

    // 天气筛选
    if (weather && weather !== '全部') {
      where.weather = weather;
    }

    // 搜索功能
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 排序
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [diaryNotes, total] = await Promise.all([
      this.prisma.diaryNote.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
      }),
      this.prisma.diaryNote.count({ where }),
    ]);

    // 格式化数据
    const formattedNotes = diaryNotes.map(note => this.formatDiaryNote(note));

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

  async findOneNote(id: string) {
    const diaryNote = await this.prisma.diaryNote.findUnique({
      where: { id },
    });

    if (!diaryNote) {
      throw new NotFoundException('随记不存在');
    }

    return this.formatDiaryNote(diaryNote);
  }

  async updateNote(id: string, updateDiaryNoteDto: UpdateDiaryNoteDto) {
    const existingNote = await this.prisma.diaryNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('随记不存在');
    }

    const { title, content, excerpt, images, weather, mood, status } = updateDiaryNoteDto;

    // 更新数据
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (images !== undefined) updateData.images = images ? JSON.stringify(images) : null;
    if (weather !== undefined) updateData.weather = weather;
    if (mood !== undefined) updateData.mood = mood;
    if (status !== undefined) updateData.status = status;

    const updatedNote = await this.prisma.diaryNote.update({
      where: { id },
      data: updateData,
    });

    return this.formatDiaryNote(updatedNote);
  }

  async removeNote(id: string) {
    const existingNote = await this.prisma.diaryNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      throw new NotFoundException('随记不存在');
    }

    await this.prisma.diaryNote.delete({
      where: { id },
    });

    return { success: true, message: '随记已删除' };
  }

  // ======= 统计信息 =======
  async getStats() {
    const [totalNotes, publicNotes, recentNotes] = await Promise.all([
      this.prisma.diaryNote.count(),
      this.prisma.diaryNote.count({ where: { status: 'public' } }),
      this.prisma.diaryNote.count({
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
      recentNotes,
    };
  }

  // 管理员统计（包括私有随记）
  async getAdminStats() {
    const [totalNotes, publicNotes, privateNotes, recentNotes, weatherStats] = await Promise.all([
      this.prisma.diaryNote.count(),
      this.prisma.diaryNote.count({ where: { status: 'public' } }),
      this.prisma.diaryNote.count({ where: { status: 'private' } }),
      this.prisma.diaryNote.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      }),
      this.getWeatherStats(),
    ]);

    return {
      totalNotes,
      publicNotes,
      privateNotes,
      recentNotes,
      weatherStats,
    };
  }

  private async getWeatherStats() {
    const weatherCounts = await this.prisma.diaryNote.groupBy({
      by: ['weather'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return weatherCounts.map(item => ({
      weather: item.weather,
      count: item._count.id,
    }));
  }

  // ======= 签名管理 =======
  async getSignatures() {
    return this.prisma.diarySignature.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSignature() {
    return this.prisma.diarySignature.findFirst({
      where: { isActive: true },
    });
  }

  async createSignature(createSignatureDto: CreateDiarySignatureDto) {
    const { signatureName, fontFamily, fontSize, color, rotation, isActive } = createSignatureDto;

    // 如果设置为激活状态，先将其他签名设为非激活
    if (isActive) {
      await this.prisma.diarySignature.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.diarySignature.create({
      data: {
        signatureName,
        fontFamily: fontFamily || "'Kalam', cursive",
        fontSize: fontSize || '2xl',
        color: color || 'gray-400',
        rotation: rotation || '12',
        isActive: isActive || false,
      },
    });
  }

  async updateSignature(id: string, updateSignatureDto: UpdateDiarySignatureDto) {
    const existingSignature = await this.prisma.diarySignature.findUnique({
      where: { id },
    });

    if (!existingSignature) {
      throw new NotFoundException('签名不存在');
    }

    // 如果设置为激活状态，先将其他签名设为非激活
    if (updateSignatureDto.isActive) {
      await this.prisma.diarySignature.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false },
      });
    }

    return this.prisma.diarySignature.update({
      where: { id },
      data: updateSignatureDto,
    });
  }

  async removeSignature(id: string) {
    const existingSignature = await this.prisma.diarySignature.findUnique({
      where: { id },
    });

    if (!existingSignature) {
      throw new NotFoundException('签名不存在');
    }

    await this.prisma.diarySignature.delete({
      where: { id },
    });

    return { success: true, message: '签名已删除' };
  }

  // ======= 天气配置管理 =======
  async getWeatherConfigs() {
    return this.prisma.diaryWeatherConfig.findMany({
      where: { isEnabled: true },
      orderBy: { sort: 'asc' },
    });
  }

  async getAllWeatherConfigs() {
    return this.prisma.diaryWeatherConfig.findMany({
      orderBy: { sort: 'asc' },
    });
  }

  async createWeatherConfig(createWeatherDto: CreateDiaryWeatherConfigDto) {
    const { weatherType, weatherName, icon, description, isEnabled, sort } = createWeatherDto;

    // 检查weatherType是否已存在
    const existing = await this.prisma.diaryWeatherConfig.findUnique({
      where: { weatherType },
    });

    if (existing) {
      throw new BadRequestException('该天气类型已存在');
    }

    return this.prisma.diaryWeatherConfig.create({
      data: {
        weatherType,
        weatherName,
        icon: icon || null,
        description: description || null,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        sort: sort || 0,
      },
    });
  }

  async updateWeatherConfig(id: string, updateWeatherDto: UpdateDiaryWeatherConfigDto) {
    const existingConfig = await this.prisma.diaryWeatherConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new NotFoundException('天气配置不存在');
    }

    return this.prisma.diaryWeatherConfig.update({
      where: { id },
      data: updateWeatherDto,
    });
  }

  async removeWeatherConfig(id: string) {
    const existingConfig = await this.prisma.diaryWeatherConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new NotFoundException('天气配置不存在');
    }

    await this.prisma.diaryWeatherConfig.delete({
      where: { id },
    });

    return { success: true, message: '天气配置已删除' };
  }

  // ======= 辅助方法 =======
  private formatDiaryNote(note: any) {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      excerpt: note.excerpt,
      images: note.images ? JSON.parse(note.images) : [],
      weather: note.weather,
      mood: note.mood,
      status: note.status,
      date: this.formatDate(note.createdAt),
      time: this.formatTime(note.createdAt),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }

  private generateExcerpt(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    return date.toISOString().split('T')[1].substring(0, 8);
  }
} 