import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { StickyNotesController } from './sticky-notes.controller';
import { StickyNotesService } from './sticky-notes.service';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController, 
    CategoriesController, 
    TagsController,
    InteractionsController,
    StickyNotesController,
    DiaryController
  ],
  providers: [
    ArticlesService, 
    CategoriesService, 
    TagsService,
    InteractionsService,
    StickyNotesService,
    DiaryService
  ],
  exports: [ArticlesService, CategoriesService, TagsService, StickyNotesService, DiaryService],
})
export class BlogModule {} 