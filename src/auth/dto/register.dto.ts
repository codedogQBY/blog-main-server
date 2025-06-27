import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  mail: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  code: string;
}
