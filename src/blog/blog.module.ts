import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { CategoriesController } from './categories.controller';
import { ArticlesService } from './articles.service';
import { CategoriesService } from './categories.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArticlesController, CategoriesController],
  providers: [ArticlesService, CategoriesService],
  exports: [ArticlesService, CategoriesService],
})
export class BlogModule {} 