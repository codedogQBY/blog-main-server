import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ZhipuResponse {
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ZHIPU_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('ZHIPU_API_KEY 未配置，AI功能将不可用');
    }
  }

  /**
   * 根据标题生成SEO友好的slug
   * @param title 文章标题
   * @returns 生成的slug
   */
  async generateSlug(title: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置');
    }

    try {
      const prompt = `请根据以下中文文章标题生成一个SEO友好的英文slug（URL友好的标识符）。

要求：
1. 只使用英文字母、数字和连字符
2. 全部小写
3. 长度控制在50个字符以内
4. 保持标题的核心含义
5. 适合作为URL的一部分

标题：${title}

请只返回生成的slug，不要包含任何其他文字或解释。`;

      const response = await this.callZhipuAPI(prompt);

      if (response?.choices?.[0]?.message?.content) {
        const generatedSlug = response.choices[0].message.content.trim();

        // 清理和验证生成的slug
        const cleanSlug = this.cleanSlug(generatedSlug);

        return cleanSlug;
      }

      throw new Error('AI服务返回空响应');
    } catch {
      // 如果AI服务失败，回退到本地生成方法
      return this.generateFallbackSlug(title);
    }
  }

  /**
   * 根据标题和内容生成文章摘要
   * @param title 文章标题
   * @param content 文章内容
   * @returns 生成的摘要
   */
  async generateExcerpt(title: string, content: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置');
    }

    try {
      const prompt = `请根据以下文章标题和内容生成一个简洁的文章摘要。

要求：
1. 摘要长度控制在150-200字之间
2. 突出文章的核心观点和主要内容
3. 语言简洁明了，易于理解
4. 适合用于文章预览和SEO描述
5. 不要包含HTML标签

标题：${title}
内容：${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}

请只返回生成的摘要，不要包含任何其他文字或解释。`;

      const response = await this.callZhipuAPI(prompt);

      if (response?.choices?.[0]?.message?.content) {
        const generatedExcerpt = response.choices[0].message.content.trim();
        
        // 限制摘要长度
        const cleanExcerpt = this.cleanExcerpt(generatedExcerpt);

        return cleanExcerpt;
      }

      throw new Error('AI服务返回空响应');
    } catch {
      // 如果AI服务失败，回退到本地生成方法
      return this.generateFallbackExcerpt(title, content);
    }
  }

  /**
   * 根据标题和内容生成SEO优化内容
   * @param title 文章标题
   * @param content 文章内容
   * @returns 生成的SEO内容
   */
  async generateSEOContent(title: string, content: string): Promise<{
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }> {
    if (!this.apiKey) {
      throw new Error('ZHIPU_API_KEY 未配置');
    }

    try {
      const prompt = `请根据以下文章标题和内容生成SEO优化内容。

要求：
1. metaTitle: 60个字符以内，突出核心关键词
2. metaDescription: 150-160个字符，描述文章主要内容
3. metaKeywords: 3-5个关键词，用逗号分隔
4. 内容要吸引用户点击，同时符合搜索引擎优化要求
5. 不要包含HTML标签
6. 必须严格按照JSON格式返回，不要包含任何其他字符

标题：${title}
内容：${content.substring(0, 800)}${content.length > 800 ? '...' : ''}

请只返回JSON格式：
{"metaTitle":"SEO标题","metaDescription":"SEO描述","metaKeywords":"关键词1,关键词2,关键词3"}`;

      const response = await this.callZhipuAPI(prompt);

      if (response?.choices?.[0]?.message?.content) {
        let content = response.choices[0].message.content.trim();
        
        // 尝试清理可能的markdown格式
        content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        
        try {
          const seoContent = JSON.parse(content);
          
          // 验证和清理SEO内容
          const cleanSEOContent = this.cleanSEOContent(seoContent);

          return cleanSEOContent;
        } catch {
          throw new Error('AI返回的SEO内容格式错误');
        }
      }

      throw new Error('AI服务返回空响应');
    } catch {
      // 如果AI服务失败，回退到本地生成方法
      return this.generateFallbackSEOContent(title, content);
    }
  }

  /**
   * 调用智谱API
   * @param prompt 提示词
   * @returns API响应
   */
  private async callZhipuAPI(prompt: string): Promise<ZhipuResponse> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const body = {
      model: 'glm-4-flash-250414', // 使用智谱GLM-4模型
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // 较低的温度以获得更一致的输出
      max_tokens: 100,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`智谱API调用失败: ${response.status} ${errorText}`);
    }

    return (await response.json()) as ZhipuResponse;
  }

  /**
   * 清理和验证生成的slug
   * @param slug 原始slug
   * @returns 清理后的slug
   */
  private cleanSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // 只保留字母、数字和连字符
      .replace(/-+/g, '-') // 将多个连字符替换为单个
      .replace(/^-|-$/g, '') // 移除开头和结尾的连字符
      .substring(0, 50); // 限制长度
  }

  /**
   * 清理和验证生成的摘要
   * @param excerpt 原始摘要
   * @returns 清理后的摘要
   */
  private cleanExcerpt(excerpt: string): string {
    return excerpt
      .replace(/<[^>]+>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 规范化空白字符
      .trim()
      .substring(0, 200); // 限制长度
  }

  /**
   * 清理和验证SEO内容
   * @param seoContent SEO内容对象
   * @returns 清理后的SEO内容
   */
  private cleanSEOContent(seoContent: any): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    return {
      metaTitle: (seoContent.metaTitle || '').substring(0, 60),
      metaDescription: (seoContent.metaDescription || '').substring(0, 160),
      metaKeywords: (seoContent.metaKeywords || '').substring(0, 100),
    };
  }

  /**
   * 回退的摘要生成方法（当AI服务不可用时使用）
   * @param title 标题
   * @param content 内容
   * @returns 生成的摘要
   */
  private generateFallbackExcerpt(title: string, content: string): string {
    // 移除HTML标签
    const plainText = content.replace(/<[^>]+>/g, '');
    
    // 提取前200个字符作为摘要
    let excerpt = plainText.substring(0, 200);
    
    // 如果内容被截断，添加省略号
    if (plainText.length > 200) {
      excerpt += '...';
    }
    
    return excerpt;
  }

  /**
   * 回退的SEO内容生成方法（当AI服务不可用时使用）
   * @param title 标题
   * @param content 内容
   * @returns 生成的SEO内容
   */
  private generateFallbackSEOContent(title: string, content: string): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    // 移除HTML标签
    const plainText = content.replace(/<[^>]+>/g, '');
    
    // 生成metaTitle
    const metaTitle = title.substring(0, 60);
    
    // 生成metaDescription
    const metaDescription = plainText.substring(0, 160);
    
    // 生成metaKeywords（简单的关键词提取）
    const keywords = this.extractKeywords(title + ' ' + plainText);
    
    return {
      metaTitle,
      metaDescription,
      metaKeywords: keywords.join(','),
    };
  }

  /**
   * 简单的关键词提取
   * @param text 文本内容
   * @returns 关键词数组
   */
  private extractKeywords(text: string): string[] {
    // 移除HTML标签和特殊字符
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '');
    
    // 简单的关键词提取逻辑
    const words = cleanText.split(/\s+/);
    const keywordMap = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 1) {
        keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
      }
    });
    
    // 按频率排序，取前5个
    return Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * 回退的slug生成方法（当AI服务不可用时使用）
   * @param title 标题
   * @returns 生成的slug
   */
  private generateFallbackSlug(title: string): string {
    // 简单的拼音转换映射（常用字）
    const pinyinMap: { [key: string]: string } = {
      '的': 'de', '是': 'shi', '在': 'zai', '有': 'you', '和': 'he', '与': 'yu',
      '或': 'huo', '但': 'dan', '而': 'er', '如果': 'ru-guo', '因为': 'yin-wei',
      '所以': 'suo-yi', '然后': 'ran-hou', '首先': 'shou-xian', '最后': 'zui-hou',
      '开始': 'kai-shi', '结束': 'jie-shu', '学习': 'xue-xi', '工作': 'gong-zuo',
      '生活': 'sheng-huo', '技术': 'ji-shu', '开发': 'kai-fa', '设计': 'she-ji',
      '管理': 'guan-li', '系统': 'xi-tong', '应用': 'ying-yong', '服务': 'fu-wu',
      '数据': 'shu-ju', '信息': 'xin-xi', '网络': 'wang-luo', '安全': 'an-quan',
      '性能': 'xing-neng', '优化': 'you-hua', '测试': 'ce-shi', '部署': 'bu-shu',
    };

    let processedTitle = title;

    // 替换常见的中文字词
    Object.entries(pinyinMap).forEach(([chinese, pinyin]) => {
      processedTitle = processedTitle.replace(new RegExp(chinese, 'g'), pinyin);
    });

    // 移除剩余的中文字符和其他特殊字符
    return processedTitle
      .toLowerCase()
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/[^\w-]/g, '') // 只保留字母、数字和连字符
      .replace(/-+/g, '-') // 多个连字符替换为单个
      .replace(/^-|-$/g, '') // 移除开头和结尾的连字符
      .substring(0, 50);
  }
} 