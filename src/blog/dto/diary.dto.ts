import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsBoolean,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateDiaryNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['sunny', 'cloudy', 'rainy', 'snowy', 'partly-cloudy'])
  weather?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  mood?: number;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'private'])
  status?: string;
}

export class UpdateDiaryNoteDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['sunny', 'cloudy', 'rainy', 'snowy', 'partly-cloudy'])
  weather?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(5)
  mood?: number;

  @IsString()
  @IsOptional()
  @IsIn(['public', 'private'])
  status?: string;
}

export class GetDiaryNotesDto {
  @IsString()
  @IsOptional()
  page?: string = '1';

  @IsString()
  @IsOptional()
  limit?: string = '8';

  @IsString()
  @IsOptional()
  weather?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: string = 'desc';
}

export class CreateDiarySignatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  signatureName: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsString()
  @IsOptional()
  fontSize?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  rotation?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDiarySignatureDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  signatureName?: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsString()
  @IsOptional()
  fontSize?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  rotation?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateDiaryWeatherConfigDto {
  @IsString()
  @IsNotEmpty()
  weatherType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  weatherName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsInt()
  @IsOptional()
  sort?: number;
}

export class UpdateDiaryWeatherConfigDto {
  @IsString()
  @IsOptional()
  @MaxLength(32)
  weatherName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsInt()
  @IsOptional()
  sort?: number;
}