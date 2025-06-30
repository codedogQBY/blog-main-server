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
import { GalleryService } from './gallery.service';
import {
  CreateGalleryDto,
  UpdateGalleryDto,
  GetGalleriesDto,
  BatchGalleryOperationDto,
  CreateGalleryFromFilesDto,
} from './dto/gallery.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { Public } from '../auth/public.decorator';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // 公开接口 - 获取图集列表（前台）
  @Public()
  @Get()
  async findAll(@Query() query: GetGalleriesDto) {
    return this.galleryService.findAll(query);
  }

  // 公开接口 - 获取图集详情（前台）
  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  // 公开接口 - 获取所有标签
  @Public()
  @Get('tags/all')
  async getAllTags() {
    return this.galleryService.getAllTags();
  }

  // 管理员接口 - 获取图集列表
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.read')
  @Get('admin/list')
  async findAllForAdmin(@Query() query: GetGalleriesDto) {
    return this.galleryService.findAllForAdmin(query);
  }

  // 管理员接口 - 获取图集详情
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.read')
  @Get('admin/:id')
  async findOneForAdmin(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  // 管理员接口 - 创建图集
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.create')
  @Post('admin')
  async create(@Body() createGalleryDto: CreateGalleryDto) {
    return this.galleryService.create(createGalleryDto);
  }

  // 管理员接口 - 从文件创建图集
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.create')
  @Post('admin/from-files')
  async createFromFiles(@Body() createFromFilesDto: CreateGalleryFromFilesDto) {
    return this.galleryService.createFromFiles(createFromFilesDto);
  }

  // 管理员接口 - 更新图集
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.update')
  @Patch('admin/:id')
  async update(
    @Param('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ) {
    return this.galleryService.update(id, updateGalleryDto);
  }

  // 管理员接口 - 删除图集
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.delete')
  @Delete('admin/:id')
  async remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }

  // 管理员接口 - 批量操作
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('gallery.update', 'gallery.delete')
  @Post('admin/batch')
  async batchOperation(@Body() batchDto: BatchGalleryOperationDto) {
    return this.galleryService.batchOperation(batchDto);
  }
}