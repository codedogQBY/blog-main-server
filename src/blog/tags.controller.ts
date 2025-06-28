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
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import { Public } from '../auth/public.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('tag.create')
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('tag.read')
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('color') color?: string,
  ) {
    // 优先使用pageSize，如果没有则使用limit，最后默认为10
    const finalLimit = pageSize || limit || '10';
    
    return this.tagsService.findAll({
      page: parseInt(page),
      limit: parseInt(finalLimit),
      search,
      color,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('tag.read')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('tag.update')
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('tag.delete')
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
} 