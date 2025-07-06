import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface LogData {
  level: 'error' | 'warn' | 'info' | 'debug';
  source: 'frontend' | 'admin' | 'backend';
  category: 'js_error' | 'api_error' | 'performance' | 'performance_longtask' | 'performance_fid' | 'performance_lcp' | 'performance_fp' | 'performance_fcp' | 'performance_cls' | 'behavior' | 'system';
  message: string;
  details?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  userName?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  memory?: number;
  tags?: Record<string, any>;
  recordScreenId?: string;
  recordScreen?: string;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 记录日志
   */
  async log(logData: LogData): Promise<void> {
    try {
      // 对字段进行长度限制，避免数据库字段溢出
      const truncatedData = {
        ...logData,
        message: logData.message ? logData.message.substring(0, 1000) : logData.message,
        details: logData.details ? 
          (typeof logData.details === 'string' ? 
            logData.details.substring(0, 10000) : 
            JSON.stringify(logData.details).substring(0, 10000)
          ) : logData.details,
        stack: logData.stack ? logData.stack.substring(0, 5000) : logData.stack,
      };

      await this.prisma.systemLog.create({
        data: {
          level: truncatedData.level,
          source: truncatedData.source,
          category: truncatedData.category,
          message: truncatedData.message,
          details: truncatedData.details,
          stack: truncatedData.stack,
          url: truncatedData.url,
          userAgent: truncatedData.userAgent,
          ip: truncatedData.ip,
          userId: truncatedData.userId,
          userName: truncatedData.userName,
          sessionId: truncatedData.sessionId,
          requestId: truncatedData.requestId,
          duration: truncatedData.duration,
          memory: truncatedData.memory,
          tags: truncatedData.tags ? JSON.stringify(truncatedData.tags) : null,
        },
      });

      // 同时输出到控制台
      this.logger.log(`[${truncatedData.source.toUpperCase()}] ${truncatedData.message}`);
    } catch (error) {
      console.error('Failed to save log to database:', error);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 记录错误日志
   */
  async error(data: Omit<LogData, 'level'>): Promise<void> {
    await this.log({ ...data, level: 'error' });
  }

  /**
   * 记录警告日志
   */
  async warn(data: Omit<LogData, 'level'>): Promise<void> {
    await this.log({ ...data, level: 'warn' });
  }

  /**
   * 记录信息日志
   */
  async info(data: Omit<LogData, 'level'>): Promise<void> {
    await this.log({ ...data, level: 'info' });
  }

  /**
   * 记录调试日志
   */
  async debug(data: Omit<LogData, 'level'>): Promise<void> {
    await this.log({ ...data, level: 'debug' });
  }

  /**
   * 获取日志列表
   */
  async getLogs(params: {
    page: number;
    limit: number;
    level?: string;
    source?: string;
    category?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    search?: string;
  }) {
    const { page, limit, level, source, category, userId, startTime, endTime, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (level) where.level = level;
    if (source) where.source = source;
    if (category) where.category = category;
    if (userId) where.userId = userId;
    if (search) {
      where.OR = [
        { message: { contains: search } },
        { details: { contains: search } },
        { userName: { contains: search } },
      ];
    }
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = startTime;
      if (endTime) where.timestamp.lte = endTime;
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取日志统计
   */
  async getLogStats() {
    const [total, errorCount, warnCount, infoCount] = await Promise.all([
      this.prisma.systemLog.count(),
      this.prisma.systemLog.count({ where: { level: 'error' } }),
      this.prisma.systemLog.count({ where: { level: 'warn' } }),
      this.prisma.systemLog.count({ where: { level: 'info' } }),
    ]);

    // 按来源统计
    const sourceStats = await this.prisma.systemLog.groupBy({
      by: ['source'],
      _count: { source: true },
    });

    // 按类别统计
    const categoryStats = await this.prisma.systemLog.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return {
      total,
      byLevel: {
        error: errorCount,
        warn: warnCount,
        info: infoCount,
        debug: total - errorCount - warnCount - infoCount,
      },
      bySource: sourceStats.reduce((acc, item) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>),
      byCategory: categoryStats.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * 清理旧日志
   */
  async cleanOldLogs(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.prisma.systemLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
} 