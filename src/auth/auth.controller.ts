import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { SendCodeDto } from './dto/send-code.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto.mail);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }
}
