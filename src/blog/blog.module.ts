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
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController, 
    CategoriesController, 
    TagsController,
    InteractionsController,
    StickyNotesController
  ],
  providers: [
    ArticlesService, 
    CategoriesService, 
    TagsService,
    InteractionsService,
    StickyNotesService
  ],
  exports: [ArticlesService, CategoriesService, TagsService, StickyNotesService],
})
export class BlogModule {} 