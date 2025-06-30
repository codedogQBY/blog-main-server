import { IsString, IsOptional, IsIn, MaxLength, MinLength } from 'class-validator';

export class CreateStickyNoteDto {
  @IsString()
  @MinLength(1, { message: '留言内容不能为空' })
  @MaxLength(500, { message: '留言内容不能超过500字符' })
  content: string;

  @IsString()
  @MinLength(1, { message: '作者昵称不能为空' })
  @MaxLength(50, { message: '作者昵称不能超过50字符' })
  author: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '分类名称不能超过20字符' })
  category?: string;

  @IsOptional()
  @IsIn(['pink', 'yellow', 'blue', 'green', 'purple'], { 
    message: '颜色必须是 pink、yellow、blue、green、purple 中的一种' 
  })
  color?: string;

  @IsOptional()
  @IsIn(['public', 'private'], { 
    message: '状态必须是 public 或 private' 
  })
  status?: string;
}

export class UpdateStickyNoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '留言内容不能为空' })
  @MaxLength(500, { message: '留言内容不能超过500字符' })
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: '作者昵称不能为空' })
  @MaxLength(50, { message: '作者昵称不能超过50字符' })
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '分类名称不能超过20字符' })
  category?: string;

  @IsOptional()
  @IsIn(['pink', 'yellow', 'blue', 'green', 'purple'], { 
    message: '颜色必须是 pink、yellow、blue、green、purple 中的一种' 
  })
  color?: string;

  @IsOptional()
  @IsIn(['public', 'private'], { 
    message: '状态必须是 public 或 private' 
  })
  status?: string;
}

export class GetStickyNotesDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
} 