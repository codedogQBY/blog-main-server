import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController, 
    CategoriesController, 
    TagsController,
    InteractionsController
  ],
  providers: [
    ArticlesService, 
    CategoriesService, 
    TagsService,
    InteractionsService
  ],
  exports: [ArticlesService, CategoriesService, TagsService],
})
export class BlogModule {} 