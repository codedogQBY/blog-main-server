import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TwoFactorAuxiliaryService } from './two-factor-auxiliary.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { PermissionsGuard } from '../common/permissions.guard';
import { Request } from 'express';

@Controller('auth/two-factor-auxiliary')
export class TwoFactorAuxiliaryController {
  constructor(private readonly auxiliaryService: TwoFactorAuxiliaryService) {}

  // ==================== 2FA尝试记录 ====================

  /**
   * 记录2FA尝试（内部使用）
   */
  @Post('attempts/record')
  async recordAttempt(
    @Body() body: {
      userId: string;
      ipAddress: string;
      attemptType: 'totp' | 'backup_code';
      success: boolean;
    },
  ) {
    const { userId, ipAddress, attemptType, success } = body;
    return this.auxiliaryService.recordAttempt(userId, ipAddress, attemptType, success);
  }

  /**
   * 获取用户自己的尝试记录
   */
  @UseGuards(JwtAuthGuard)
  @Get('attempts/my')
  async getMyAttempts(@Req() req: Request, @Query('limit') limit?: string) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    return this.auxiliaryService.getUserAttempts(user.id, limit ? parseInt(limit) : 50);
  }

  /**
   * 获取所有尝试记录（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.read')
  @Get('attempts/all')
  async getAllAttempts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.auxiliaryService.getAllAttempts(parseInt(page), parseInt(limit));
  }

  // ==================== 用户锁定 ====================

  /**
   * 检查用户是否被锁定
   */
  @UseGuards(JwtAuthGuard)
  @Get('locks/check')
  async checkLock(@Req() req: Request, @Query('type') lockType?: string) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    return this.auxiliaryService.isUserLocked(user.id, lockType);
  }

  /**
   * 检查指定用户是否被锁定（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.read')
  @Get('locks/check-user')
  async checkUserLock(@Query('userId') userId: string, @Query('type') lockType?: string) {
    if (!userId) throw new BadRequestException('用户ID不能为空');
    
    return this.auxiliaryService.isUserLocked(userId, lockType);
  }

  /**
   * 获取用户自己的锁定记录
   */
  @UseGuards(JwtAuthGuard)
  @Get('locks/my')
  async getMyLocks(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    return this.auxiliaryService.getUserLocks(user.id);
  }

  /**
   * 锁定用户（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.update')
  @Post('locks/create')
  async createLock(
    @Body() body: {
      userId: string;
      lockType: 'totp' | 'backup_code' | 'login';
      durationMinutes?: number;
    },
  ) {
    const { userId, lockType, durationMinutes = 30 } = body;
    return this.auxiliaryService.lockUser(userId, lockType, durationMinutes);
  }

  /**
   * 解除用户锁定（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.unlock')
  @Post('locks/unlock')
  async unlockUser(
    @Body() body: { userId: string; lockType?: string },
  ) {
    const { userId, lockType } = body;
    return this.auxiliaryService.unlockUser(userId, lockType);
  }

  /**
   * 获取所有锁定记录（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.read')
  @Get('locks/all')
  async getAllLocks(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.auxiliaryService.getAllLocks(parseInt(page), parseInt(limit));
  }

  // ==================== 2FA恢复请求 ====================

  /**
   * 创建恢复请求
   */
  @Post('recovery/create')
  async createRecoveryRequest(
    @Body() body: { userId: string; email: string },
  ) {
    const { userId, email } = body;
    const recovery = await this.auxiliaryService.createRecoveryRequest(userId, email);
    
    // TODO: 发送恢复邮件
    return { success: true, message: '恢复请求已创建，请检查邮箱' };
  }

  /**
   * 验证恢复请求
   */
  @Post('recovery/verify')
  async verifyRecoveryRequest(
    @Body() body: { email: string; recoveryCode: string },
  ) {
    const { email, recoveryCode } = body;
    const recovery = await this.auxiliaryService.verifyRecoveryRequest(email, recoveryCode);
    
    if (!recovery) {
      throw new BadRequestException('恢复码无效或已过期');
    }
    
    return { success: true, userId: recovery.userId };
  }

  /**
   * 获取用户自己的恢复请求
   */
  @UseGuards(JwtAuthGuard)
  @Get('recovery/my')
  async getMyRecoveryRequests(@Req() req: Request) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    return this.auxiliaryService.getUserRecoveryRequests(user.id);
  }

  /**
   * 获取所有恢复请求（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.read')
  @Get('recovery/all')
  async getAllRecoveryRequests(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.auxiliaryService.getAllRecoveryRequests(parseInt(page), parseInt(limit));
  }

  // ==================== 2FA操作日志 ====================

  /**
   * 记录操作日志（内部使用）
   */
  @Post('logs/record')
  async recordLog(
    @Body() body: {
      userId: string;
      action: string;
      details?: any;
      adminId?: string;
    },
  ) {
    const { userId, action, details, adminId } = body;
    return this.auxiliaryService.logAction(userId, action, details, adminId);
  }

  /**
   * 获取用户自己的操作日志
   */
  @UseGuards(JwtAuthGuard)
  @Get('logs/my')
  async getMyLogs(@Req() req: Request, @Query('limit') limit?: string) {
    const user = req['user'];
    if (!user) throw new BadRequestException('未登录');
    
    return this.auxiliaryService.getUserLogs(user.id, limit ? parseInt(limit) : 50);
  }

  /**
   * 获取所有操作日志（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.read')
  @Get('logs/all')
  async getAllLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.auxiliaryService.getAllLogs(parseInt(page), parseInt(limit));
  }

  // ==================== 安全统计 ====================

  /**
   * 获取安全统计（管理员）
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('two_factor.stats')
  @Get('stats')
  async getSecurityStats() {
    return this.auxiliaryService.getSecurityStats();
  }
} 