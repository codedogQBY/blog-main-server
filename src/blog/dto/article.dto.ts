import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  IsBoolean, 
  IsArray, 
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  IsDateString
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean = false;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsInt()
  @IsOptional()
  @Min(1)
  readTime?: number;
}

export class UpdateArticleDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  slug?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsInt()
  @IsOptional()
  @Min(1)
  readTime?: number;
} 