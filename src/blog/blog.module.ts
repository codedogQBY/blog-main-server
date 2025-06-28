import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { CategoriesController } from './categories.controller';
import { TagsController } from './tags.controller';
import { ArticlesService } from './articles.service';
import { CategoriesService } from './categories.service';
import { TagsService } from './tags.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController, CategoriesController, TagsController],
  providers: [ArticlesService, CategoriesService, TagsService],
  exports: [ArticlesService, CategoriesService, TagsService],
})
export class BlogModule {} 