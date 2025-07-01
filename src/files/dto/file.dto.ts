import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UpdateFolderDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}

export class UploadFileDto {
  @IsUUID()
  @IsOptional()
  folderId?: string;
}

export class UpdateFileDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}

export class FileQueryDto {
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  type?: 'image' | 'video' | 'audio' | 'document' | 'other';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt' = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class FolderQueryDto {
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  pageSize?: number = 20;
} 