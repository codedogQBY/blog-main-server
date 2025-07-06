import { Injectable } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { AlertingService } from './alerting.service';
import { PerformanceService } from './performance.service';

export interface WebSeeData {
  type: string;
  message: string;
  error?: any;
  data?: any;
  timestamp?: string;
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
  // web-see 特有字段
  breadcrumb?: any[];
  context?: any;
  apikey?: string;
  // 性能数据
  performance?: any;
  name?: string;
  value?: number;
  longTask?: {
    name?: string;
    entryType?: string;
    startTime?: number;
    duration?: number;
    attribution?: any[];
  };
  // 录屏数据
  recordScreen?: any;
  // 白屏检测
  whiteScreen?: any;
  recordScreenId?: string;
  // 设备信息
  deviceInfo?: {
    browserVersion?: string;
    browser?: string;
    osVersion?: string;
    os?: string;
    ua?: string;
    device?: string;
    device_type?: string;
  };
  pageUrl?: string;
  time?: number;
  status?: string;
  sdkVersion?: string;
  uuid?: string;
  rating?: string;
  resourceList?: any[];
}

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
export class WebSeeAdapterService {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly alertingService: AlertingService,
    private readonly performanceService: PerformanceService,
  ) {}

  /**
   * 处理 web-see 上报的数据
   */
  async handleWebSeeReport(webSeeData: WebSeeData, source: 'frontend' | 'admin' = 'frontend'): Promise<void> {
    try {
      // 根据 apikey 判断来源
      let actualSource: 'frontend' | 'admin' = source;
      if (webSeeData.apikey) {
        if (webSeeData.apikey === 'blog-frontend') {
          actualSource = 'frontend';
        } else if (webSeeData.apikey === 'blog-admin') {
          actualSource = 'admin';
        }
      }

      // 根据数据类型处理
      switch (webSeeData.type) {
        case 'error':
        case 'unhandledrejection':
          await this.handleError(webSeeData, actualSource);
          break;
        case 'xhr':
        case 'fetch':
          await this.handleHttpError(webSeeData, actualSource);
          break;
        case 'resource':
          await this.handleResourceError(webSeeData, actualSource);
          break;
        case 'performance':
          await this.handlePerformance(webSeeData, actualSource);
          break;
        case 'behavior':
          await this.handleBehavior(webSeeData, actualSource);
          break;
        case 'whiteScreen':
          await this.handleWhiteScreen(webSeeData, actualSource);
          break;
        case 'custom':
          await this.handleCustom(webSeeData, actualSource);
          break;
        case 'recordScreen':
          await this.handleRecordScreen(webSeeData, actualSource);
          break;
        default:
          await this.handleUnknown(webSeeData, actualSource);
      }
    } catch (error) {
      console.error('处理 web-see 数据时出错:', error);
    }
  }

  /**
   * 处理 JavaScript 错误
   */
  private async handleError(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'error',
      source,
      category: 'js_error',
      message: webSeeData.message,
      details: {
        error: webSeeData.error,
        breadcrumb: webSeeData.breadcrumb,
        context: webSeeData.context,
        // 录屏数据单独存储，不放在 details 中
      },
      stack: webSeeData.error?.stack,
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      // 录屏相关字段
      recordScreenId: webSeeData.recordScreenId,
      recordScreen: webSeeData.recordScreen ? JSON.stringify(webSeeData.recordScreen) : undefined,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        errorType: webSeeData.type,
      },
    };

    await this.loggingService.log(logData);

    // 创建告警
    await this.alertingService.createAlert({
      level: 'error',
      source,
      category: 'js_error',
      title: `JavaScript Error: ${webSeeData.message}`,
      message: webSeeData.message,
      details: logData.details,
      stack: logData.stack,
      url: logData.url,
      userAgent: logData.userAgent,
      ip: logData.ip,
      userId: logData.userId,
      userName: logData.userName,
      sessionId: logData.sessionId,
      requestId: logData.requestId,
      tags: logData.tags,
    });
  }

  /**
   * 处理 HTTP 请求错误
   */
  private async handleHttpError(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'error',
      source,
      category: 'api_error',
      message: `HTTP ${webSeeData.type.toUpperCase()} Error: ${webSeeData.message}`,
      details: {
        ...webSeeData.data,
        breadcrumb: webSeeData.breadcrumb,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      duration: webSeeData.duration,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        httpType: webSeeData.type,
      },
    };

    await this.loggingService.log(logData);
  }

  /**
   * 处理资源加载错误
   */
  private async handleResourceError(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'warn',
      source,
      category: 'js_error',
      message: `Resource Load Error: ${webSeeData.message}`,
      details: {
        ...webSeeData.data,
        breadcrumb: webSeeData.breadcrumb,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        resourceType: 'load_error',
      },
    };

    await this.loggingService.log(logData);
  }

  /**
   * 处理性能数据
   */
  private async handlePerformance(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    // 根据性能数据类型生成不同的消息
    let type = 'performance';
    let value: number | undefined;
    let duration: number | undefined;
    let name = webSeeData.name;
    
    // 处理不同类型的性能数据
    if (webSeeData.name) {
      switch (webSeeData.name) {
        case 'longTask':
          type = 'longTask';
          // 从 longTask.duration 提取 value，如果 duration 存在的话
          duration = webSeeData.longTask?.duration;
          value = duration; // 将 duration 作为 value 存储
          break;
        case 'FID':
        case 'firstInput':
          type = 'firstInput';
          value = webSeeData.value;
          break;
        case 'LCP':
        case 'largestContentfulPaint':
          type = 'largestContentfulPaint';
          value = webSeeData.value;
          break;
        case 'FCP':
        case 'firstContentfulPaint':
          type = 'firstContentfulPaint';
          value = webSeeData.value;
          break;
        case 'FP':
        case 'firstPaint':
          type = 'firstPaint';
          value = webSeeData.value;
          break;
        case 'CLS':
        case 'layoutShift':
          type = 'layoutShift';
          value = webSeeData.value;
          break;
        case 'TTFB':
          type = 'TTFB';
          value = webSeeData.value;
          break;
        case 'FSP':
          type = 'FSP';
          value = webSeeData.value;
          break;
        case 'memory':
          type = 'memory';
          value = webSeeData.value;
          break;
        case 'resourceList':
          type = 'resourceList';
          value = undefined;
          break;
        default:
          // 对于其他性能指标，尝试从多个字段获取值
          value = webSeeData.value;
          break;
      }
    }

    // 存储到性能数据表
    if (type === 'longTask' && duration && duration < 500) {
      console.debug(`Skipping long task with duration ${duration}ms (less than 500ms threshold)`);
      return;
    }

    await this.performanceService.record({
      source,
      type,
      name: name || type,
      value,
      duration,
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      deviceInfo: webSeeData.deviceInfo,
      pageUrl: webSeeData.pageUrl,
      time: webSeeData.time,
      status: webSeeData.status,
      sdkVersion: webSeeData.sdkVersion,
      uuid: webSeeData.uuid,
      details: {
        performance: webSeeData.performance,
        longTask: webSeeData.longTask,
        rating: webSeeData.rating,
        resourceList: webSeeData.resourceList,
        memory: webSeeData.memory,
        ...webSeeData.data,
        context: webSeeData.context,
        // 添加原始数据用于调试
        originalData: {
          name: webSeeData.name,
          value: webSeeData.value,
          rating: webSeeData.rating,
          data: webSeeData.data,
          performance: webSeeData.performance
        }
      },
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        performanceType: name || type,
        rating: webSeeData.rating || 'unknown'
      },
      apikey: webSeeData.apikey,
    });

    // 对于长任务，创建告警
    if (type === 'longTask' && duration && duration >= 500) {
      await this.alertingService.createAlert({
        level: 'warning',
        source,
        category: 'performance',
        title: 'Long Task Detected',
        message: `检测到长任务: ${duration}ms`,
        details: {
          longTask: webSeeData.longTask,
          deviceInfo: webSeeData.deviceInfo,
          pageUrl: webSeeData.pageUrl,
        },
        url: webSeeData.pageUrl || webSeeData.url,
        userAgent: webSeeData.userAgent,
        ip: webSeeData.ip,
        userId: webSeeData.userId,
        userName: webSeeData.userName,
        sessionId: webSeeData.sessionId,
        requestId: webSeeData.requestId,
        tags: {
          apikey: webSeeData.apikey,
          performanceType: 'longTask',
        },
      });
    }

    // 对于性能指标异常，创建告警
    if (value !== undefined && webSeeData.rating === 'poor') {
      let alertLevel = 'warning';
      let alertMessage = '';
      
      switch (type) {
        case 'largestContentfulPaint':
          if (value > 4000) {
            alertLevel = 'error';
            alertMessage = `LCP 性能异常: ${value}ms (超过4秒)`;
          } else {
            alertMessage = `LCP 性能较差: ${value}ms`;
          }
          break;
        case 'firstInput':
          if (value > 300) {
            alertLevel = 'error';
            alertMessage = `FID 性能异常: ${value}ms (超过300ms)`;
          } else {
            alertMessage = `FID 性能较差: ${value}ms`;
          }
          break;
        case 'layoutShift':
          if (value > 0.25) {
            alertLevel = 'error';
            alertMessage = `CLS 性能异常: ${value} (超过0.25)`;
          } else {
            alertMessage = `CLS 性能较差: ${value}`;
          }
          break;
        case 'firstContentfulPaint':
          if (value > 2000) {
            alertMessage = `FCP 性能较差: ${value}ms`;
          }
          break;
      }

      if (alertMessage) {
        await this.alertingService.createAlert({
          level: alertLevel as 'warning' | 'error',
          source,
          category: 'performance',
          title: 'Performance Issue Detected',
          message: alertMessage,
          details: {
            type,
            value,
            rating: webSeeData.rating,
            deviceInfo: webSeeData.deviceInfo,
            pageUrl: webSeeData.pageUrl,
          },
          url: webSeeData.pageUrl || webSeeData.url,
          userAgent: webSeeData.userAgent,
          ip: webSeeData.ip,
          userId: webSeeData.userId,
          userName: webSeeData.userName,
          sessionId: webSeeData.sessionId,
          requestId: webSeeData.requestId,
          tags: {
            apikey: webSeeData.apikey,
            performanceType: type,
          },
        });
      }
    }
  }

  /**
   * 处理用户行为
   */
  private async handleBehavior(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'info',
      source,
      category: 'behavior',
      message: `User Behavior: ${webSeeData.message}`,
      details: {
        ...webSeeData.data,
        breadcrumb: webSeeData.breadcrumb,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        behaviorType: 'user_action',
      },
    };

    await this.loggingService.log(logData);
  }

  /**
   * 处理白屏检测
   */
  private async handleWhiteScreen(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'warn',
      source,
      category: 'js_error',
      message: `White Screen Detected: ${webSeeData.message}`,
      details: {
        whiteScreen: webSeeData.whiteScreen,
        ...webSeeData.data,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        whiteScreenType: 'detection',
      },
    };

    await this.loggingService.log(logData);

    // 白屏检测创建告警
    await this.alertingService.createAlert({
      level: 'warning',
      source,
      category: 'js_error',
      title: 'White Screen Detected',
      message: webSeeData.message,
      details: logData.details,
      url: logData.url,
      userAgent: logData.userAgent,
      ip: logData.ip,
      userId: logData.userId,
      userName: logData.userName,
      sessionId: logData.sessionId,
      requestId: logData.requestId,
      tags: logData.tags,
    });
  }

  /**
   * 处理自定义数据
   */
  private async handleCustom(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'info',
      source,
      category: 'system',
      message: webSeeData.message,
      details: {
        ...webSeeData.data,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      duration: webSeeData.duration,
      memory: webSeeData.memory,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        customType: 'manual_report',
      },
    };

    await this.loggingService.log(logData);
  }

  /**
   * 处理录屏数据
   */
  private async handleRecordScreen(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'info',
      source,
      category: 'system',
      message: webSeeData.message || 'Record Screen Data',
      details: {
        ...webSeeData.data,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      // 录屏相关字段
      recordScreenId: webSeeData.recordScreenId,
      recordScreen: webSeeData.recordScreen ? JSON.stringify(webSeeData.recordScreen) : undefined,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        recordScreenType: 'screen_capture',
      },
    };

    await this.loggingService.log(logData);
  }

  /**
   * 处理未知类型数据
   */
  private async handleUnknown(webSeeData: WebSeeData, source: 'frontend' | 'admin'): Promise<void> {
    const logData: LogData = {
      level: 'info',
      source,
      category: 'system',
      message: webSeeData.message || `Unknown WebSee Type: ${webSeeData.type}`,
      details: {
        type: webSeeData.type,
        ...webSeeData.data,
        context: webSeeData.context,
      },
      url: webSeeData.url,
      userAgent: webSeeData.userAgent,
      ip: webSeeData.ip,
      userId: webSeeData.userId,
      userName: webSeeData.userName,
      sessionId: webSeeData.sessionId,
      requestId: webSeeData.requestId,
      tags: {
        ...webSeeData.tags,
        apikey: webSeeData.apikey,
        unknownType: webSeeData.type,
      },
    };

    await this.loggingService.log(logData);
  }
} 