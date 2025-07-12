import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

export interface AlertData {
  level: 'critical' | 'error' | 'warning' | 'info';
  source: 'frontend' | 'admin' | 'backend';
  category: 'js_error' | 'api_error' | 'performance' | 'security' | 'system';
  title: string;
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
  tags?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 创建告警
   */
  async createAlert(alertData: AlertData): Promise<void> {
    try {
      const alert = await this.prisma.systemAlert.create({
        data: {
          level: alertData.level,
          source: alertData.source,
          category: alertData.category,
          title: alertData.title,
          message: alertData.message,
          details: alertData.details ? JSON.stringify(alertData.details) : null,
          stack: alertData.stack,
          url: alertData.url,
          userAgent: alertData.userAgent,
          ip: alertData.ip,
          userId: alertData.userId,
          userName: alertData.userName,
          sessionId: alertData.sessionId,
          requestId: alertData.requestId,
          tags: alertData.tags ? JSON.stringify(alertData.tags) : null,
        },
      });

      // 检查是否需要发送邮件告警
      if (this.shouldSendEmail(alertData.level, alertData.category)) {
        await this.sendEmailAlert(alert);
      }

      this.logger.warn(`Alert created: ${alertData.title}`);
    } catch (error) {
      this.logger.error('Failed to create alert:', error);
    }
  }

  /**
   * 判断是否需要发送邮件
   */
  private shouldSendEmail(level: string, category?: string): boolean {
    // 性能相关的告警不发送邮件给站长
    if (category === 'performance') {
      return false;
    }
    
    // 只有严重和错误级别的告警才发送邮件
    return ['critical', 'error'].includes(level);
  }

  /**
   * 发送邮件告警
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (!adminEmail) {
        this.logger.warn('ADMIN_EMAIL not configured, skipping email alert');
        return;
      }

      const emailContent = this.generateEmailContent(alert);
      
      await this.mailService.sendMail(
        adminEmail,
        `[系统告警] ${alert.title}`,
        emailContent
      );

      // 更新告警状态
      await this.prisma.systemAlert.update({
        where: { id: alert.id },
        data: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });

      // 记录通知
      await this.prisma.alertNotification.create({
        data: {
          alertId: alert.id,
          type: 'email',
          recipient: adminEmail,
          content: emailContent,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      this.logger.log(`Email alert sent to ${adminEmail}`);
    } catch (error) {
      this.logger.error('Failed to send email alert:', error);
      
      // 记录发送失败
      await this.prisma.alertNotification.create({
        data: {
          alertId: alert.id,
          type: 'email',
          recipient: this.configService.get<string>('ADMIN_EMAIL') || '',
          content: '',
          status: 'failed',
          error: error.message,
        },
      });
    }
  }

  /**
   * 生成邮件内容
   */
  private generateEmailContent(alert: any): string {
    const siteUrl = this.configService.get<string>('SITE_URL', 'http://localhost:3000');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">🚨 系统告警</h2>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${alert.title}</h3>
          <p style="margin: 0; color: #666;">${alert.message}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">级别</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.level.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">来源</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.source}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">类别</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.category}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">时间</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${new Date(alert.timestamp).toLocaleString('zh-CN')}</td>
          </tr>
          ${alert.url ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">页面</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.url}</td>
          </tr>
          ` : ''}
          ${alert.userName ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">用户</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.userName}</td>
          </tr>
          ` : ''}
          ${alert.ip ? `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">IP地址</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${alert.ip}</td>
          </tr>
          ` : ''}
        </table>
        
        ${alert.stack ? `
        <div style="background: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">错误堆栈</h4>
          <pre style="margin: 0; white-space: pre-wrap; font-size: 12px; color: #666;">${alert.stack}</pre>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${siteUrl}/admin/alerts" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            查看告警详情
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </div>
    `;
  }

  /**
   * 获取告警列表
   */
  async getAlerts(params: {
    page: number;
    limit: number;
    level?: string;
    source?: string;
    category?: string;
    isRead?: boolean;
    isResolved?: boolean;
    startTime?: Date;
    endTime?: Date;
    search?: string;
  }) {
    const { page, limit, level, source, category, isRead, isResolved, startTime, endTime, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (level) where.level = level;
    if (source) where.source = source;
    if (category) where.category = category;
    if (isRead !== undefined) where.isRead = isRead;
    if (isResolved !== undefined) where.isResolved = isResolved;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
        { userName: { contains: search } },
      ];
    }
    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = startTime;
      if (endTime) where.timestamp.lte = endTime;
    }

    const [alerts, total] = await Promise.all([
      this.prisma.systemAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          notifications: true,
        },
      }),
      this.prisma.systemAlert.count({ where }),
    ]);

    return {
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 标记告警为已读
   */
  async markAsRead(alertId: string): Promise<void> {
    try {
      await this.prisma.systemAlert.update({
        where: { id: alertId },
        data: { isRead: true },
      });
    } catch (error) {
      // 如果告警不存在，记录警告但不抛出错误
      if (error.code === 'P2025') {
        this.logger.warn(`Alert with ID ${alertId} not found when trying to mark as read`);
        return;
      }
      throw error;
    }
  }

  /**
   * 标记告警为已处理
   */
  async markAsResolved(alertId: string, resolvedBy: string, note?: string): Promise<void> {
    try {
      await this.prisma.systemAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedBy,
          resolvedAt: new Date(),
          resolvedNote: note,
        },
      });
    } catch (error) {
      // 如果告警不存在，记录警告但不抛出错误
      if (error.code === 'P2025') {
        this.logger.warn(`Alert with ID ${alertId} not found when trying to mark as resolved`);
        return;
      }
      throw error;
    }
  }

  /**
   * 获取告警统计
   */
  async getAlertStats() {
    const [total, unreadCount, unresolvedCount, criticalCount, errorCount] = await Promise.all([
      this.prisma.systemAlert.count(),
      this.prisma.systemAlert.count({ where: { isRead: false } }),
      this.prisma.systemAlert.count({ where: { isResolved: false } }),
      this.prisma.systemAlert.count({ where: { level: 'critical' } }),
      this.prisma.systemAlert.count({ where: { level: 'error' } }),
    ]);

    // 按来源统计
    const sourceStats = await this.prisma.systemAlert.groupBy({
      by: ['source'],
      _count: { source: true },
    });

    // 按类别统计
    const categoryStats = await this.prisma.systemAlert.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    return {
      total,
      unread: unreadCount,
      unresolved: unresolvedCount,
      byLevel: {
        critical: criticalCount,
        error: errorCount,
        warning: total - criticalCount - errorCount,
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
   * 标记所有未读告警为已读
   */
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const result = await this.prisma.systemAlert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    
    return { updatedCount: result.count };
  }
} 