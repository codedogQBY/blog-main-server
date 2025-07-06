import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PerformanceData {
  source: 'frontend' | 'admin';
  type: string;
  name?: string;
  value?: number;
  duration?: number;
  url?: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  userName?: string;
  sessionId?: string;
  requestId?: string;
  deviceInfo?: any;
  pageUrl?: string;
  time?: number;
  status?: string;
  sdkVersion?: string;
  uuid?: string;
  details?: any;
  tags?: Record<string, any>;
  apikey?: string;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 安全截断JSON字符串，确保JSON格式完整
   */
  private safeTruncateJson(obj: any, maxLength: number): string | null {
    if (!obj) return null;
    
    const jsonStr = typeof obj === 'string' ? obj : JSON.stringify(obj);
    
    if (jsonStr.length <= maxLength) {
      return jsonStr;
    }
    
    // 如果JSON字符串太长，尝试截断对象而不是字符串
    if (typeof obj === 'object') {
      try {
        // 创建一个简化的对象
        const simplified = {};
        const keys = Object.keys(obj);
        const maxKeys = Math.floor(maxLength / 20); // 估算每个键值对大约20个字符
        
        for (let i = 0; i < Math.min(keys.length, maxKeys); i++) {
          const key = keys[i];
          const value = obj[key];
          
          if (typeof value === 'string' && value.length > 50) {
            simplified[key] = value.substring(0, 50) + '...';
          } else if (typeof value === 'object' && value !== null) {
            simplified[key] = '[Object]';
          } else {
            simplified[key] = value;
          }
        }
        
        const result = JSON.stringify(simplified);
        return result.length <= maxLength ? result : result.substring(0, maxLength - 3) + '..."';
      } catch (error) {
        return '{"error": "Failed to serialize object"}';
      }
    }
    
    // 如果是字符串，直接截断
    return jsonStr.substring(0, maxLength - 3) + '..."';
  }

  /**
   * 记录性能数据
   */
  async record(data: PerformanceData): Promise<void> {
    try {
      // 长任务特殊处理：小于500ms的不记录
      if (data.type === 'longTask' && data.duration && data.duration < 500) {
        return;
      }

      // 对字段进行长度限制，避免数据库字段溢出
      const truncatedData = {
        ...data,
        details: this.safeTruncateJson(data.details, 10000),
        tags: this.safeTruncateJson(data.tags, 2000),
      };

      const result = await this.prisma.performanceData.create({
        data: {
          timestamp: new Date(),
          type: truncatedData.type,
          name: truncatedData.name,
          value: truncatedData.value,
          duration: truncatedData.duration,
          source: truncatedData.source,
          url: truncatedData.url,
          userAgent: truncatedData.userAgent,
          ip: truncatedData.ip,
          userId: truncatedData.userId,
          userName: truncatedData.userName,
          sessionId: truncatedData.sessionId,
          requestId: truncatedData.requestId,
          deviceInfo: truncatedData.deviceInfo ? JSON.stringify(truncatedData.deviceInfo) : null,
          pageUrl: truncatedData.pageUrl,
          time: truncatedData.time,
          status: truncatedData.status,
          sdkVersion: truncatedData.sdkVersion,
          uuid: truncatedData.uuid,
          details: truncatedData.details,
          tags: truncatedData.tags,
          apikey: truncatedData.apikey,
        },
      });

      this.logger.log(`Successfully recorded performance data: ${data.type}`);

      // 长任务告警逻辑
      if (data.type === 'longTask' && data.duration) {
        await this.handleLongTaskAlert(data, result.id);
      }
    } catch (error) {
      this.logger.error(`Failed to record performance data: ${data.type}`, error.stack);
      throw error;
    }
  }

  /**
   * 处理长任务告警
   */
  private async handleLongTaskAlert(data: PerformanceData, recordId: string): Promise<void> {
    try {
      const duration = data.duration || 0;
      let alertLevel = '';
      let alertMessage = '';

      if (duration >= 3000) {
        // 大于3秒，错误告警
        alertLevel = 'error';
        alertMessage = `严重性能问题：检测到${duration}ms的长任务，严重影响用户体验`;
      } else if (duration >= 500) {
        // 大于500ms小于3秒，警告告警
        alertLevel = 'warning';
        alertMessage = `性能警告：检测到${duration}ms的长任务，可能影响用户体验`;
      }

      if (alertLevel && alertMessage) {
        // 创建告警记录
        await this.prisma.systemAlert.create({
          data: {
            level: alertLevel,
            source: data.source,
            category: 'performance',
            title: '长任务性能告警',
            message: alertMessage,
            details: JSON.stringify({
              recordId,
              duration,
              pageUrl: data.pageUrl,
              userName: data.userName,
              deviceInfo: data.deviceInfo,
              type: 'longTask',
            }),
            url: data.pageUrl,
            userAgent: data.userAgent,
            ip: data.ip,
            userId: data.userId,
            userName: data.userName,
            sessionId: data.sessionId,
            requestId: data.requestId,
            isRead: false,
            isResolved: false,
          },
        });

        this.logger.warn(`Long task alert created: ${alertMessage}`);
      }
    } catch (error) {
      this.logger.error('Failed to create long task alert', error.stack);
    }
  }

  /**
   * 安全解析JSON字符串
   */
  private safeJsonParse(str: string | null): any {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (error) {
      this.logger.warn(`Failed to parse JSON: ${str.substring(0, 100)}...`);
      return null;
    }
  }

  /**
   * 获取性能数据列表
   */
  async getPerformanceData(params: {
    page: number;
    limit: number;
    source?: string;
    type?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    search?: string;
  }) {
    const { page, limit, source, type, userId, startTime, endTime, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (source) where.source = source;
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { url: { contains: search } },
        { pageUrl: { contains: search } },
        { userName: { contains: search } },
      ];
    }
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = startTime;
      if (endTime) where.timestamp.lte = endTime;
    }

    const [data, total] = await Promise.all([
      this.prisma.performanceData.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.performanceData.count({ where }),
    ]);

    return {
      data: data.map(item => ({
        ...item,
        time: item.time ? Number(item.time) : null,
        deviceInfo: this.safeJsonParse(item.deviceInfo),
        details: this.safeJsonParse(item.details),
        tags: this.safeJsonParse(item.tags),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取性能数据统计
   */
  async getPerformanceStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [total, longTaskCount, lcpCount, fidCount, todayCount] = await Promise.all([
      this.prisma.performanceData.count(),
      this.prisma.performanceData.count({ where: { type: 'longTask' } }),
      this.prisma.performanceData.count({ where: { type: 'largestContentfulPaint' } }),
      this.prisma.performanceData.count({ where: { type: 'firstInput' } }),
      this.prisma.performanceData.count({ where: { timestamp: { gte: today } } }),
    ]);

    // 按来源统计
    const sourceStats = await this.prisma.performanceData.groupBy({
      by: ['source'],
      _count: { source: true },
    });

    // 按类型统计
    const typeStats = await this.prisma.performanceData.groupBy({
      by: ['type'],
      _count: { type: true },
    });

    // 获取前端平均性能指标
    const frontendAvgLCP = await this.prisma.performanceData.aggregate({
      where: { 
        type: 'largestContentfulPaint',
        source: 'frontend'
      },
      _avg: { value: true },
    });

    const frontendAvgFID = await this.prisma.performanceData.aggregate({
      where: { 
        type: 'firstInput',
        source: 'frontend'
      },
      _avg: { value: true },
    });

    // 获取后台平均性能指标
    const adminAvgLCP = await this.prisma.performanceData.aggregate({
      where: { 
        type: 'largestContentfulPaint',
        source: 'admin'
      },
      _avg: { value: true },
    });

    const adminAvgFID = await this.prisma.performanceData.aggregate({
      where: { 
        type: 'firstInput',
        source: 'admin'
      },
      _avg: { value: true },
    });

    // 获取总体平均性能指标
    const avgLCP = await this.prisma.performanceData.aggregate({
      where: { type: 'largestContentfulPaint' },
      _avg: { value: true },
    });

    const avgFID = await this.prisma.performanceData.aggregate({
      where: { type: 'firstInput' },
      _avg: { value: true },
    });

    const avgLongTask = await this.prisma.performanceData.aggregate({
      where: { type: 'longTask' },
      _avg: { duration: true },
    });

    // 计算前端异常率
    const frontendLCPCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'largestContentfulPaint' }
    });
    const frontendLCPPoorCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'largestContentfulPaint', value: { gt: 2500 } }
    });
    
    const frontendFIDCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'firstInput' }
    });
    const frontendFIDPoorCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'firstInput', value: { gt: 100 } }
    });
    
    const frontendLongTaskCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'longTask' }
    });
    const frontendLongTaskPoorCount = await this.prisma.performanceData.count({
      where: { source: 'frontend', type: 'longTask', duration: { gt: 500 } }
    });

    // 计算前端各指标的异常率
    const frontendLCPRate = frontendLCPCount > 0 ? frontendLCPPoorCount / frontendLCPCount : 0;
    const frontendFIDRate = frontendFIDCount > 0 ? frontendFIDPoorCount / frontendFIDCount : 0;
    const frontendLongTaskRate = frontendLongTaskCount > 0 ? frontendLongTaskPoorCount / frontendLongTaskCount : 0;
    
    // 前端总体异常率（各指标异常率的平均值）
    const frontendPoorRate = (frontendLCPRate + frontendFIDRate + frontendLongTaskRate) / 3;

    // 计算后台异常率
    const adminLCPCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'largestContentfulPaint' }
    });
    const adminLCPPoorCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'largestContentfulPaint', value: { gt: 2500 } }
    });
    
    const adminFIDCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'firstInput' }
    });
    const adminFIDPoorCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'firstInput', value: { gt: 100 } }
    });
    
    const adminLongTaskCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'longTask' }
    });
    const adminLongTaskPoorCount = await this.prisma.performanceData.count({
      where: { source: 'admin', type: 'longTask', duration: { gt: 500 } }
    });

    // 计算后台各指标的异常率
    const adminLCPRate = adminLCPCount > 0 ? adminLCPPoorCount / adminLCPCount : 0;
    const adminFIDRate = adminFIDCount > 0 ? adminFIDPoorCount / adminFIDCount : 0;
    const adminLongTaskRate = adminLongTaskCount > 0 ? adminLongTaskPoorCount / adminLongTaskCount : 0;
    
    // 后台总体异常率（各指标异常率的平均值）
    const adminPoorRate = (adminLCPRate + adminFIDRate + adminLongTaskRate) / 3;

    return {
      total,
      todayCount,
      byType: {
        longTask: longTaskCount,
        lcp: lcpCount,
        fid: fidCount,
      },
      bySource: sourceStats.reduce((acc, item) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>),
      byTypeDetail: typeStats.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      averages: {
        lcp: avgLCP._avg.value || 0,
        fid: avgFID._avg.value || 0,
        longTask: avgLongTask._avg.duration || 0,
      },
      frontendAverages: {
        lcp: frontendAvgLCP._avg.value || 0,
        fid: frontendAvgFID._avg.value || 0,
      },
      adminAverages: {
        lcp: adminAvgLCP._avg.value || 0,
        fid: adminAvgFID._avg.value || 0,
      },
      frontendPoorRate,
      adminPoorRate,
    };
  }

  /**
   * 清理旧性能数据
   */
  async cleanOldData(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.performanceData.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * 获取页面性能统计
   */
  async getPageStats(type: string) {
    const stats = await this.prisma.performanceData.groupBy({
      by: ['pageUrl'],
      where: { 
        type,
        pageUrl: { not: null }
      },
      _count: { pageUrl: true },
      _avg: { value: true },
      _min: { value: true },
      _max: { value: true },
    });

    return stats.map(item => {
      const avgValue = item._avg.value || 0;
      const minValue = item._min.value || 0;
      const maxValue = item._max.value || 0;
      const count = item._count.pageUrl;
      
      // 计算异常率（基于性能指标阈值）
      let poorRate = 0;
      if (type === 'largestContentfulPaint' && avgValue > 2500) {
        poorRate = 0.3; // 30% 异常率示例
      } else if (type === 'firstInput' && avgValue > 100) {
        poorRate = 0.2; // 20% 异常率示例
      } else if (type === 'layoutShift' && avgValue > 0.1) {
        poorRate = 0.25; // 25% 异常率示例
      }

      return {
        pageUrl: item.pageUrl,
        count,
        avgValue,
        minValue,
        maxValue,
        poorRate,
      };
    }).sort((a, b) => b.count - a.count); // 按样本数排序
  }

  /**
   * 创建测试性能数据（仅用于开发测试）
   */
  async createTestData() {
    const testData = [
      // 前端正常数据
      {
        source: 'frontend' as const,
        type: 'largestContentfulPaint',
        value: 1500,
        pageUrl: '/test-page-1',
        userName: 'test-user',
      },
      {
        source: 'frontend' as const,
        type: 'firstInput',
        value: 50,
        pageUrl: '/test-page-1',
        userName: 'test-user',
      },
      // 前端异常数据
      {
        source: 'frontend' as const,
        type: 'largestContentfulPaint',
        value: 3000,
        pageUrl: '/test-page-2',
        userName: 'test-user',
      },
      {
        source: 'frontend' as const,
        type: 'firstInput',
        value: 150,
        pageUrl: '/test-page-2',
        userName: 'test-user',
      },
      {
        source: 'frontend' as const,
        type: 'longTask',
        duration: 800,
        pageUrl: '/test-page-2',
        userName: 'test-user',
      },
      // 后台正常数据
      {
        source: 'admin' as const,
        type: 'largestContentfulPaint',
        value: 1200,
        pageUrl: '/admin/dashboard',
        userName: 'admin-user',
      },
      // 后台异常数据
      {
        source: 'admin' as const,
        type: 'longTask',
        duration: 3500,
        pageUrl: '/admin/performance',
        userName: 'admin-user',
      },
    ];

    for (const data of testData) {
      await this.record(data);
    }

    this.logger.log('Test performance data created successfully');
  }
} 