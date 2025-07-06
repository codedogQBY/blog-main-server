import { IsString, IsOptional, IsNotEmpty, IsObject, IsNumber, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// 用户信息DTO
export class UserInfoDto {
  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  osName?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;

  @IsString()
  @IsOptional()
  browserName?: string;

  @IsString()
  @IsOptional()
  browserVersion?: string;

  @IsNumber()
  @IsOptional()
  screenWidth?: number;

  @IsNumber()
  @IsOptional()
  screenHeight?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  languages?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsOptional()
  isAdmin?: boolean;
}

// 点赞请求DTO
export class ToggleLikeDto {
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @IsObject()
  userInfo: UserInfoDto;
}

// 评论请求DTO
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsObject()
  userInfo: UserInfoDto;
}

// 获取评论列表DTO
export class GetCommentsDto {
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsOptional()
  fingerprint?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

// 获取统计数据DTO
export class GetStatsDto {
  @IsString()
  @IsNotEmpty()
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsOptional()
  fingerprint?: string;
}

export interface ActivityLogItem {
  action: string;
  targetType: string;
  targetId: string;
  createdAt: Date;
  fingerprint: string | null;
}

export interface InteractionCommentGroupByItem {
  targetType: string;
  targetId: string;
  fingerprint?: string | null;
  author?: string | null;
  _count: {
    id: number;
  };
}

export interface LikeGroupByItem {
  targetType: string;
  targetId: string;
  _count: {
    id: number;
  };
}

export interface CommentTypeStats {
  type: string;
  count: number;
}

export interface DailyTrendStats {
  date: string;
  count: number;
}

export interface TopCommenter {
  fingerprint: string;
  author: string;
  count: number;
}

export interface TopContent {
  type: string;
  id: string;
  title: string;
  count: number;
}

export interface CommentStats {
  byType: CommentTypeStats[];
  dailyTrend: DailyTrendStats[];
  topCommenters: TopCommenter[];
  topContent: TopContent[];
}

export interface InteractionStats {
  overview: {
    totalLikes: number;
    totalComments: number;
    totalUsers: number;
    todayLikes: number;
    todayComments: number;
  };
  topTargets: Array<{
    targetType: string;
    targetId: string;
    likesCount: number;
  }>;
  recentActivity: Array<{
    action: string;
    targetType: string;
    targetId: string;
    timestamp: string;
    fingerprint: string;
  }>;
  commentStats: CommentStats;
} 