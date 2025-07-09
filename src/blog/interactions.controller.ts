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
import { Permissions } from '../common/permissions.decorator';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post('like')
  @Public()
  async toggleLike(@Body() dto: ToggleLikeDto, @Request() req) {
    // 自动获取IP地址
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    // 如果前端没有传递IP，使用后端获取的IP
    if (!dto.userInfo.ipAddress) {
      dto.userInfo.ipAddress = ip;
    }
    
    return this.interactionsService.toggleLike(dto);
  }

  @Post('comment')
  @Public()
  async createComment(@Body() dto: CreateCommentDto, @Request() req) {
    // 自动获取IP地址
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
    // 如果前端没有传递IP，使用后端获取的IP
    if (!dto.userInfo.ipAddress) {
      dto.userInfo.ipAddress = ip;
    }
    
    return this.interactionsService.createComment(dto);
  }

  @Get('comments')
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
  @Permissions('interaction.read')
  async getAdminLikes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
  ) {
    return this.interactionsService.getAdminLikes({
      page: +page,
      limit: +limit,
      targetType,
      targetId,
    });
  }

  @Get('admin/comments')
  @UseGuards(JwtAuthGuard)
  @Permissions('interaction.read')
  async getAdminComments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('search') search?: string,
  ) {
    return this.interactionsService.getAdminComments({
      page: +page,
      limit: +limit,
      targetType,
      targetId,
      search,
    });
  }

  @Delete('admin/comments/:id')
  @UseGuards(JwtAuthGuard)
  @Permissions('interaction.delete')
  async deleteComment(@Param('id') id: string) {
    return this.interactionsService.deleteComment(id, 'admin');
  }

  @Delete('admin/likes/:id')
  @UseGuards(JwtAuthGuard)
  @Permissions('interaction.delete')
  async deleteLike(@Param('id') id: string) {
    return this.interactionsService.deleteLike(id, 'admin');
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @Permissions('interaction.read')
  async getAdminStats() {
    return this.interactionsService.getAdminStats();
  }
} 