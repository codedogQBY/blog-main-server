import { Controller, Post, Get, Body, Query, ValidationPipe, UsePipes, Req } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { ToggleLikeDto, CreateCommentDto, GetCommentsDto, GetStatsDto } from './dto/interaction.dto';
import { Request } from 'express';

@Controller('api/interactions')
@UsePipes(new ValidationPipe({ transform: true }))
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  // 切换点赞状态
  @Post('like')
  async toggleLike(@Body() dto: ToggleLikeDto) {
    return await this.interactionsService.toggleLike(dto);
  }

  // 获取点赞状态
  @Get('like')
  async getLikeStatus(
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
    @Query('fingerprint') fingerprint: string,
  ) {
    return await this.interactionsService.getLikeStatus(targetType, targetId, fingerprint);
  }

  // 创建评论
  @Post('comment')
  async createComment(@Body() dto: CreateCommentDto) {
    return await this.interactionsService.createComment(dto);
  }

  // 获取评论列表
  @Get('comment')
  async getComments(@Query() dto: GetCommentsDto) {
    return await this.interactionsService.getComments(dto);
  }

  // 获取交互统计
  @Get('stats')
  async getInteractionStats(@Query() dto: GetStatsDto) {
    return await this.interactionsService.getInteractionStats(dto);
  }

  @Get('location')
  async getUserLocation(@Req() request: Request, @Query('ip') ip?: string) {
    return this.interactionsService.getUserLocation(ip || this.getClientIp(request));
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      '127.0.0.1'
    );
  }
} 