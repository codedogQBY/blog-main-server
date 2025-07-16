import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { SiteConfig } from './types/site-config';

@Injectable()
export class SystemConfigService {
  private defaultConfig: SiteConfig = {
    title: '码上拾光',
    subtitle: '在代码间打捞落日余辉',
    description: '在代码间打捞落日余辉',
    icpNumber: '',
    wechatQrcode: '',
    startTime: '2024',
    englishTitle: 'Code Shine',
    heroTitle: {
      first: 'CODE',
      second: 'SHINE'
    },
    socialLinks: {
      github: '',
      email: ''
    },
    seoDefaults: {
      title: '码上拾光',
      description: '在代码间打捞落日余辉',
      keywords: ['技术博客', '编程', '前端', '后端']
    }
  };

  constructor(private prisma: PrismaService) {}

  async getSiteConfig(): Promise<SiteConfig> {
    const config = await this.prisma.systemConfig.findFirst({
      where: { key: 'siteConfig' }
    });

    if (!config) {
      return this.defaultConfig;
    }

    return JSON.parse(config.value);
  }

  async setSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfig> {
    const currentConfig = await this.getSiteConfig();
    const newConfig = { ...currentConfig, ...config };

    await this.prisma.systemConfig.upsert({
      where: { key: 'siteConfig' },
      create: {
        key: 'siteConfig',
        value: JSON.stringify(newConfig)
      },
      update: {
        value: JSON.stringify(newConfig)
      }
    });

    return newConfig;
  }
} 