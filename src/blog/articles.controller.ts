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
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.create')
  create(@Body() createArticleDto: CreateArticleDto, @Request() req) {
    return this.articlesService.create(createArticleDto, req.user.sub);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.read')
  async findAllForAdmin(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('title') title?: string,
    @Query('categoryId') categoryId?: string,
    @Query('published') published?: string,
  ) {
    let categorySlug: string | undefined;
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { slug: true }
      });
      categorySlug = category?.slug;
    }

    return this.articlesService.findAllForAdmin({
      page: parseInt(page),
      limit: parseInt(pageSize),
      search: title,
      category: categorySlug,
      published: published ? published === 'true' : undefined,
    });
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
    @Query('published') published?: string,
  ) {
    return this.articlesService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category,
      tag,
      published: published ? published === 'true' : undefined,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.update')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.delete')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  @Post(':id/views')
  @Public()
  incrementViews(@Param('id') id: string) {
    return this.articlesService.incrementViews(id);
  }

  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('article.read')
  findOneById(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Get(':slug')
  @Public()
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOneBySlug(slug);
  }
} 