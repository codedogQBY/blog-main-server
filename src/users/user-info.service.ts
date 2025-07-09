import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserInfoDto } from '../blog/dto/interaction.dto';

export interface UserInfoFilters {
  search?: string;
  country?: string;
  deviceType?: string;
  browserName?: string;
}

export interface UserInfoStats {
  totalUsers: number;
  activeUsers: number;
  countries: Array<{ country: string; count: number }>;
  devices: Array<{ deviceType: string; count: number }>;
  browsers: Array<{ browserName: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ deviceType: string; count: number }>;
  topBrowsers: Array<{ browserName: string; count: number }>;
}

@Injectable()
export class UserInfoService {
  constructor(private prisma: PrismaService) {}

  async track(fingerprint: string, userInfo: UserInfoDto) {
    // 只更新活跃时间和IP，其他字段只在首次创建时写入
    return this.prisma.userInfo.upsert({
      where: { fingerprint },
      update: {
        ipAddress: userInfo.ipAddress,
        lastActiveAt: new Date(),
      },
      create: {
        fingerprint,
        ...userInfo,
        lastActiveAt: new Date(),
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: UserInfoFilters,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // 搜索条件
    if (search) {
      where.OR = [
        { nickname: { contains: search } },
        { email: { contains: search } },
        { fingerprint: { contains: search } },
        { ipAddress: { contains: search } },
        { country: { contains: search } },
        { city: { contains: search } },
      ];
    }

    // 过滤条件
    if (filters?.country) {
      where.country = filters.country;
    }
    if (filters?.deviceType) {
      where.deviceType = filters.deviceType;
    }
    if (filters?.browserName) {
      where.browserName = filters.browserName;
    }

    const [userInfos, total] = await Promise.all([
      this.prisma.userInfo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastActiveAt: 'desc' },
        include: {
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.userInfo.count({ where }),
    ]);

    return {
      data: userInfos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.userInfo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
  }

  async update(id: string, data: {
    nickname?: string;
    email?: string;
    country?: string;
    region?: string;
    city?: string;
  }) {
    return this.prisma.userInfo.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.userInfo.delete({
      where: { id },
    });
  }

  async batchDelete(ids: string[]) {
    return this.prisma.userInfo.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async getStats(): Promise<UserInfoStats> {
    const [
      totalUsers,
      activeUsers,
      countries,
      devices,
      browsers,
      topCountries,
      topDevices,
      topBrowsers,
    ] = await Promise.all([
      // 总用户数
      this.prisma.userInfo.count(),
      
      // 活跃用户数（最近7天有活动的）
      this.prisma.userInfo.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // 国家分布
      this.prisma.userInfo.groupBy({
        by: ['country'],
        _count: { country: true },
        where: { country: { not: null } },
      }),
      
      // 设备类型分布
      this.prisma.userInfo.groupBy({
        by: ['deviceType'],
        _count: { deviceType: true },
        where: { deviceType: { not: null } },
      }),
      
      // 浏览器分布
      this.prisma.userInfo.groupBy({
        by: ['browserName'],
        _count: { browserName: true },
        where: { browserName: { not: null } },
      }),
      
      // 热门国家（前10）
      this.prisma.userInfo.groupBy({
        by: ['country'],
        _count: { country: true },
        where: { country: { not: null } },
        orderBy: { _count: { country: 'desc' } },
        take: 10,
      }),
      
      // 热门设备（前10）
      this.prisma.userInfo.groupBy({
        by: ['deviceType'],
        _count: { deviceType: true },
        where: { deviceType: { not: null } },
        orderBy: { _count: { deviceType: 'desc' } },
        take: 10,
      }),
      
      // 热门浏览器（前10）
      this.prisma.userInfo.groupBy({
        by: ['browserName'],
        _count: { browserName: true },
        where: { browserName: { not: null } },
        orderBy: { _count: { browserName: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      countries: countries.map(c => ({ country: c.country || 'Unknown', count: c._count.country })),
      devices: devices.map(d => ({ deviceType: d.deviceType || 'Unknown', count: d._count.deviceType })),
      browsers: browsers.map(b => ({ browserName: b.browserName || 'Unknown', count: b._count.browserName })),
      topCountries: topCountries.map(c => ({ country: c.country || 'Unknown', count: c._count.country })),
      topDevices: topDevices.map(d => ({ deviceType: d.deviceType || 'Unknown', count: d._count.deviceType })),
      topBrowsers: topBrowsers.map(b => ({ browserName: b.browserName || 'Unknown', count: b._count.browserName })),
    };
  }

  async exportCsv(filters?: UserInfoFilters) {
    const where: any = {};

    // 搜索条件
    if (filters?.search) {
      where.OR = [
        { nickname: { contains: filters.search } },
        { email: { contains: filters.search } },
        { fingerprint: { contains: filters.search } },
        { ipAddress: { contains: filters.search } },
        { country: { contains: filters.search } },
        { city: { contains: filters.search } },
      ];
    }

    // 过滤条件
    if (filters?.country) {
      where.country = filters.country;
    }
    if (filters?.deviceType) {
      where.deviceType = filters.deviceType;
    }
    if (filters?.browserName) {
      where.browserName = filters.browserName;
    }

    const userInfos = await this.prisma.userInfo.findMany({
      where,
      orderBy: { lastActiveAt: 'desc' },
    });

    // 生成CSV内容
    const headers = [
      'ID',
      '指纹ID',
      'IP地址',
      '昵称',
      '邮箱',
      '国家',
      '地区',
      '城市',
      '设备类型',
      '操作系统',
      '浏览器',
      '屏幕分辨率',
      '语言',
      '点赞数',
      '评论数',
      '最后活跃时间',
      '创建时间',
    ];

    const rows = userInfos.map(user => [
      user.id,
      user.fingerprint,
      user.ipAddress || '',
      user.nickname || '',
      user.email || '',
      user.country || '',
      user.region || '',
      user.city || '',
      user.deviceType || '',
      `${user.osName || ''} ${user.osVersion || ''}`.trim(),
      `${user.browserName || ''} ${user.browserVersion || ''}`.trim(),
      `${user.screenWidth || ''}x${user.screenHeight || ''}`,
      user.language || '',
      user.totalLikes,
      user.totalComments,
      user.lastActiveAt.toISOString(),
      user.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      filename: `user-info-${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      contentType: 'text/csv',
    };
  }
} 