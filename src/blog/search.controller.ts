import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ArticlesService } from './articles.service';
import { DiaryService } from './diary.service';
import { GalleryService } from './gallery.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly diaryService: DiaryService,
    private readonly galleryService: GalleryService,
  ) {}

  @Public()
  @Get()
  async search(
    @Query('q') query: string,
    @Query('limit') limit: string = '5',
  ) {
    if (!query || query.trim().length === 0) {
      return {
        articles: [],
        diaries: [],
        galleries: [],
        total: 0,
      };
    }

    const limitNum = parseInt(limit, 10);

    // 并行搜索文章、日记和图库
    const [articles, diaries, galleries] = await Promise.all([
      this.articlesService.findAll({
        search: query,
        page: 1,
        limit: limitNum,
        published: true,
      }),
      this.diaryService.findAllNotes({
        search: query,
        page: '1',
        limit: limit,
        status: 'public',
      }),
      this.galleryService.findAll({
        search: query,
        page: 1,
        limit: limitNum,
        status: 'published',
      }),
    ]);

    // 格式化返回数据
    const results = {
      articles: articles.data.map(item => ({
        id: item.id,
        title: item.title,
        type: 'article',
        excerpt: item.excerpt,
        slug: item.slug,
        publishedAt: item.publishedAt,
        category: item.category,
      })),
      diaries: diaries.data.map(item => ({
        id: item.id,
        title: item.title,
        type: 'diary',
        excerpt: item.content ? item.content.substring(0, 100) + '...' : '',
        date: item.date,
        weather: item.weather,
      })),
      galleries: galleries.items.map(item => ({
        id: item.id,
        title: item.title,
        type: 'gallery',
        excerpt: item.description || '',
        coverImage: item.coverImage,
        imageCount: item.stats?.imageCount || 0,
        category: item.category,
      })),
      total: articles.data.length + diaries.data.length + galleries.items.length,
    };

    return results;
  }
} 