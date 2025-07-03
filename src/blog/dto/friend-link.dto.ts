import { IsString, IsOptional, IsInt, Min, Max, IsUrl } from 'class-validator'

export class CreateFriendLinkDto {
  @IsString()
  name: string

  @IsUrl()
  url: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}

export class UpdateFriendLinkDto extends CreateFriendLinkDto {} 