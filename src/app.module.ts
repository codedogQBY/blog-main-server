import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BlogModule } from './blog/blog.module';
import { FilesModule } from './files/files.module';
import { RbacModule } from './rbac/rbac.module';
import { MailModule } from './mail/mail.module';
import { SystemConfigModule } from './system-config.module';
import { LoggingModule } from './logging/logging.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BlogModule,
    FilesModule,
    RbacModule,
    MailModule,
    SystemConfigModule,
    LoggingModule,
    AiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
