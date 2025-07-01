import { IsString, IsOptional, IsUUID, IsArray, IsInt, IsIn, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAboutDto {
  @IsOptional()
  @IsString()
  heroAvatar?: string;

  @IsOptional()
  @IsString()
  heroSignature?: string;

  @IsString()
  @IsNotEmpty()
  introTitle: string;

  @IsArray()
  @IsString({ each: true })
  introContent: string[];

  @IsOptional()
  @IsString()
  introLogo?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class UpdateAboutDto extends CreateAboutDto {}

export class CreateAboutTagDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsIn(['left', 'right'])
  position: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsUUID()
  aboutId?: string;
}

export class UpdateAboutTagDto extends CreateAboutTagDto {}

export class CreateAboutSectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @IsString({ each: true })
  content: string[];

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsUUID()
  aboutId?: string;
}

export class UpdateAboutSectionDto extends CreateAboutSectionDto {}

export class CreateAboutImageDto {
  @IsString()
  @IsNotEmpty()
  src: string;

  @IsString()
  @IsNotEmpty()
  alt: string;

  @IsString()
  @IsNotEmpty()
  caption: string;

  @IsOptional()
  @IsInt()
  sort?: number;

  @IsOptional()
  @IsUUID()
  sectionId?: string;
}

export class UpdateAboutImageDto extends CreateAboutImageDto {}

export class BatchCreateAboutTagDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAboutTagDto)
  tags: CreateAboutTagDto[];
}

export class BatchCreateAboutImageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAboutImageDto)
  images: CreateAboutImageDto[];
} 