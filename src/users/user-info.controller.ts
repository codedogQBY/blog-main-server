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

  @Post('track')
  @Public()
  async track(@Body() dto: { fingerprint: string; userInfo: UserInfoDto }, @Request() req) {
    // 自动获取IP地址
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
    
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