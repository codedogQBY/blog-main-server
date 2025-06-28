import { IsString, IsOptional, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number = 0;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  sort?: number;
} 