import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { jwtConstants } from './constants';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly verification: VerificationService,
  ) {}

  async validateUser(mail: string, password: string) {
    const user = await this.usersService.validateUser(mail, password);
    return user ?? null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.mail, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user.id);
  }

  async register(dto: RegisterDto) {
    await this.verification.validateCode(dto.mail, dto.code);
    const existing = await this.usersService.findByEmail(dto.mail);
    if (existing) throw new ConflictException('Mail already registered');
    const user = await this.usersService.create(
      dto.name,
      dto.mail,
      dto.password,
    );
    return this.signToken(user.id);
  }

  async sendCode(mail: string) {
    await this.verification.sendCode(mail);
    return { message: 'Code sent' };
  }

  private async buildPayload(userId: string) {
    const user = await this.usersService.getUserWithPerms(userId);
    // 如果是超级管理员，直接返回 ['*']
    const permissions = user?.isSuperAdmin 
      ? ['*'] 
      : user?.role?.perms.map((rp) => rp.permission.code) ?? [];
      
    return {
      sub: userId,
      name: user?.name,
      isSuperAdmin: user?.isSuperAdmin ?? false,
      permissions,
    } as const;
  }

  private async signToken(userId: string) {
    const payload = await this.buildPayload(userId);
    return {
      accessToken: this.jwt.sign(payload, { secret: jwtConstants.secret }),
    };
  }
}
