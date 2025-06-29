import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleLikeDto, CreateCommentDto, GetCommentsDto, GetStatsDto, UserInfoDto } from './dto/interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private prisma: PrismaService) {}

  // 处理或创建用户信息
  private async upsertUserInfo(fingerprint: string, userInfo: UserInfoDto) {
    // 提取 schema 中存在的字段
    const userInfoData = {
      userAgent: userInfo.userAgent,
      deviceType: userInfo.deviceType,
      ipAddress: userInfo.ipAddress,
      country: userInfo.country,
      region: userInfo.region,
      city: userInfo.city,
      latitude: userInfo.latitude,
      longitude: userInfo.longitude,
      timezone: userInfo.timezone,
      deviceModel: userInfo.deviceModel,
      osName: userInfo.osName,
      osVersion: userInfo.osVersion,
      browserName: userInfo.browserName,
      browserVersion: userInfo.browserVersion,
      screenWidth: userInfo.screenWidth,
      screenHeight: userInfo.screenHeight,
      language: userInfo.language,
      languages: userInfo.languages,
      nickname: userInfo.nickname,
      email: userInfo.email,
      lastActiveAt: new Date(),
    };

    return await this.prisma.userInfo.upsert({
      where: { fingerprint },
      update: userInfoData,
      create: {
        fingerprint,
        ...userInfoData,
      },
    });
  }

  // 获取用户地理位置信息
  async getUserLocation(ip: string) {
    try {
      // 如果是本地IP，返回默认信息
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return {
          success: true,
          data: {
            country: '中国',
            region: '本地',
            city: '本地',
            latitude: null,
            longitude: null,
            timezone: 'Asia/Shanghai',
          }
        };
      }

      // 使用免费的 IP 地理位置 API
      const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          data: {
            country: data.country || '未知',
            region: data.regionName || '未知',
            city: data.city || '未知',
            latitude: data.lat || null,
            longitude: data.lon || null,
            timezone: data.timezone || null,
          }
        };
      } else {
        throw new Error(data.message || '获取位置信息失败');
      }
    } catch (error) {
      console.error('获取用户位置失败:', error);
      return {
        success: false,
        data: {
          country: '未知',
          region: '未知',
          city: '未知',
          latitude: null,
          longitude: null,
          timezone: null,
        }
      };
    }
  }

  // 切换点赞状态
  async toggleLike(dto: ToggleLikeDto) {
    const { targetType, targetId, fingerprint, userInfo } = dto;

    // 更新用户信息
    const userInfoRecord = await this.upsertUserInfo(fingerprint, userInfo);

    // 检查是否已经点赞
    const existingLike = await this.prisma.like.findUnique({
      where: {
        fingerprint_targetType_targetId: {
          fingerprint,
          targetType,
          targetId,
        },
      },
    });

    let isLiked: boolean;

    if (existingLike) {
      // 取消点赞
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;

      // 更新用户统计
      await this.prisma.userInfo.update({
        where: { id: userInfoRecord.id },
        data: { totalLikes: { decrement: 1 } },
      });
    } else {
      // 添加点赞
      const likeData: any = {
        fingerprint,
        targetType,
        targetId,
        userInfoId: userInfoRecord.id,
      };

      // 不设置外键关联字段，只使用 targetType 和 targetId 来标识目标
      await this.prisma.like.create({ data: likeData });
      isLiked = true;

      // 更新用户统计
      await this.prisma.userInfo.update({
        where: { id: userInfoRecord.id },
        data: { totalLikes: { increment: 1 } },
      });
    }

    // 记录活动日志
    await this.prisma.activityLog.create({
      data: {
        action: isLiked ? 'like' : 'unlike',
        targetType,
        targetId,
        fingerprint,
        userInfoId: userInfoRecord.id,
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        details: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    });

    // 获取总点赞数
    const totalLikes = await this.prisma.like.count({
      where: { targetType, targetId },
    });

    return {
      isLiked,
      totalLikes,
    };
  }

  // 获取点赞状态
  async getLikeStatus(targetType: string, targetId: string, fingerprint: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        fingerprint_targetType_targetId: {
          fingerprint,
          targetType,
          targetId,
        },
      },
    });

    return { isLiked: !!like };
  }

  // 创建评论
  async createComment(dto: CreateCommentDto) {
    const { targetType, targetId, fingerprint, content, parentId, userInfo } = dto;

    // 更新用户信息
    const userInfoRecord = await this.upsertUserInfo(fingerprint, userInfo);

    // 创建评论数据
    const commentData: any = {
      content,
      fingerprint,
      targetType,
      targetId,
      userInfoId: userInfoRecord.id,
      author: userInfo.nickname,
      email: userInfo.email,
    };

    // 设置父评论
    if (parentId) {
      commentData.parentId = parentId;
    }

    // 不设置外键关联字段，只使用 targetType 和 targetId 来标识目标

    const comment = await this.prisma.interactionComment.create({
      data: commentData,
      include: {
        userInfo: true,
        replies: {
          include: {
            userInfo: true,
          },
        },
      },
    });

    // 更新用户统计
    await this.prisma.userInfo.update({
      where: { id: userInfoRecord.id },
      data: { totalComments: { increment: 1 } },
    });

    // 记录活动日志
    await this.prisma.activityLog.create({
      data: {
        action: 'comment',
        targetType,
        targetId,
        fingerprint,
        userInfoId: userInfoRecord.id,
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        details: JSON.stringify({ 
          commentId: comment.id,
          parentId,
          timestamp: new Date().toISOString() 
        }),
      },
    });

    return this.formatComment(comment);
  }

  // 获取评论列表
  async getComments(dto: GetCommentsDto) {
    const { targetType, targetId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.interactionComment.findMany({
        where: {
          targetType,
          targetId,
          parentId: null, // 只获取顶级评论
          isDeleted: false,
        },
        include: {
          userInfo: true,
          replies: {
            where: { isDeleted: false },
            include: {
              userInfo: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.interactionComment.count({
        where: {
          targetType,
          targetId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    const formattedComments = comments.map(comment => this.formatComment(comment));

    return {
      comments: formattedComments,
      total,
      hasMore: skip + limit < total,
      page,
      limit,
    };
  }

  // 获取交互统计
  async getInteractionStats(dto: GetStatsDto) {
    const { targetType, targetId, fingerprint } = dto;

    const [likesCount, commentsCount, userLike] = await Promise.all([
      this.prisma.like.count({
        where: { targetType, targetId },
      }),
      this.getCommentsCount(targetType, targetId),
      this.prisma.like.findUnique({
        where: {
          fingerprint_targetType_targetId: {
            fingerprint,
            targetType,
            targetId,
          },
        },
      }),
    ]);

    return {
      likes: likesCount,
      comments: commentsCount,
      isLiked: !!userLike,
    };
  }

  // 获取评论总数（包括回复）
  private async getCommentsCount(targetType: string, targetId: string): Promise<number> {
    return await this.prisma.interactionComment.count({
      where: {
        targetType,
        targetId,
        isDeleted: false,
      },
    });
  }

  // 格式化评论数据
  private formatComment(comment: any) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      userInfo: {
        nickname: comment.author || comment.userInfo?.nickname || '匿名用户',
        location: comment.userInfo?.city ? 
          `${comment.userInfo.city}${comment.userInfo.region ? ', ' + comment.userInfo.region : ''}` : 
          '未知位置',
        deviceType: comment.userInfo?.deviceType || '未知设备',
        browserInfo: comment.userInfo ? {
          name: comment.userInfo.browserName || '未知浏览器',
          version: comment.userInfo.browserVersion || '',
          os: comment.userInfo.osName || '未知系统',
        } : null,
      },
      replies: comment.replies ? comment.replies.map(reply => this.formatComment(reply)) : [],
    };
  }
} 