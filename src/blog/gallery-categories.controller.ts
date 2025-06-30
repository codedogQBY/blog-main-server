import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GalleryCategoriesService } from './gallery-categories.service';
import {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
  GetGalleryCategoriesDto,
} from './dto/gallery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/permissions.decorator';
import { Public } from '../auth/public.decorator';

@Controller('gallery-categories')
export class GalleryCategoriesController {
  constructor(
    private readonly galleryCategoriesService: GalleryCategoriesService,
  ) {}

  // 公开接口：获取图库分类列表（前台使用）
  @Public()
  @Get()
  async findAll(@Query() query: GetGalleryCategoriesDto) {
    return this.galleryCategoriesService.findAll(query);
  }

  // 公开接口：获取分类统计
  @Public()
  @Get('stats')
  async getStats() {
    return this.galleryCategoriesService.getStats();
  }

  // 管理员接口：获取管理员统计
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  @Permissions('gallery.category.read')
  async getAdminStats() {
    return await this.galleryCategoriesService.getAdminStats();
  }

  // 管理员接口：获取所有分类列表（包括禁用的）
  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @Permissions('gallery.category.read')
  async findAllAdmin(@Query() query: GetGalleryCategoriesDto) {
    return this.galleryCategoriesService.findAll({
      ...query,
      enabledOnly: false,
      includeStats: true,
    });
  }

  // 管理员接口：创建分类
  @Post('admin')
  @UseGuards(JwtAuthGuard)
  @Permissions('gallery.category.create')
  async create(@Body() createGalleryCategoryDto: CreateGalleryCategoryDto) {
    return this.galleryCategoriesService.create(createGalleryCategoryDto);
  }

  // 管理员接口：更新分类
  @Patch('admin/:name')
  @UseGuards(JwtAuthGuard)
  @Permissions('gallery.category.update')
  async update(
    @Param('name') name: string,
    @Body() updateGalleryCategoryDto: UpdateGalleryCategoryDto,
  ) {
    return this.galleryCategoriesService.update(name, updateGalleryCategoryDto);
  }

  // 管理员接口：删除分类
  @Delete('admin/:name')
  @UseGuards(JwtAuthGuard)
  @Permissions('gallery.category.delete')
  async remove(@Param('name') name: string) {
    await this.galleryCategoriesService.remove(name);
    return { message: '分类删除成功' };
  }

  // 公开接口：获取单个分类
  @Public()
  @Get(':name')
  async findOne(@Param('name') name: string) {
    const category = await this.galleryCategoriesService.findByName(name);
    if (!category) {
      throw new Error('分类不存在');
    }
    return category;
  }
} 