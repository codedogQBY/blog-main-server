import { Controller, Get, Post, Body } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Public } from './auth/public.decorator';
import { SiteConfig } from './types/site-config';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Public()
  @Get()
  async getSiteConfig(): Promise<{ data: SiteConfig }> {
    const config = await this.systemConfigService.getSiteConfig();
    return { data: config };
  }

  @Post()
  async updateSiteConfig(@Body() config: Partial<SiteConfig>): Promise<{ data: SiteConfig }> {
    const updatedConfig = await this.systemConfigService.setSiteConfig(config);
    return { data: updatedConfig };
  }
} 