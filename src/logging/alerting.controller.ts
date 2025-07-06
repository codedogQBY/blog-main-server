import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AlertingService } from './alerting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertingController {
  constructor(private readonly alertingService: AlertingService) {}

  /**
   * 获取告警列表
   */
  @Get()
  @Permissions('alert.read')
  async getAlerts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('category') category?: string,
    @Query('isRead') isRead?: string,
    @Query('isResolved') isResolved?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('search') search?: string,
  ) {
    return this.alertingService.getAlerts({
      page: parseInt(page),
      limit: parseInt(limit),
      level,
      source,
      category,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      isResolved: isResolved === 'true' ? true : isResolved === 'false' ? false : undefined,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      search,
    });
  }

  /**
   * 获取告警统计
   */
  @Get('stats')
  @Permissions('alert.read')
  async getAlertStats() {
    return this.alertingService.getAlertStats();
  }

  /**
   * 标记告警为已读
   */
  @Post(':id/read')
  @Permissions('alert.update')
  async markAsRead(@Param('id') id: string) {
    await this.alertingService.markAsRead(id);
    return { success: true };
  }

  /**
   * 标记告警为已处理
   */
  @Post(':id/resolve')
  @Permissions('alert.update')
  async markAsResolved(
    @Param('id') id: string,
    @Body() body: { resolvedBy: string; note?: string },
  ) {
    await this.alertingService.markAsResolved(id, body.resolvedBy, body.note);
    return { success: true };
  }

  /**
   * 标记所有未读告警为已读
   */
  @Post('mark-all-read')
  @Permissions('alert.update')
  async markAllAsRead() {
    const result = await this.alertingService.markAllAsRead();
    return { 
      success: true, 
      message: `成功标记 ${result.updatedCount} 个告警为已读`,
      updatedCount: result.updatedCount
    };
  }

  /**
   * 批量标记为已读
   */
  @Post('batch/read')
  @Permissions('alert.update')
  async batchMarkAsRead(@Body() body: { ids: string[] }) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const id of body.ids) {
      try {
        await this.alertingService.markAsRead(id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${id}: ${error.message}`);
      }
    }
    
    return { 
      success: true, 
      results,
      message: `成功标记 ${results.success} 个告警为已读，失败 ${results.failed} 个`
    };
  }

  /**
   * 批量标记为已处理
   */
  @Post('batch/resolve')
  @Permissions('alert.update')
  async batchMarkAsResolved(
    @Body() body: { ids: string[]; resolvedBy: string; note?: string },
  ) {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const id of body.ids) {
      try {
        await this.alertingService.markAsResolved(id, body.resolvedBy, body.note);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${id}: ${error.message}`);
      }
    }
    
    return { 
      success: true, 
      results,
      message: `成功标记 ${results.success} 个告警为已处理，失败 ${results.failed} 个`
    };
  }
} 