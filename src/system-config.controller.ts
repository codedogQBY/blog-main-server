import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Public } from './auth/public.decorator';
import { SiteConfig } from './types/site-config';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './common/permissions.guard';
import { Permissions } from './common/permissions.decorator';

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('system.config.update')
  async updateSiteConfig(@Body() config: Partial<SiteConfig>): Promise<{ data: SiteConfig }> {
    const updatedConfig = await this.systemConfigService.setSiteConfig(config);
    return { data: updatedConfig };
  }
} 