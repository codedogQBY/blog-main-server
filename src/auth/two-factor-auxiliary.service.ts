import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TwoFactorAuxiliaryService {
  constructor(private prisma: PrismaService, private mailService: MailService) {}

  // ==================== 2FA尝试记录 ====================
  
  /**
   * 记录2FA尝试
   */
  async recordAttempt(
    userId: string,
    ipAddress: string,
    attemptType: 'totp' | 'backup_code',
    success: boolean,
  ) {
    const attempt = await this.prisma.twoFactorAttempt.create({
      data: {
        userId,
        ipAddress,
        attemptType,
        success,
      },
    });

    // 如果验证失败，检查是否需要自动锁定
    if (!success) {
      await this.checkAndLockUser(userId, attemptType);
    }

    return attempt;
  }

  /**
   * 检查并自动锁定用户
   */
  private async checkAndLockUser(userId: string, attemptType: 'totp' | 'backup_code') {
    const now = new Date();
    const timeWindow = new Date(now.getTime() - 15 * 60 * 1000); // 15分钟内

    // 获取最近的失败尝试
    const recentFailures = await this.prisma.twoFactorAttempt.count({
      where: {
        userId,
        attemptType,
        success: false,
        createdAt: { gte: timeWindow },
      },
    });

    // 检查是否已锁定
    const isLocked = await this.isUserLocked(userId, attemptType);
    if (isLocked.locked) {
      return; // 已经锁定，不需要重复锁定
    }

    // 锁定条件：15分钟内连续失败5次
    if (recentFailures >= 5) {
      await this.lockUser(userId, attemptType, 30); // 锁定30分钟
      
      // 记录锁定日志
      await this.logAction(userId, 'AUTO_LOCK', {
        reason: `连续${recentFailures}次${attemptType}验证失败`,
        lockType: attemptType,
        duration: 30,
      });
    }
  }

  /**
   * 获取用户2FA尝试记录
   */
  async getUserAttempts(userId: string, limit = 50) {
    return this.prisma.twoFactorAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取所有2FA尝试记录（管理员）
   */
  async getAllAttempts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [attempts, total] = await Promise.all([
      this.prisma.twoFactorAttempt.findMany({
        include: {
          user: {
            select: { name: true, mail: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.twoFactorAttempt.count(),
    ]);

    return {
      attempts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== 用户锁定 ====================
  
  /**
   * 锁定用户
   */
  async lockUser(
    userId: string,
    lockType: 'totp' | 'backup_code' | 'login',
    durationMinutes = 30,
  ) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

    return this.prisma.userLock.create({
      data: {
        userId,
        lockType,
        lockedUntil,
      },
    });
  }

  /**
   * 检查用户是否被锁定
   */
  async isUserLocked(userId: string, lockType?: string) {
    const now = new Date();
    const where: any = {
      userId,
      lockedUntil: { gt: now },
    };

    if (lockType) {
      where.lockType = lockType;
    }

    const lock = await this.prisma.userLock.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return lock ? {
      locked: true,
      lockType: lock.lockType,
      lockedUntil: lock.lockedUntil,
      remainingMinutes: lock.lockedUntil ? Math.ceil((lock.lockedUntil.getTime() - now.getTime()) / (1000 * 60)) : 0,
    } : { locked: false };
  }

  /**
   * 解除用户锁定
   */
  async unlockUser(userId: string, lockType?: string) {
    const where: any = { userId };
    if (lockType) {
      where.lockType = lockType;
    }

    return this.prisma.userLock.updateMany({
      where,
      data: { lockedUntil: new Date(0) }, // 设置为过去时间，相当于解除锁定
    });
  }

  /**
   * 获取用户锁定记录
   */
  async getUserLocks(userId: string) {
    return this.prisma.userLock.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取所有锁定记录（管理员）
   */
  async getAllLocks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [locks, total] = await Promise.all([
      this.prisma.userLock.findMany({
        include: {
          user: {
            select: { name: true, mail: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userLock.count(),
    ]);

    return {
      locks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== 2FA恢复请求 ====================
  
  /**
   * 创建2FA恢复请求
   */
  async createRecoveryRequest(userId: string, email: string) {
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1小时有效期

    const recovery = await this.prisma.twoFactorRecovery.create({
      data: {
        userId,
        email,
        recoveryCode,
        expiresAt,
      },
    });

    // 发送恢复码邮件
    await this.sendRecoveryCodeMail(email, recoveryCode, expiresAt);
    return recovery;
  }

  /**
   * 发送2FA恢复码邮件
   */
  private async sendRecoveryCodeMail(email: string, code: string, expiresAt: Date) {
    const subject = '2FA恢复请求验证码';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">2FA恢复请求验证码</h2>
        <p>您的2FA恢复请求已提交，请使用以下验证码完成身份验证：</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 2em; font-family: monospace; letter-spacing: 2px;">${code}</span>
        </div>
        <p>验证码有效期至：${expiresAt.toLocaleString()}</p>
        <ul>
          <li>如非本人操作，请忽略本邮件。</li>
          <li>如有疑问请联系管理员。</li>
        </ul>
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </div>
    `;
    try {
      await this.mailService.sendMail(email, subject, html);
    } catch (error) {
      console.error('发送2FA恢复码邮件失败:', error);
    }
  }

  /**
   * 验证恢复请求
   */
  async verifyRecoveryRequest(email: string, recoveryCode: string) {
    const now = new Date();
    const recovery = await this.prisma.twoFactorRecovery.findFirst({
      where: {
        email,
        recoveryCode,
        expiresAt: { gt: now },
        used: false,
      },
    });

    if (!recovery) {
      return null;
    }

    // 标记为已使用
    await this.prisma.twoFactorRecovery.update({
      where: { id: recovery.id },
      data: { used: true },
    });

    // 自动解除2FA相关锁定
    if (recovery.userId) {
      await this.unlockUser(recovery.userId, 'totp');
      await this.unlockUser(recovery.userId, 'backup_code');

      // 自动记录操作日志
      await this.logAction(recovery.userId, '2FA_RECOVERY_SUCCESS', { email, recoveryCode });
    }

    return recovery;
  }

  /**
   * 获取用户的恢复请求
   */
  async getUserRecoveryRequests(userId: string) {
    return this.prisma.twoFactorRecovery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取所有恢复请求（管理员）
   */
  async getAllRecoveryRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      this.prisma.twoFactorRecovery.findMany({
        include: {
          user: {
            select: { name: true, mail: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.twoFactorRecovery.count(),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== 2FA操作日志 ====================
  
  /**
   * 记录2FA操作日志
   */
  async logAction(
    userId: string,
    action: string,
    details?: any,
    adminId?: string,
  ) {
    return this.prisma.twoFactorLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : undefined,
        adminId,
      },
    });
  }

  /**
   * 获取用户操作日志
   */
  async getUserLogs(userId: string, limit = 50) {
    return this.prisma.twoFactorLog.findMany({
      where: { userId },
      include: {
        admin: {
          select: { name: true, mail: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 获取所有操作日志（管理员）
   */
  async getAllLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.twoFactorLog.findMany({
        include: {
          user: {
            select: { name: true, mail: true },
          },
          admin: {
            select: { name: true, mail: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.twoFactorLog.count(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== 安全统计 ====================
  
  /**
   * 获取2FA安全统计
   */
  async getSecurityStats() {
    const [
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      activeLocks,
      pendingRecoveries,
    ] = await Promise.all([
      this.prisma.twoFactorAttempt.count(),
      this.prisma.twoFactorAttempt.count({ where: { success: true } }),
      this.prisma.twoFactorAttempt.count({ where: { success: false } }),
      this.prisma.userLock.count({
        where: { lockedUntil: { gt: new Date() } },
      }),
      this.prisma.twoFactorRecovery.count({
        where: {
          used: false,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate: totalAttempts > 0 ? (successfulAttempts / totalAttempts * 100).toFixed(2) : '0',
      activeLocks,
      pendingRecoveries,
    };
  }
} 