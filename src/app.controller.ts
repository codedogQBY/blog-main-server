import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'blog-api'
    };
  }

  @Public()
  @Get('api/health')
  apiHealthCheck() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'blog-api'
    };
  }
}
