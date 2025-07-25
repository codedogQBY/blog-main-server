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
import { TwoFactorAuxiliaryService } from './two-factor-auxiliary.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
    private readonly verification: VerificationService,
    private readonly auxiliaryService: TwoFactorAuxiliaryService,
  ) {}

  async validateUser(mail: string, password: string) {
    const user = await this.usersService.validateUser(mail, password);
    return user ?? null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.mail, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    // 检查用户是否被锁定
    const lockStatus = await this.auxiliaryService.isUserLocked(user.id);
    if (lockStatus.locked) {
      throw new UnauthorizedException(`账户已被锁定，剩余时间：${lockStatus.remainingMinutes}分钟`);
    }
    
    // 使用类型断言来访问2FA字段
    const userWithTwoFA = user as any;
    
    // 检查用户是否启用了2FA
    if (userWithTwoFA.twoFactorEnabled) {
      // 如果启用了2FA，返回需要验证的信息
      return {
        requires2FA: true,
        userId: user.id,
        message: '需要2FA验证'
      };
    }
    
    // 如果没有启用2FA，返回用户信息和token，前端判断是否需要设置2FA
    const token = await this.signToken(user.id);
    return {
      ...token,
      user: {
        id: user.id,
        name: user.name,
        mail: user.mail,
        twoFactorEnabled: userWithTwoFA.twoFactorEnabled ?? false,
        isSuperAdmin: user.isSuperAdmin
      },
      needsSetup2FA: !(userWithTwoFA.twoFactorEnabled ?? false) // 标识是否需要设置2FA
    };
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

  // 公共方法，供其他服务使用
  async generateToken(userId: string) {
    const payload = await this.buildPayload(userId);
    return {
      accessToken: this.jwt.sign(payload, { secret: jwtConstants.secret }),
    };
  }
}
