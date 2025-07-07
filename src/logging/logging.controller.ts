import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { WebSeeAdapterService } from './websee-adapter.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { Public } from '../auth/public.decorator';

@Controller('logs')
export class LoggingController {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly alertingService: AlertingService,
    private readonly webSeeAdapter: WebSeeAdapterService,
  ) {}

  /**
   * 接收前端日志上报（公开接口，不需要认证）
   */
  @Post('report')
  @Public()
  async reportLog(@Body() logData: any, @Req() req: any) {
    let data = logData;
    // 兼容 text/plain
    if (typeof req.body === 'string') {
      try {
        data = JSON.parse(req.body);
      } catch (e) {
        console.error('text/plain 解析失败:', req.body);
        return { success: false, error: 'Invalid log data' };
      }
    }
    
    try {
      // 确保logData存在且是对象
      if (!data || typeof data !== 'object') {
        console.error('数据格式错误:', data);
        return { success: false, error: 'Invalid log data' };
      }

      // 限制请求体大小，如果数据太大则截断
      const maxSize = 10 * 1024 * 1024; // 10MB
      let processedData = data;
      
      // 如果数据太大，进行截断处理
      const dataSize = JSON.stringify(data).length;
      if (dataSize > maxSize) {
        console.warn(`Log data too large (${dataSize} bytes), truncating...`);
        processedData = {
          ...data,
          // 截断可能很大的字段
          stack: data.stack ? data.stack.substring(0, 50000) + '...' : data.stack,
          details: data.details ? JSON.stringify(data.details).substring(0, 50000) + '...' : data.details,
          // 移除录屏数据（通常很大）
          recordScreenId: data.recordScreenId,
          recordScreen: undefined,
        };
      }
      
      // 检查是否是 web-see 格式的数据
      if (processedData.type && (processedData.type === 'error' || processedData.type === 'custom' || processedData.type === 'performance' || processedData.type === 'behavior' || processedData.type === 'whiteScreen' || processedData.type === 'xhr' || processedData.type === 'fetch' || processedData.type === 'resource' || processedData.type === 'unhandledrejection')) {
        // 使用 web-see 适配器处理
        await this.webSeeAdapter.handleWebSeeReport(processedData, processedData.source || 'frontend');
      } else {
        // 使用传统格式处理
        await this.loggingService.log({
          level: processedData.level || 'info',
          source: processedData.source || 'frontend',
          category: processedData.category || 'system',
          message: processedData.message || 'No message provided',
          details: processedData.details,
          stack: processedData.stack,
          url: processedData.url,
          userAgent: processedData.userAgent,
          ip: processedData.ip,
          userId: processedData.userId,
          userName: processedData.userName,
          sessionId: processedData.sessionId,
          requestId: processedData.requestId,
          duration: processedData.duration,
          memory: processedData.memory,
          tags: processedData.tags,
        });

        // 如果是错误级别，创建告警
        if (['error', 'critical'].includes(processedData.level)) {
          await this.alertingService.createAlert({
            level: processedData.level === 'critical' ? 'critical' : 'error',
            source: processedData.source || 'frontend',
            category: processedData.category || 'js_error',
            title: processedData.title || processedData.message,
            message: processedData.message,
            details: processedData.details,
            stack: processedData.stack,
            url: processedData.url,
            userAgent: processedData.userAgent,
            ip: processedData.ip,
            userId: processedData.userId,
            userName: processedData.userName,
            sessionId: processedData.sessionId,
            requestId: processedData.requestId,
            tags: processedData.tags,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('处理日志上报时出错:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取日志列表（需要认证和权限）
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('log.read')
  async getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('category') category?: string,
    @Query('userId') userId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('search') search?: string,
  ) {
    return this.loggingService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      level,
      source,
      category,
      userId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      search,
    });
  }

  /**
   * 获取日志统计（需要认证和权限）
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('log.read')
  async getLogStats() {
    return this.loggingService.getLogStats();
  }

  /**
   * 清理旧日志（需要认证和权限）
   */
  @Post('clean')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('log.delete')
  async cleanOldLogs(@Body() body: { days?: number }) {
    const days = body.days || 30;
    const count = await this.loggingService.cleanOldLogs(days);
    return { success: true, deletedCount: count };
  }
} 