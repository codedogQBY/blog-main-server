import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { VerificationService } from './verification.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { jwtConstants } from './constants';
import { PrismaService } from '../prisma/prisma.service';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { TwoFactorAuxiliaryService } from './two-factor-auxiliary.service';
import { TwoFactorAuxiliaryController } from './two-factor-auxiliary.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    MailService,
    VerificationService,
    PrismaService,
    TwoFactorService,
    TwoFactorAuxiliaryService,
  ],
  controllers: [AuthController, TwoFactorController, TwoFactorAuxiliaryController],
  exports: [AuthService],
})
export class AuthModule {}
