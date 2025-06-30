import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { InteractionsService } from './interactions.service';
import { ToggleLikeDto, CreateCommentDto, GetCommentsDto, GetStatsDto } from './dto/interaction.dto';
import { Public } from '../auth/public.decorator';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('like')
  @Public()
  async toggleLike(@Body() dto: ToggleLikeDto) {
    return this.interactionsService.toggleLike(dto);
  }

  @Post('comment')
  @Public()
  async createComment(@Body() dto: CreateCommentDto) {
    return this.interactionsService.createComment(dto);
  }

  @Get('comment')
  @Public()
  async getComments(@Query() dto: GetCommentsDto) {
    return this.interactionsService.getComments(dto);
  }

  @Get('stats')
  @Public()
  async getStats(@Query() dto: GetStatsDto) {
    return this.interactionsService.getInteractionStats(dto);
  }

  @Get('location')
  @Public()
  async getLocation(@Request() req) {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.interactionsService.getUserLocation(ip);
  }

  // 管理接口
  @Get('admin/likes')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('interaction.read')
  async getAdminLikes(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.interactionsService.getAdminLikes({
      page: parseInt(page),
      limit: parseInt(limit),
      targetType,
      targetId,
    });
  }

  @Get('admin/comments')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('interaction.read')
  async getAdminComments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('search') search?: string,
  ) {
    return this.interactionsService.getAdminComments({
      page: parseInt(page),
      limit: parseInt(limit),
      targetType,
      targetId,
      search,
    });
  }

  @Delete('admin/comments/:id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('interaction.delete')
  async deleteComment(@Param('id') id: string, @Request() req) {
    return this.interactionsService.deleteComment(id, req.user.sub);
  }

  @Delete('admin/likes/:id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('interaction.delete')
  async deleteLike(@Param('id') id: string, @Request() req) {
    return this.interactionsService.deleteLike(id, req.user.sub);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('interaction.read')
  async getAdminStats() {
    return this.interactionsService.getAdminStats();
  }
} 