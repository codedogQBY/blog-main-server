import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ArticlesService } from './articles.service';
import { InteractionsService } from './interactions.service';
import { DiaryService } from './diary.service';
import { GalleryService } from './gallery.service';
import { DashboardController } from './dashboard.controller';

// Articles
import { ArticlesController } from './articles.controller';

// Categories
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

// Tags
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

// Gallery
import { GalleryController } from './gallery.controller';

// Gallery Categories
import { GalleryCategoriesController } from './gallery-categories.controller';
import { GalleryCategoriesService } from './gallery-categories.service';

// Sticky Notes
import { StickyNotesController } from './sticky-notes.controller';
import { StickyNotesService } from './sticky-notes.service';

// Diary
import { DiaryController } from './diary.controller';

// About
import { AboutController } from './about.controller';
import { AboutService } from './about.service';

// Search
import { SearchController } from './search.controller';

// Interactions
import { InteractionsController } from './interactions.controller';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
  ],
  controllers: [
    DashboardController,
    ArticlesController,
    CategoriesController,
    TagsController,
    GalleryController,
    GalleryCategoriesController,
    StickyNotesController,
    DiaryController,
    AboutController,
    SearchController,
    InteractionsController,
  ],
  providers: [
    ArticlesService,
    CategoriesService,
    TagsService,
    GalleryService,
    GalleryCategoriesService,
    StickyNotesService,
    DiaryService,
    AboutService,
    InteractionsService,
  ],
  exports: [
    ArticlesService,
    InteractionsService,
    DiaryService,
    GalleryService,
  ],
})
export class BlogModule {} 