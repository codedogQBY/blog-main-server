import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  @Post('generate-slug')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.create')
  async generateSlug(@Body() body: { title: string; content?: string }) {
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('标题不能为空');
    }

    const slug = await this.aiService.generateSlug(title.trim());

    return {
      success: true,
      data: {
        title: title.trim(),
        slug,
        confidence: 0.9,
      },
    };
  }

  @Post('generate-excerpt')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.create')
  async generateExcerpt(@Body() body: { title: string; content: string }) {
    const { title, content } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('标题不能为空');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('内容不能为空');
    }

    const excerpt = await this.aiService.generateExcerpt(title.trim(), content.trim());

    return {
      success: true,
      data: {
        excerpt,
        confidence: 0.9,
      },
    };
  }

  @Post('generate-seo')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.create')
  async generateSEO(@Body() body: { title: string; content: string }) {
    const { title, content } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('标题不能为空');
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('内容不能为空');
    }

    const seoContent = await this.aiService.generateSEOContent(title.trim(), content.trim());

    return {
      success: true,
      data: {
        ...seoContent,
        confidence: 0.9,
      },
    };
  }
} 