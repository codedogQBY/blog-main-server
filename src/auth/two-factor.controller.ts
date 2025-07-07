import { Body, Controller, Get, Post, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Controller('auth/two-factor')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  // 获取二维码和密钥（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('generate')
  async generate(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const { secret, qrCode } = this.twoFactorService.generateSecret(user.id, user.mail);
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
    await this.twoFactorService.enableTwoFactor(user.id, secret);
    return { success: true };
  }

  // 登录时校验2FA（登录后返回需要2FA的标志，前端再调用此接口）
  @Post('verify')
  async verify(@Body() body: { userId: string; token: string }) {
    const { userId, token } = body;
    // 查找用户密钥
    // 这里假设登录流程已校验账号密码，返回userId
    // 2FA未通过前不发放完整token
    const user = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
    if (!user?.twoFactorSecret) throw new BadRequestException('未绑定2FA');
    if (!this.twoFactorService.verifyToken(token, user.twoFactorSecret)) {
      throw new BadRequestException('验证码错误');
    }
    // 通过后由登录流程发放token
    return { success: true };
  }

  // 禁用2FA（需登录）
  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Req() req: Request, @Body() body: { token: string }) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    // 校验一次token
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: user.id },
      select: { twoFactorSecret: true },
    });
    if (!dbUser?.twoFactorSecret) throw new BadRequestException('未绑定2FA');
    if (!this.twoFactorService.verifyToken(body.token, dbUser.twoFactorSecret)) {
      throw new BadRequestException('验证码错误');
    }
    await this.twoFactorService.disableTwoFactor(user.id);
    return { success: true };
  }

  // 获取2FA状态（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    return this.twoFactorService.getUserTwoFactorStatus(user.id);
  }

  // 获取备用验证码（需登录）
  @UseGuards(JwtAuthGuard)
  @Get('backup-codes')
  async getBackupCodes(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    const dbUser = await this.twoFactorService['prisma'].user.findUnique({
      where: { id: user.id },
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
    const codes = await this.twoFactorService.regenerateBackupCodes(user.id);
    return { codes };
  }

  // 校验备用验证码（登录时）
  @Post('verify-backup-code')
  async verifyBackupCode(@Body() body: { userId: string; code: string }) {
    const { userId, code } = body;
    const ok = await this.twoFactorService.verifyBackupCode(userId, code);
    if (!ok) throw new BadRequestException('备用验证码错误');
    return { success: true };
  }
} 