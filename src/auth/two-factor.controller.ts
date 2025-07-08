import { Body, Controller, Get, Post, Req, UseGuards, BadRequestException, Param } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { Request } from 'express';
import { TwoFactorAuxiliaryService } from './two-factor-auxiliary.service';

@Controller('auth/two-factor')
export class TwoFactorController {
  constructor(
    private readonly twoFactorService: TwoFactorService,
    private readonly authService: AuthService,
    private readonly auxiliaryService: TwoFactorAuxiliaryService,
  ) {}

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(req: Request): string {
    // 优先从代理头获取真实IP
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      return ips[0] || 'unknown';
    }
    
    // 从其他代理头获取
    const xRealIp = req.headers['x-real-ip'] as string;
    if (xRealIp) {
      return xRealIp;
    }
    
    // 从CF-Connecting-IP获取（Cloudflare）
    const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    // 从X-Forwarded-For获取
    const xForwarded = req.headers['x-forwarded'] as string;
    if (xForwarded) {
      return xForwarded;
    }
    
    // 最后使用Express的ip属性或连接地址
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  }

  // 获取二维码和密钥（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('generate')
  async generate(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const { secret, qrCode } = this.twoFactorService.generateSecret(user.sub, user.mail);
    return { secret, qrCode };
  }

  // 绑定2FA（需登录）
  @UseGuards(JwtAuthGuard)
  @Post('bind')
  async bind(@Req() req: Request, @Body() body: { token: string; secret: string }) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const { token, secret } = body;
    if (!this.twoFactorService.verifyToken(token, secret)) {
      throw new BadRequestException('验证码错误');
    }
    await this.twoFactorService.enableTwoFactor(user.sub, secret);
    return { success: true };
  }

  // 登录时校验2FA（登录后返回需要2FA的标志，前端再调用此接口）
  @Post('verify')
  async verify(@Body() body: { userId: string; token: string }, @Req() req: Request) {
    const { userId, token } = body;
    const ipAddress = this.getClientIp(req);
    
    // 查找用户密钥
    const user = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        name: true,
        mail: true,
        isSuperAdmin: true,
        twoFactorSecret: true,
        twoFactorEnabled: true
      },
    });
    
    if (!user?.twoFactorSecret) {
      // 记录失败尝试
      await this.auxiliaryService.recordAttempt(userId, ipAddress, 'totp', false);
      throw new BadRequestException('未绑定2FA');
    }
    
    const isValid = this.twoFactorService.verifyToken(token, user.twoFactorSecret);
    
    // 记录尝试
    await this.auxiliaryService.recordAttempt(userId, ipAddress, 'totp', isValid);
    
    if (!isValid) {
      throw new BadRequestException('验证码错误');
    }
    
    // 通过后生成完整的登录信息
    const tokenResult = await this.authService.generateToken(user.id);
    return {
      ...tokenResult,
      user: {
        id: user.id,
        name: user.name,
        mail: user.mail,
        twoFactorEnabled: user.twoFactorEnabled,
        isSuperAdmin: user.isSuperAdmin
      }
    };
  }

  // 禁用2FA（需登录）
  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Req() req: Request, @Body() body: { token: string }) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    // 校验一次token
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: user.sub },
      select: { twoFactorSecret: true },
    });
    if (!dbUser?.twoFactorSecret) throw new BadRequestException('未绑定2FA');
    if (!this.twoFactorService.verifyToken(body.token, dbUser.twoFactorSecret)) {
      throw new BadRequestException('验证码错误');
    }
    await this.twoFactorService.disableTwoFactor(user.sub);
    return { success: true };
  }

  // 为特定用户禁用2FA（管理员功能）
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('two_factor.unbind')
  @Post('disable/:userId')
  async disableForUser(@Req() req: Request, @Param('userId') userId: string, @Body() body: { token: string }) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    // 检查权限（超级管理员或用户本人）
    if (!user.isSuperAdmin && user.sub !== userId) {
      throw new BadRequestException('无权限访问');
    }
    
    // 校验目标用户的token
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
    if (!dbUser?.twoFactorSecret) throw new BadRequestException('用户未绑定2FA');
    if (!this.twoFactorService.verifyToken(body.token, dbUser.twoFactorSecret)) {
      throw new BadRequestException('验证码错误');
    }
    await this.twoFactorService.disableTwoFactor(userId);
    return { success: true };
  }

  // 获取2FA状态（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    return this.twoFactorService.getUserTwoFactorStatus(user.sub);
  }

  // 获取备用验证码（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('backup-codes')
  async getBackupCodes(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: user.sub },
      select: { backupCodes: true },
    });
    if (!dbUser?.backupCodes) throw new BadRequestException('未生成备用码');
    return { codes: JSON.parse(dbUser.backupCodes) };
  }

  // 为特定用户获取备用验证码（管理员功能）
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('two_factor.read')
  @Get('backup-codes/:userId')
  async getUserBackupCodes(@Req() req: Request, @Param('userId') userId: string) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    // 检查当前用户是否有权限（超级管理员或目标用户本人）
    if (!user.isSuperAdmin && user.sub !== userId) {
      throw new BadRequestException('无权限访问');
    }
    
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });
    if (!dbUser?.backupCodes) throw new BadRequestException('未生成备用码');
    return { codes: JSON.parse(dbUser.backupCodes) };
  }

  // 重置备用验证码（需登录）
  @UseGuards(JwtAuthGuard)
  @Post('regenerate-backup-codes')
  async regenerateBackupCodes(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const codes = await this.twoFactorService.regenerateBackupCodes(user.sub);
    return { codes };
  }

  // 为特定用户重置备用验证码（管理员功能）
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('two_factor.update')
  @Post('regenerate-backup-codes/:userId')
  async regenerateUserBackupCodes(@Req() req: Request, @Param('userId') userId: string) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    // 检查当前用户是否有权限（超级管理员或目标用户本人）
    if (!user.isSuperAdmin && user.sub !== userId) {
      throw new BadRequestException('无权限访问');
    }
    
    const codes = await this.twoFactorService.regenerateBackupCodes(userId);
    return { codes };
  }

  // 校验备用验证码（登录时）
  @Post('verify-backup-code')
  async verifyBackupCode(@Body() body: { userId: string; code: string }, @Req() req: Request) {
    const { userId, code } = body;
    const ipAddress = this.getClientIp(req);
    
    // 验证备用码
    const ok = await this.twoFactorService.verifyBackupCode(userId, code);
    
    // 记录尝试
    await this.auxiliaryService.recordAttempt(userId, ipAddress, 'backup_code', ok);
    
    if (!ok) {
      throw new BadRequestException('备用验证码错误');
    }
    
    // 验证成功后，获取用户信息
    const user = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        name: true,
        mail: true,
        isSuperAdmin: true,
        twoFactorEnabled: true
      },
    });
    
    if (!user) throw new BadRequestException('用户不存在');
    
    // 使用备用码后，禁用2FA并要求重新绑定
    await this.twoFactorService.disableTwoFactor(userId);
    
    // 生成临时token，用于重新绑定2FA
    const tokenResult = await this.authService.generateToken(user.id);
    return {
      ...tokenResult,
      user: {
        id: user.id,
        name: user.name,
        mail: user.mail,
        twoFactorEnabled: false, // 标记为需要重新绑定
        isSuperAdmin: user.isSuperAdmin
      },
      requiresReSetup: true, // 标记需要重新设置2FA
      message: '备用码验证成功，请重新绑定2FA'
    };
  }

  // 新的2FA设置流程API

  // 生成2FA密钥（前端生成二维码）
  @UseGuards(JwtAuthGuard)
  @Get('setup')
  async setup(@Req() req: any) {
    const user = req.user;
    if (!user || !user.sub) throw new BadRequestException('未登录');
    
    // 从数据库获取用户信息
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: user.sub },
      select: { mail: true },
    });
    
    if (!dbUser) throw new BadRequestException('用户不存在');
    
    const secret = await this.twoFactorService.generateSecretOnly(user.sub, dbUser.mail);
    return { 
      secret,
      userEmail: dbUser.mail
    };
  }

  // 为特定用户生成2FA密钥（管理员功能）
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('two_factor.create')
  @Get('setup/:userId')
  async setupForUser(@Req() req: any, @Param('userId') userId: string) {
    const user = req.user;
    if (!user || !user.sub) throw new BadRequestException('未登录');
    
    // 检查权限（超级管理员或用户本人）
    if (!user.isSuperAdmin && user.sub !== userId) {
      throw new BadRequestException('无权限访问');
    }
    
    // 从数据库获取目标用户信息
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { mail: true },
    });
    
    if (!dbUser) throw new BadRequestException('用户不存在');
    
    const secret = await this.twoFactorService.generateSecretOnly(userId, dbUser.mail);
    return { 
      secret,
      userEmail: dbUser.mail
    };
  }

  // 启用2FA（验证token并生成备份码，发送邮件）
  @UseGuards(JwtAuthGuard)
  @Post('enable')
  async enable(@Req() req: any, @Body() body: { token: string; secret: string }) {
    const user = req.user;
    if (!user || !user.sub) throw new BadRequestException('未登录');
    
    const result = await this.twoFactorService.enableTwoFactorWithBackup(user.sub, body.token, body.secret);
    return {
      success: true,
      backupCodes: result.backupCodes
    };
  }

  // 为特定用户启用2FA（管理员功能）
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('two_factor.bind')
  @Post('enable/:userId')
  async enableForUser(@Req() req: any, @Param('userId') userId: string, @Body() body: { token: string; secret: string }) {
    const user = req.user;
    if (!user || !user.sub) throw new BadRequestException('未登录');
    
    // 检查权限（超级管理员或用户本人）
    if (!user.isSuperAdmin && user.sub !== userId) {
      throw new BadRequestException('无权限访问');
    }
    
    const result = await this.twoFactorService.enableTwoFactorWithBackup(userId, body.token, body.secret);
    return {
      success: true,
      backupCodes: result.backupCodes
    };
  }
} 