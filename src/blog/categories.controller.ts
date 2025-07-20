import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { Public } from '../auth/public.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequirePermissions('category.create')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('withPublishedArticles') withPublishedArticles?: string,
  ) {
    return this.categoriesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status: status || 'enabled',
      withPublishedArticles: withPublishedArticles === 'true',
    });
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @RequirePermissions('category.update')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @RequirePermissions('category.delete')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // 管理后台专用接口 - 支持查看所有状态的分类
  @Get('admin/list')
  @RequirePermissions('category.read')
  findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.categoriesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status, // 管理后台可以查看所有状态
    });
  }
} 