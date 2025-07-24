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
  private getClientIp(req: any): string {
    // 优先从代理头获取真实IP
    const xForwardedFor = req.headers?.['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map(ip => ip.trim());
      return ips[0] || 'unknown';
    }
    
    // 从其他代理头获取
    const xRealIp = req.headers?.['x-real-ip'] as string;
    if (xRealIp) {
      return xRealIp;
    }
    
    // 从CF-Connecting-IP获取（Cloudflare）
    const cfConnectingIp = req.headers?.['cf-connecting-ip'] as string;
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    // 从X-Forwarded-For获取
    const xForwarded = req.headers?.['x-forwarded'] as string;
    if (xForwarded) {
      return xForwarded;
    }
    
    // 最后使用Express的ip属性或连接地址
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  }

  @Post('like')
  @Public()
  async toggleLike(@Body() dto: ToggleLikeDto, @Request() req) {
    // 使用改进的IP获取方法
    const ip = this.getClientIp(req);
    
    // 如果前端没有传递IP，使用后端获取的IP
    if (!dto.userInfo.ipAddress) {
      dto.userInfo.ipAddress = ip;
    }
    
    return this.interactionsService.toggleLike(dto);
  }

  @Post('comment')
  @Public()
  async createComment(@Body() dto: CreateCommentDto, @Request() req) {
    // 使用改进的IP获取方法
    const ip = this.getClientIp(req);
    
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
    const ip = this.getClientIp(req);
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