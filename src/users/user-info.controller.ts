import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  NotFoundException,
  Request,
} from '@nestjs/common';
import { UserInfoService } from './user-info.service';
import { Permissions } from '../common/permissions.decorator';
import { PermissionsGuard } from '../common/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../auth/public.decorator';
import { UserInfoDto } from '../blog/dto/interaction.dto';

@Controller('user-info')
export class UserInfoController {
  constructor(private readonly userInfoService: UserInfoService) {}

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

  @Post('track')
  @Public()
  async track(@Body() dto: { fingerprint: string; userInfo: UserInfoDto }, @Request() req) {
    // 使用改进的IP获取方法
    const ip = this.getClientIp(req);
    
    // 如果前端没有传递IP，使用后端获取的IP
    if (!dto.userInfo.ipAddress) {
      dto.userInfo.ipAddress = ip;
    }
    
    return this.userInfoService.track(dto.fingerprint, dto.userInfo);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.read')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('deviceType') deviceType?: string,
    @Query('browserName') browserName?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.userInfoService.findAll(pageNum, limitNum, search, {
      country,
      deviceType,
      browserName,
    });
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.read')
  async getStats() {
    return this.userInfoService.getStats();
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.read')
  async exportCsv(
    @Query('search') search?: string,
    @Query('country') country?: string,
    @Query('deviceType') deviceType?: string,
    @Query('browserName') browserName?: string,
  ) {
    return this.userInfoService.exportCsv({
      search,
      country,
      deviceType,
      browserName,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.read')
  async findOne(@Param('id') id: string) {
    const userInfo = await this.userInfoService.findOne(id);
    if (!userInfo) {
      throw new NotFoundException('游客信息不存在');
    }
    return userInfo;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.update')
  async update(
    @Param('id') id: string,
    @Body() dto: {
      nickname?: string;
      email?: string;
      country?: string;
      region?: string;
      city?: string;
    },
  ) {
    const userInfo = await this.userInfoService.findOne(id);
    if (!userInfo) {
      throw new NotFoundException('游客信息不存在');
    }

    return this.userInfoService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('userinfo.delete')
  async remove(@Param('id') id: string) {
    const userInfo = await this.userInfoService.findOne(id);
    if (!userInfo) {
      throw new NotFoundException('游客信息不存在');
    }

    return this.userInfoService.remove(id);
  }
} 