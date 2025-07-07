import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * 生成TOTP密钥
   */
  generateSecret(userId: string, userEmail: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `Blog Admin (${userEmail})`,
      issuer: 'Blog Admin',
      length: 32,
    });

    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `Blog Admin:${userEmail}`,
      issuer: 'Blog Admin',
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * 验证TOTP令牌
   */
  verifyToken(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // 允许1个时间窗口的偏差
    });
  }

  /**
   * 生成备用验证码
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // 生成8位数字验证码
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    return codes;
  }

  /**
   * 验证备用验证码
   */
  verifyBackupCode(userId: string, code: string): Promise<boolean> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    }).then(user => {
      if (!user?.backupCodes) return false;
      
      const backupCodes = JSON.parse(user.backupCodes);
      const index = backupCodes.indexOf(code);
      
      if (index === -1) return false;
      
      // 移除已使用的备用码
      backupCodes.splice(index, 1);
      
      // 更新数据库
      return this.prisma.user.update({
        where: { id: userId },
        data: { backupCodes: JSON.stringify(backupCodes) },
      }).then(() => true);
    });
  }

  /**
   * 启用2FA
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    const backupCodes = this.generateBackupCodes();
    
    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, mail: true },
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: JSON.stringify(backupCodes),
        twoFactorSetupAt: new Date(),
      },
    });
    
    // 发送2FA设置成功邮件
    await this.sendTwoFactorSetupEmail(user.mail, user.name, backupCodes);
  }

  /**
   * 禁用2FA
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        twoFactorSetupAt: null,
      },
    });
  }

  /**
   * 重新生成备用验证码
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: JSON.stringify(backupCodes),
      },
    });

    return backupCodes;
  }

  /**
   * 获取用户的2FA状态
   */
  async getUserTwoFactorStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSetupAt: true,
        backupCodes: true,
      },
    });

    if (!user) return null;

    return {
      enabled: user.twoFactorEnabled,
      setupAt: user.twoFactorSetupAt,
      backupCodesCount: user.backupCodes ? JSON.parse(user.backupCodes).length : 0,
    };
  }

  /**
   * 发送2FA设置成功邮件
   */
  private async sendTwoFactorSetupEmail(email: string, userName: string, backupCodes: string[]) {
    const subject = '2FA双因素认证设置成功';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">2FA双因素认证设置成功</h2>
        <p>亲爱的 ${userName}，</p>
        <p>您的2FA双因素认证已经成功设置。为了确保您的账户安全，请妥善保管以下备用验证码：</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #666;">备用验证码（请妥善保管）：</h3>
          <div style="font-family: monospace; font-size: 16px; line-height: 1.8;">
            ${backupCodes.map(code => `<div style="margin: 5px 0;">${code}</div>`).join('')}
          </div>
        </div>
        
        <p><strong>重要提醒：</strong></p>
        <ul>
          <li>这些备用验证码用于在您无法使用手机验证器时恢复账户访问</li>
          <li>请将这些验证码保存在安全的地方，不要分享给他人</li>
          <li>每个验证码只能使用一次，使用后会自动失效</li>
          <li>如果备用验证码用完，请联系管理员重新生成</li>
        </ul>
        
        <p>如果您没有进行此操作，请立即联系管理员。</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          此邮件由系统自动发送，请勿回复。
        </p>
      </div>
    `;
    
    try {
      await this.mailService.sendMail(email, subject, html);
    } catch (error) {
      // 记录错误但不抛出，避免影响2FA设置流程
      console.error('发送2FA设置邮件失败:', error);
    }
  }
} 