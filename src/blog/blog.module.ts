import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Articles
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

// Categories
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

// Tags
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

// Gallery
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

// Gallery Categories
import { GalleryCategoriesController } from './gallery-categories.controller';
import { GalleryCategoriesService } from './gallery-categories.service';

// Interactions
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

// Sticky Notes
import { StickyNotesController } from './sticky-notes.controller';
import { StickyNotesService } from './sticky-notes.service';

// Diary
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';

// About
import { AboutController } from './about.controller';
import { AboutService } from './about.service';

// Search
import { SearchController } from './search.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ArticlesController,
    CategoriesController,
    TagsController,
    GalleryController,
    GalleryCategoriesController,
    InteractionsController,
    StickyNotesController,
    DiaryController,
    AboutController,
    SearchController,
  ],
  providers: [
    ArticlesService,
    CategoriesService,
    TagsService,
    GalleryService,
    GalleryCategoriesService,
    InteractionsService,
    StickyNotesService,
    DiaryService,
    AboutService,
  ],
  exports: [
    ArticlesService,
    CategoriesService,
    TagsService,
    GalleryService,
    GalleryCategoriesService,
    InteractionsService,
    StickyNotesService,
    DiaryService,
    AboutService,
  ],
})
export class BlogModule {} 