import { IsString, IsOptional, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

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
} 