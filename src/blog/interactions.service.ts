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
        userInfo: {
          connect: { id: userInfoRecord.id }
        },
      };

      // 根据 targetType 设置对应的关联字段
      if (targetType === 'article') {
        likeData.article = { connect: { id: targetId } };
      } else if (targetType === 'sticky_note') {
        likeData.stickyNote = { connect: { id: targetId } };
      } else if (targetType === 'gallery') {
        likeData.gallery = { connect: { id: targetId } };
      } else if (targetType === 'gallery_image') {
        // 对于图片，需要先找到所属的gallery
        const galleryImage = await this.prisma.galleryImage.findUnique({
          where: { id: targetId },
          select: { galleryId: true }
        });
        if (galleryImage) {
          likeData.gallery = { connect: { id: galleryImage.galleryId } };
        }
      }

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
      userInfo: {
        connect: { id: userInfoRecord.id }
      },
      author: userInfo.nickname,
      email: userInfo.email,
    };

    // 设置父评论
    if (parentId) {
      commentData.parent = { connect: { id: parentId } };
    }

    // 根据 targetType 设置对应的关联字段
    if (targetType === 'sticky_note') {
      commentData.stickyNote = { connect: { id: targetId } };
    } else if (targetType === 'gallery') {
      commentData.gallery = { connect: { id: targetId } };
    } else if (targetType === 'gallery_image') {
      // 对于图片，需要先找到所属的gallery
      const galleryImage = await this.prisma.galleryImage.findUnique({
        where: { id: targetId },
        select: { galleryId: true }
      });
      if (galleryImage) {
        commentData.gallery = { connect: { id: galleryImage.galleryId } };
      }
    }

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

  // 管理员接口
  // 获取点赞列表（管理员）
  async getAdminLikes(params: {
    page: number;
    limit: number;
    targetType?: string;
    targetId?: string;
  }) {
    const { page, limit, targetType, targetId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where,
        include: {
          userInfo: {
            select: {
              nickname: true,
              city: true,
              region: true,
              country: true,
              deviceType: true,
              browserName: true,
              ipAddress: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where }),
    ]);

    return {
      likes: likes.map(like => ({
        id: like.id,
        targetType: like.targetType,
        targetId: like.targetId,
        fingerprint: like.fingerprint,
        createdAt: like.createdAt.toISOString(),
        userInfo: like.userInfo ? {
          nickname: like.userInfo.nickname || '匿名用户',
          location: like.userInfo.city ? 
            `${like.userInfo.city}${like.userInfo.region ? ', ' + like.userInfo.region : ''}` : 
            '未知位置',
          country: like.userInfo.country,
          deviceType: like.userInfo.deviceType,
          browser: like.userInfo.browserName,
          ipAddress: like.userInfo.ipAddress,
          joinedAt: like.userInfo.createdAt?.toISOString(),
        } : null,
      })),
      total,
      hasMore: skip + limit < total,
      page,
      limit,
    };
  }

  // 获取评论列表（管理员）
  async getAdminComments(params: {
    page: number;
    limit: number;
    targetType?: string;
    targetId?: string;
    search?: string;
  }) {
    const { page, limit, targetType, targetId, search } = params;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { author: { contains: search } },
      ];
    }

    const [comments, total] = await Promise.all([
      this.prisma.interactionComment.findMany({
        where,
        include: {
          userInfo: {
            select: {
              nickname: true,
              city: true,
              region: true,
              country: true,
              deviceType: true,
              browserName: true,
              ipAddress: true,
              email: true,
              createdAt: true,
            },
          },
          replies: {
            where: { isDeleted: false },
            include: {
              userInfo: {
                select: {
                  nickname: true,
                  city: true,
                  region: true,
                  country: true,
                  deviceType: true,
                  browserName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.interactionComment.count({ where }),
    ]);

    return {
      comments: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        targetType: comment.targetType,
        targetId: comment.targetId,
        author: comment.author,
        email: comment.email,
        fingerprint: comment.fingerprint,
        createdAt: comment.createdAt.toISOString(),
        parentId: comment.parentId,
        isDeleted: comment.isDeleted,
        userInfo: comment.userInfo ? {
          nickname: comment.userInfo.nickname || '匿名用户',
          location: comment.userInfo.city ? 
            `${comment.userInfo.city}${comment.userInfo.region ? ', ' + comment.userInfo.region : ''}` : 
            '未知位置',
          country: comment.userInfo.country,
          deviceType: comment.userInfo.deviceType,
          browser: comment.userInfo.browserName,
          ipAddress: comment.userInfo.ipAddress,
          email: comment.userInfo.email,
          joinedAt: comment.userInfo.createdAt?.toISOString(),
        } : null,
        repliesCount: comment.replies?.length || 0,
      })),
      total,
      hasMore: skip + limit < total,
      page,
      limit,
    };
  }

  // 删除评论（管理员）
  async deleteComment(commentId: string, adminUserId: string) {
    const comment = await this.prisma.interactionComment.findUnique({
      where: { id: commentId },
      include: { userInfo: true },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 软删除评论
    await this.prisma.interactionComment.update({
      where: { id: commentId },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 同时删除所有回复
    await this.prisma.interactionComment.updateMany({
      where: { parentId: commentId },
      data: { 
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 更新用户统计
    if (comment.userInfo) {
      const deletedCount = await this.prisma.interactionComment.count({
        where: { 
          parentId: commentId,
          isDeleted: true,
        },
      });

      await this.prisma.userInfo.update({
        where: { id: comment.userInfo.id },
        data: { totalComments: { decrement: deletedCount + 1 } },
      });
    }

    // 记录管理员操作日志
    await this.prisma.activityLog.create({
      data: {
        action: 'admin_delete_comment',
        targetType: comment.targetType,
        targetId: comment.targetId,
        fingerprint: `admin_${adminUserId}`,
        userInfoId: null,
        ipAddress: null,
        userAgent: 'Admin Panel',
        details: JSON.stringify({ 
          commentId,
          adminUserId,
          timestamp: new Date().toISOString() 
        }),
      },
    });

    return { success: true, message: '评论已删除' };
  }

  // 删除点赞（管理员）
  async deleteLike(likeId: string, adminUserId: string) {
    const like = await this.prisma.like.findUnique({
      where: { id: likeId },
      include: { userInfo: true },
    });

    if (!like) {
      throw new Error('点赞不存在');
    }

    await this.prisma.like.delete({
      where: { id: likeId },
    });

    // 更新用户统计
    if (like.userInfo) {
      await this.prisma.userInfo.update({
        where: { id: like.userInfo.id },
        data: { totalLikes: { decrement: 1 } },
      });
    }

    // 记录管理员操作日志
    await this.prisma.activityLog.create({
      data: {
        action: 'admin_delete_like',
        targetType: like.targetType,
        targetId: like.targetId,
        fingerprint: `admin_${adminUserId}`,
        userInfoId: null,
        ipAddress: null,
        userAgent: 'Admin Panel',
        details: JSON.stringify({ 
          likeId,
          adminUserId,
          timestamp: new Date().toISOString() 
        }),
      },
    });

    return { success: true, message: '点赞已删除' };
  }

  // 获取管理统计信息
  async getAdminStats() {
    const [
      totalLikes,
      totalComments,
      totalUsers,
      todayLikes,
      todayComments,
      topTargets,
      recentActivity,
    ] = await Promise.all([
      // 总点赞数
      this.prisma.like.count(),
      // 总评论数
      this.prisma.interactionComment.count({ where: { isDeleted: false } }),
      // 总用户数
      this.prisma.userInfo.count(),
      // 今日点赞数
      this.prisma.like.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 今日评论数
      this.prisma.interactionComment.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // 热门目标
      this.prisma.like.groupBy({
        by: ['targetType', 'targetId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      // 最近活动
      this.prisma.activityLog.findMany({
        where: {
          action: { in: ['like', 'unlike', 'comment'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          action: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          fingerprint: true,
        },
      }),
    ]);

    return {
      overview: {
        totalLikes,
        totalComments,
        totalUsers,
        todayLikes,
        todayComments,
      },
      topTargets: topTargets.map(target => ({
        targetType: target.targetType,
        targetId: target.targetId,
        likesCount: target._count.id,
      })),
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        targetType: activity.targetType,
        targetId: activity.targetId,
        timestamp: activity.createdAt.toISOString(),
        fingerprint: activity.fingerprint,
      })),
    };
  }
} 