import { Controller, Get, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { InteractionsService } from './interactions.service';
import { DiaryService } from './diary.service';
import { GalleryService } from './gallery.service';
import { UsersService } from '../users/users.service';
import { Permissions } from '../common/permissions.decorator';

interface TrendData {
  date: string;
  count?: number;
  comments?: number;
  likes?: number;
}

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly interactionsService: InteractionsService,
    private readonly diaryService: DiaryService,
    private readonly galleryService: GalleryService,
    private readonly usersService: UsersService,
  ) {}

  @Get('stats')
  @Permissions('dashboard.read')
  async getStats() {
    const [articles, interactions, diary, gallery, users] = await Promise.all([
      this.articlesService.getStats(),
      this.interactionsService.getStats(),
      this.diaryService.getStats(),
      this.galleryService.getStats(),
      this.usersService.getStats(),
    ]);

    return {
      articles,
      interactions: {
        comments: interactions.totalComments,
        likes: interactions.totalLikes,
      },
      diary,
      gallery,
      users,
    };
  }

  @Get('recent-activities')
  @Permissions('dashboard.read')
  async getRecentActivities() {
    const [articles, interactions] = await Promise.all([
      this.articlesService.getRecent(),
      this.interactionsService.getRecent(),
    ]);

    return {
      articles,
      comments: interactions.comments,
      likes: interactions.likes,
    };
  }

  @Get('trend')
  @Permissions('dashboard.read')
  async getTrend(@Query('type') type = 'articles'): Promise<TrendData[]> {
    switch (type) {
      case 'articles':
        return this.articlesService.getTrend();
      case 'interactions':
        return this.interactionsService.getTrend();
      case 'diary':
        return this.diaryService.getTrend();
      case 'gallery':
        return this.galleryService.getTrend();
      default:
        return this.articlesService.getTrend();
    }
  }
} 