import { IsEmail } from 'class-validator';

export class SendCodeDto {
  @IsEmail()
  mail: string;
}
