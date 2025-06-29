import { IsString, IsOptional, IsInt, Min, IsIn, IsObject, IsEmail, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// 用户信息DTO
export class UserInfoDto {
  @IsString()
  userAgent: string;

  @IsString()
  deviceType: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsObject()
  browserInfo?: {
    name: string;
    version: string;
    os: string;
  };

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  osName?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  browserName?: string;

  @IsOptional()
  @IsString()
  browserVersion?: string;

  @IsOptional()
  @IsInt()
  screenWidth?: number;

  @IsOptional()
  @IsInt()
  screenHeight?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

// 点赞请求DTO
export class ToggleLikeDto {
  @IsString()
  @IsIn(['article', 'sticky_note', 'gallery_image'])
  targetType: string;

  @IsString()
  targetId: string;

  @IsString()
  fingerprint: string;

  @IsObject()
  @Type(() => UserInfoDto)
  userInfo: UserInfoDto;
}

// 评论请求DTO
export class CreateCommentDto {
  @IsString()
  @IsIn(['article', 'sticky_note', 'gallery_image'])
  targetType: string;

  @IsString()
  targetId: string;

  @IsString()
  fingerprint: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsObject()
  @Type(() => UserInfoDto)
  userInfo: UserInfoDto;
}

// 获取评论列表DTO
export class GetCommentsDto {
  @IsString()
  @IsIn(['article', 'sticky_note', 'gallery_image'])
  targetType: string;

  @IsString()
  targetId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

// 获取统计数据DTO
export class GetStatsDto {
  @IsString()
  @IsIn(['article', 'sticky_note', 'gallery_image'])
  targetType: string;

  @IsString()
  targetId: string;

  @IsString()
  fingerprint: string;
} 