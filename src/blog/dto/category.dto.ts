import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID, IsEnum, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(['enabled', 'disabled'])
  @IsOptional()
  status?: string = 'enabled';

  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number = 0;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(['enabled', 'disabled'])
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number;
} 