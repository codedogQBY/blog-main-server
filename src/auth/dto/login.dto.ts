import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  mail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
