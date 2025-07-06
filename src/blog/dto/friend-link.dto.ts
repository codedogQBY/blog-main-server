import { IsString, IsOptional, IsInt, Min, Max, IsUrl, IsEmail } from 'class-validator'

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

export class ApplyFriendLinkDto {
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

  @IsEmail()
  email: string
}

export class AuditFriendLinkDto {
  @IsInt()
  @Min(0)
  @Max(2)
  auditStatus: number // 0: 待审核, 1: 已通过, 2: 已拒绝
} 