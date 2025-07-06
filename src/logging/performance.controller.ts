import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('performance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  /**
   * 获取性能数据列表
   */
  @Get()
  @Permissions('performance.read')
  async getPerformanceData(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('source') source?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('search') search?: string,
  ) {
    return this.performanceService.getPerformanceData({
      page: parseInt(page),
      limit: parseInt(limit),
      source,
      type,
      userId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      search,
    });
  }

  /**
   * 获取性能数据统计
   */
  @Get('stats')
  @Permissions('performance.read')
  async getPerformanceStats() {
    return this.performanceService.getPerformanceStats();
  }

  /**
   * 清理旧性能数据
   */
  @Post('clean')
  @Permissions('performance.delete')
  async cleanOldData(@Body() body: { days?: number }) {
    const days = body.days || 30;
    const count = await this.performanceService.cleanOldData(days);
    return { success: true, deletedCount: count };
  }

  /**
   * 获取页面性能统计
   */
  @Get('page-stats')
  @Permissions('performance.read')
  async getPageStats(@Query('type') type: string) {
    if (!type) {
      return { error: 'Type parameter is required' };
    }
    return this.performanceService.getPageStats(type);
  }

  /**
   * 创建测试性能数据（仅用于开发测试）
   */
  @Post('test-data')
  @Permissions('performance.write')
  async createTestData() {
    await this.performanceService.createTestData();
    return { success: true, message: 'Test data created successfully' };
  }
} 