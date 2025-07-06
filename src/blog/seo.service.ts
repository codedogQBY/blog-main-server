import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(private configService: ConfigService) {}

  /**
   * 提交URL到百度站长平台
   */
  async submitToBaidu(urls: string[]): Promise<boolean> {
    try {
      const baiduToken = this.configService.get<string>('BAIDU_SEO_TOKEN');
      if (!baiduToken) {
        this.logger.warn('百度SEO Token未配置');
        return false;
      }

      const response = await axios.post(
        `http://data.zz.baidu.com/urls?site=${this.configService.get<string>('SITE_URL')}&token=${baiduToken}`,
        urls.join('\n'),
        {
          headers: {
            'Content-Type': 'text/plain',
          },
        }
      );

      this.logger.log(`百度提交结果: ${JSON.stringify(response.data)}`);
      return response.data.success > 0;
    } catch (error) {
      this.logger.error('提交到百度失败:', error.message);
      return false;
    }
  }

  /**
   * 提交URL到Google Search Console
   */
  async submitToGoogle(urls: string[]): Promise<boolean> {
    try {
      const googleToken = this.configService.get<string>('GOOGLE_SEO_TOKEN');
      if (!googleToken) {
        this.logger.warn('Google SEO Token未配置');
        return false;
      }

      // Google Search Console API需要更复杂的认证，这里简化处理
      // 实际使用时需要配置OAuth2认证
      this.logger.log(`Google提交URLs: ${urls.join(', ')}`);
      return true;
    } catch (error) {
      this.logger.error('提交到Google失败:', error.message);
      return false;
    }
  }

  /**
   * 批量提交URL到搜索引擎
   */
  async submitUrls(urls: string[]): Promise<{
    baidu: boolean;
    google: boolean;
  }> {
    if (!urls || urls.length === 0) {
      return { baidu: false, google: false };
    }

    const [baiduResult, googleResult] = await Promise.allSettled([
      this.submitToBaidu(urls),
      this.submitToGoogle(urls),
    ]);

    return {
      baidu: baiduResult.status === 'fulfilled' ? baiduResult.value : false,
      google: googleResult.status === 'fulfilled' ? googleResult.value : false,
    };
  }

  /**
   * 生成文章URL
   */
  generateArticleUrl(slug: string): string {
    const siteUrl = this.configService.get<string>('SITE_URL', 'https://yourdomain.com');
    return `${siteUrl}/blog/${slug}`;
  }
} 