import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AboutService } from './about.service';
import {
  CreateAboutDto,
  UpdateAboutDto,
  CreateAboutTagDto,
  UpdateAboutTagDto,
  CreateAboutSectionDto,
  UpdateAboutSectionDto,
  CreateAboutImageDto,
  UpdateAboutImageDto,
  BatchCreateAboutTagDto,
  BatchCreateAboutImageDto,
} from './dto/about.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RequirePermissions } from '../rbac/permissions.decorator';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  // 前台接口：获取关于页面配置
  @Public()
  @Get('config')
  async getAboutConfig() {
    return this.aboutService.getAboutConfig();
  }

  // 管理端接口：获取所有关于页面配置
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.read')
  @Get()
  async findAll() {
    return this.aboutService.findAll();
  }

  // 管理端接口：创建关于页面配置
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.create')
  @Post()
  async create(@Body() createAboutDto: CreateAboutDto) {
    return this.aboutService.create(createAboutDto);
  }

  // 管理端接口：获取单个关于页面配置
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.read')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.aboutService.findOne(id);
  }

  // 管理端接口：更新关于页面配置
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.update')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAboutDto: UpdateAboutDto) {
    return this.aboutService.update(id, updateAboutDto);
  }

  // 管理端接口：删除关于页面配置
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.delete')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.aboutService.remove(id);
  }

  // 标签管理
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.tag.create')
  @Post('tags')
  async createTag(@Body() createAboutTagDto: CreateAboutTagDto) {
    return this.aboutService.createTag(createAboutTagDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.tag.update')
  @Patch('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body() updateAboutTagDto: UpdateAboutTagDto,
  ) {
    return this.aboutService.updateTag(id, updateAboutTagDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.tag.delete')
  @Delete('tags/:id')
  async removeTag(@Param('id') id: string) {
    return this.aboutService.removeTag(id);
  }

  // 批量创建标签
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.tag.create')
  @Post(':aboutId/tags/batch')
  async createTags(
    @Param('aboutId') aboutId: string,
    @Body() batchCreateAboutTagDto: BatchCreateAboutTagDto,
  ) {
    return this.aboutService.createTags(aboutId, batchCreateAboutTagDto.tags);
  }

  // 章节管理
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.section.create')
  @Post('sections')
  async createSection(@Body() createAboutSectionDto: CreateAboutSectionDto) {
    return this.aboutService.createSection(createAboutSectionDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.section.update')
  @Patch('sections/:id')
  async updateSection(
    @Param('id') id: string,
    @Body() updateAboutSectionDto: UpdateAboutSectionDto,
  ) {
    return this.aboutService.updateSection(id, updateAboutSectionDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.section.delete')
  @Delete('sections/:id')
  async removeSection(@Param('id') id: string) {
    return this.aboutService.removeSection(id);
  }

  // 图片管理
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.image.create')
  @Post('images')
  async createImage(@Body() createAboutImageDto: CreateAboutImageDto) {
    return this.aboutService.createImage(createAboutImageDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.image.update')
  @Patch('images/:id')
  async updateImage(
    @Param('id') id: string,
    @Body() updateAboutImageDto: UpdateAboutImageDto,
  ) {
    return this.aboutService.updateImage(id, updateAboutImageDto);
  }

  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.image.delete')
  @Delete('images/:id')
  async removeImage(@Param('id') id: string) {
    return this.aboutService.removeImage(id);
  }

  // 批量创建图片
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('about.image.create')
  @Post('sections/:sectionId/images/batch')
  async createImages(
    @Param('sectionId') sectionId: string,
    @Body() batchCreateAboutImageDto: BatchCreateAboutImageDto,
  ) {
    return this.aboutService.createImages(
      sectionId,
      batchCreateAboutImageDto.images,
    );
  }
} 